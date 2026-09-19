import { describe, it, expect } from 'vitest';
import {
  AIAnalysisOutputSchema,
  AttentionItemSchema,
  DocumentAnswerSchema,
  SourceReferenceSchema,
} from '../schemas/ai-schemas';
import {
  getRealisticAnalysis,
  getFallbackQAResponse,
} from '../../server/services/gemini-service';

describe('Document Intelligence Pipeline & Schema Tests', () => {
  describe('Source Reference & Citation Schema', () => {
    it('validates a complete source reference', () => {
      const source = {
        documentName: 'Master_Services_Agreement.pdf',
        pageNumber: 3,
        section: 'Section 8.2 (Indemnification)',
        sourceText: 'Provider shall indemnify and hold harmless Customer from third-party claims.',
      };

      const result = SourceReferenceSchema.safeParse(source);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageNumber).toBe(3);
        expect(result.data.section).toBe('Section 8.2 (Indemnification)');
      }
    });

    it('allows source reference with optional page number and sourceText', () => {
      const source = {
        documentName: 'Addendum_A.pdf',
        section: 'Schedule 1',
      };

      const result = SourceReferenceSchema.safeParse(source);
      expect(result.success).toBe(true);
    });
  });

  describe('Attention Engine Categorization Schema', () => {
    it('validates RED ("Needs attention") item with factual source excerpt', () => {
      const redItem = {
        id: 'att_01',
        category: 'RED',
        title: 'Uncapped Liability for Service Outages',
        description: 'Section 12 specifically excludes operational service downtime from the standard liability cap.',
        source: {
          documentName: 'SaaS_Agreement.pdf',
          pageNumber: 12,
          section: 'Section 12.4',
          sourceText: 'The aggregate liability limitations in Section 12.1 shall not apply to claims arising under Service Availability commitments.',
        },
        relatedClauseId: 'clause_12_4',
        recommendation: 'Ask counsel whether a mutual sub-cap (e.g., 2x annual fees) can be established.',
      };

      const result = AttentionItemSchema.safeParse(redItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('RED');
        expect(result.data.source?.pageNumber).toBe(12);
      }
    });

    it('rejects invalid attention categories like BLUE or DANGER', () => {
      const invalidItem = {
        id: 'att_bad',
        category: 'BLUE', // Not RED, AMBER, or GREEN
        title: 'Random Flag',
        description: 'Some text',
      };

      const result = AttentionItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('Grounded Q&A Answer Schema (DocumentAnswerSchema)', () => {
    it('validates a grounded answer with citations and verified excerpts', () => {
      const answer = {
        answer: 'The contract requires 60 days advance written notice prior to the end of the current term to prevent automatic renewal.',
        foundInDocument: true,
        sourceReferences: [
          {
            documentName: 'MSA.pdf',
            pageNumber: 5,
            section: 'Section 4.2 (Term & Renewal)',
            sourceText: 'Either party may terminate by providing sixty (60) days prior written notice.',
          },
        ],
        limitation: 'The document does not specify whether email notification satisfies the written notice requirement.',
        disclaimer: 'Confirm with your attorney what method of notice delivery is legally recognized.',
      };

      const result = DocumentAnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.foundInDocument).toBe(true);
        expect(result.data.sourceReferences.length).toBe(1);
        expect(result.data.sourceReferences[0].pageNumber).toBe(5);
      }
    });

    it('validates a grounded answer stating the topic is not covered in the document', () => {
      const answer = {
        answer: 'The provided document does not contain any provisions regarding stock option acceleration.',
        foundInDocument: false,
        sourceReferences: [],
        limitation: 'Request the separate Equity Incentive Plan document from counsel.',
      };

      const result = DocumentAnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.foundInDocument).toBe(false);
        expect(result.data.sourceReferences.length).toBe(0);
      }
    });
  });

  describe('Document Intelligence Service Execution & Output Conformance', () => {
    it('generates structured analysis with attention items, clauses, and timeline', () => {
      const result = getRealisticAnalysis('Commercial_Lease_Agreement.pdf');

      expect(result).toBeDefined();
      expect(result.summary).toBeTruthy();
      expect(Array.isArray(result.clauses)).toBe(true);
      expect(result.clauses.length).toBeGreaterThan(0);
      expect(Array.isArray(result.attentionItems)).toBe(true);
      expect(result.attentionItems!.length).toBeGreaterThan(0);

      // Verify each attention item conforms to schema
      result.attentionItems!.forEach(item => {
        const itemValidation = AttentionItemSchema.safeParse(item);
        expect(itemValidation.success).toBe(true);
        expect(['RED', 'AMBER', 'GREEN']).toContain(item.category);
        expect(item.title).toBeTruthy();
        expect(item.description).toBeTruthy();
      });

      // Verify full analysis schema
      const fullValidation = AIAnalysisOutputSchema.safeParse(result);
      expect(fullValidation.success).toBe(true);
    });

    it('answers user questions grounded in document text with citations', () => {
      const qResult = getFallbackQAResponse(
        'What are the termination conditions?',
        'Vendor_Agreement.pdf',
        'The agreement includes 30 days termination for convenience.'
      );

      expect(qResult).toBeDefined();
      expect(qResult.answer).toBeTruthy();
      expect(qResult.foundInDocument).toBe(true);
      expect(Array.isArray(qResult.sourceReferences)).toBe(true);
      expect(qResult.sourceReferences.length).toBeGreaterThan(0);

      // Verify response passes DocumentAnswerSchema
      const qaValidation = DocumentAnswerSchema.safeParse(qResult);
      expect(qaValidation.success).toBe(true);
    });
  });
});
