import { describe, it, expect } from 'vitest';
import {
  AIAnalysisOutputSchema,
  AttentionItemSchema,
  DocumentAnswerSchema,
  SourceReferenceSchema,
  ClauseSchema,
} from '../schemas/ai-schemas';
import {
  getRealisticAnalysis,
  getFallbackQAResponse,
} from '../../server/services/gemini-service';

describe('AI Behavior & Grounding Quality Suite', () => {
  describe('1. Valid Structured AI Output', () => {
    it('validates a complete, high-fidelity contract analysis output', () => {
      const sampleOutput = {
        summary: 'A 3-year enterprise software license and cloud hosting agreement with bilateral covenants.',
        documentType: 'Master Services Agreement',
        title: 'Enterprise Cloud Agreement',
        parties: [
          { name: 'Acme Corp', role: 'Customer' },
          { name: 'CloudTech Solutions LLC', role: 'Provider' },
        ],
        keyTakeaways: [
          '3-year initial term with automatic 1-year renewals.',
          'Annual fees payable Net 30 with 1.5% late fee interest.',
          'Aggregate liability limited to fees paid in preceding 12 months.',
        ],
        clauses: [
          {
            clauseId: 'cl_01',
            type: 'term_and_termination',
            title: 'Section 4.1 - Term & Renewal',
            originalExcerpt: 'This Agreement shall commence on the Effective Date and remain in effect for three (3) years.',
            originalText: 'This Agreement shall commence on the Effective Date and remain in effect for three (3) years.',
            plainExplanation: 'The contract lasts for 3 full years from the start date.',
            riskLevel: 'low',
            importanceCategory: 'high',
            section: 'Section 4.1',
            sourceReference: {
              documentName: 'Enterprise_Agreement.pdf',
              pageNumber: 2,
              section: 'Section 4.1',
              sourceText: 'This Agreement shall commence on the Effective Date and remain in effect for three (3) years.',
            },
          },
        ],
        attentionItems: [
          {
            id: 'att_01',
            category: 'RED',
            title: 'Automatic Renewal Cutoff',
            description: 'Requires written notice 60 days prior to end of term to stop auto-renewal.',
            source: {
              documentName: 'Enterprise_Agreement.pdf',
              pageNumber: 3,
              section: 'Section 4.2',
              sourceText: 'Notice of non-renewal must be received at least sixty (60) days prior to the expiration of the current term.',
            },
            relatedClauseId: 'cl_01',
            recommendation: 'Add reminder to legal calendar 90 days before renewal.',
          },
        ],
        insights: [
          {
            type: 'risk',
            title: 'Uncapped Data Breach Indemnity',
            description: 'Indemnification obligations for security incidents are carved out of the standard liability cap.',
            severity: 'warning',
            recommendation: 'Propose a mutual super-cap for data protection liabilities.',
          },
        ],
        timeline: [
          {
            date: 'Effective Date',
            title: 'Contract Commencement',
            description: 'All service level agreements become binding.',
            importance: 'important',
          },
        ],
      };

      const parsed = AIAnalysisOutputSchema.safeParse(sampleOutput);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.clauses.length).toBe(1);
        expect(parsed.data.attentionItems?.length).toBe(1);
        expect(parsed.data.attentionItems?.[0].category).toBe('RED');
        expect(parsed.data.parties?.length).toBe(2);
      }
    });

    it('generates compliant structured analysis from realistic contract generator', () => {
      const generated = getRealisticAnalysis('Consulting_Services_Agreement.pdf');
      const validation = AIAnalysisOutputSchema.safeParse(generated);

      expect(validation.success).toBe(true);
      expect(generated.summary).toBeTruthy();
      expect(generated.clauses.length).toBeGreaterThan(0);
      expect(generated.attentionItems && generated.attentionItems.length).toBeGreaterThan(0);
    });
  });

  describe('2. Invalid AI Output & Strict Validation Errors', () => {
    it('rejects AI output missing summary', () => {
      const invalid = {
        clauses: [],
        keyTakeaways: [],
        insights: [],
        timeline: [],
      };

      const result = AIAnalysisOutputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid clause risk levels', () => {
      const invalidClause = {
        title: 'Payment Terms',
        originalExcerpt: 'Net 30 days',
        plainExplanation: 'Pay in 30 days',
        riskLevel: 'catastrophic_danger', // Invalid risk level
      };

      const result = AIAnalysisOutputSchema.shape.clauses.element.safeParse(invalidClause);
      expect(result.success).toBe(false);
    });

    it('rejects invalid attention item categories', () => {
      const invalidAttention = {
        id: 'att_bad',
        category: 'PURPLE', // Only RED, AMBER, GREEN permitted
        title: 'Custom Flag',
        description: 'Description text',
      };

      const result = AttentionItemSchema.safeParse(invalidAttention);
      expect(result.success).toBe(false);
    });

    it('rejects malformed grounded Q&A responses with non-boolean foundInDocument', () => {
      const badQAResponse = {
        answer: 'Some answer',
        foundInDocument: 'yes', // Should be boolean
        sourceReferences: [],
      };

      const result = DocumentAnswerSchema.safeParse(badQAResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('3. Missing Information & Missing Context Handling', () => {
    it('accurately identifies when information is missing from the document', () => {
      const missingInfoResponse = {
        answer: 'The provided document does not contain any governing law or jurisdiction provision.',
        foundInDocument: false,
        sourceReferences: [],
        confidence: 'high' as const,
        limitation: 'Check whether a separate master terms or schedule was executed.',
        disclaimer: 'Legal Lens provides informational assistance and does not constitute formal legal advice.',
      };

      const result = DocumentAnswerSchema.safeParse(missingInfoResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.foundInDocument).toBe(false);
        expect(result.data.sourceReferences.length).toBe(0);
        expect(result.data.limitation).toBeTruthy();
      }
    });

    it('handles documents with no specific indemnification clause gracefully', () => {
      const docAnalysis = getRealisticAnalysis('Simple_NDA.pdf');
      expect(docAnalysis.summary).toBeTruthy();
      expect(Array.isArray(docAnalysis.clauses)).toBe(true);
      expect(Array.isArray(docAnalysis.timeline)).toBe(true);
    });
  });

  describe('4. Unsupported / Off-Topic Question Handling', () => {
    it('returns foundInDocument=false with clear limitation for unsupported off-topic questions', () => {
      const offTopicQuery = 'What will the weather in Paris be tomorrow?';
      const response = getFallbackQAResponse(offTopicQuery, 'Software_License.pdf');

      expect(response.foundInDocument).toBe(false);
      expect(response.sourceReferences.length).toBe(0);
      expect(response.answer).toContain("couldn't find any information");
      expect(response.limitation).toContain('strictly confines responses to the explicit factual text');
    });

    it('confines answers to contract topics and disclaims external financial predictions', () => {
      const stockQuery = 'What is the stock market price of Apple?';
      const response = getFallbackQAResponse(stockQuery, 'Commercial_Lease.pdf');

      expect(response.foundInDocument).toBe(false);
      expect(response.sourceReferences).toEqual([]);
      expect(response.disclaimer).toBeTruthy();
    });
  });

  describe('5. Source Reference & Citation Validation', () => {
    it('validates citations containing section, page number, and original verbatim quote', () => {
      const citation = {
        documentName: 'Master_Services_Agreement_2025.pdf',
        pageNumber: 7,
        section: 'Section 8.3 (Limitation of Liability)',
        sourceText: "In no event shall either party's aggregate cumulative liability exceed fees paid in the twelve (12) months preceding the incident.",
      };

      const parsed = SourceReferenceSchema.safeParse(citation);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.pageNumber).toBe(7);
        expect(parsed.data.section).toBe('Section 8.3 (Limitation of Liability)');
        expect(parsed.data.sourceText).toBeTruthy();
      }
    });

    it('accepts citation without optional page number for unpaginated exhibits', () => {
      const citation = {
        documentName: 'Exhibit_B_Statement_of_Work.pdf',
        section: 'Attachment 1 - Milestones',
      };

      const parsed = SourceReferenceSchema.safeParse(citation);
      expect(parsed.success).toBe(true);
    });
  });

  describe('6. Original Legal Text Preservation', () => {
    it('preserves exact verbatim excerpt alongside plain-language explanation', () => {
      const exactContractText =
        'INDEMNITOR SHALL DEFEND, INDEMNIFY AND HOLD HARMLESS INDEMNITEE AGAINST ALL THIRD-PARTY CLAIMS ARISING FROM WILLFUL MISCONDUCT.';

      const clause = {
        title: 'Indemnification Obligation',
        originalExcerpt: exactContractText,
        originalText: exactContractText,
        plainExplanation: 'You are obligated to protect the other party and pay their legal expenses if you engage in deliberate misconduct.',
        riskLevel: 'high' as const,
        section: 'Section 10.1',
      };

      const result = AIAnalysisOutputSchema.shape.clauses.element.safeParse(clause);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.originalExcerpt).toBe(exactContractText);
        expect(result.data.plainExplanation).not.toBe(exactContractText);
      }
    });

    it('verifies realistic analysis preserves raw clause excerpts in clauses and attention items', () => {
      const analysis = getRealisticAnalysis('Master_Services_Agreement.pdf');
      
      analysis.clauses.forEach(clause => {
        expect(clause.originalExcerpt || clause.originalText).toBeTruthy();
        expect(clause.plainExplanation).toBeTruthy();
      });

      analysis.attentionItems?.forEach(item => {
        expect(item.source.sourceText).toBeTruthy();
      });
    });
  });
});
