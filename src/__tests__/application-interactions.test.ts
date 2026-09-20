import { describe, it, expect } from 'vitest';
import { Clause, AttentionItem, LegalDocument, TimelineEvent } from '../types';
import { getFallbackQAResponse } from '../../server/services/gemini-service';

describe('Application State & Interaction Flows Suite', () => {
  const mockDocuments: LegalDocument[] = [
    {
      documentId: 'doc_1',
      workspaceId: 'ws_1',
      ownerId: 'usr_1',
      fileName: 'Master_Services_Agreement_2025.pdf',
      fileSize: 1024 * 500,
      fileType: 'application/pdf',
      processingStatus: 'processed',
      analysisStatus: 'completed',
      summaryPreview: 'Enterprise master services agreement.',
      uploadTimestamp: '2025-01-01T00:00:00.000Z',
    },
    {
      documentId: 'doc_2',
      workspaceId: 'ws_1',
      ownerId: 'usr_1',
      fileName: 'Mutual_NDA_Draft.pdf',
      fileSize: 1024 * 250,
      fileType: 'application/pdf',
      processingStatus: 'processed',
      analysisStatus: 'completed',
      summaryPreview: 'Mutual non-disclosure agreement.',
      uploadTimestamp: '2025-01-02T00:00:00.000Z',
    },
  ];

  const mockClauses: Clause[] = [
    {
      clauseId: 'cl_term_01',
      workspaceId: 'ws_1',
      documentId: 'doc_1',
      ownerId: 'usr_1',
      type: 'term_and_termination',
      title: 'Section 4.1 - Non-Renewal Notice Period',
      originalText: 'Notice of non-renewal must be delivered in writing at least thirty (30) days prior to renewal.',
      plainExplanation: 'You must deliver written notice 30 days before the contract renews.',
      riskLevel: 'moderate',
      section: 'Section 4.1',
    },
    {
      clauseId: 'cl_liab_01',
      workspaceId: 'ws_1',
      documentId: 'doc_1',
      ownerId: 'usr_1',
      type: 'liability',
      title: 'Section 8.3 - 12-Month Aggregate Liability Cap',
      originalText: "In no event shall aggregate liability exceed the total amount of fees paid in the twelve (12) months preceding the incident.",
      plainExplanation: 'Damages are capped to the previous 12 months of paid fees.',
      riskLevel: 'critical',
      section: 'Section 8.3',
    },
  ];

  const mockAttentionItems: AttentionItem[] = [
    {
      id: 'att_red_1',
      category: 'RED',
      title: '12-Month Aggregate Liability Ceiling',
      description: 'Liability is strictly capped to the past 12 months of fees.',
      source: {
        documentName: 'Master_Services_Agreement_2025.pdf',
        pageNumber: 7,
        section: 'Section 8.3',
        sourceText: "In no event shall aggregate liability exceed fees paid in the twelve (12) months preceding the incident.",
      },
      relatedClauseId: 'cl_liab_01',
      recommendation: 'Seek counsel on whether gross negligence is excluded from this cap.',
    },
    {
      id: 'att_amber_1',
      category: 'AMBER',
      title: '30-Day Prior Non-Renewal Notice',
      description: 'Failure to give notice will cause automatic 1-year extension.',
      source: {
        documentName: 'Master_Services_Agreement_2025.pdf',
        pageNumber: 4,
        section: 'Section 4.1',
        sourceText: 'Notice of non-renewal must be delivered in writing at least thirty (30) days prior to renewal.',
      },
      relatedClauseId: 'cl_term_01',
      recommendation: 'Calendar reminder 45 days prior to anniversary.',
    },
  ];

  describe('1. Document Selection & Switching', () => {
    it('selects active document and filters associated data accurately', () => {
      let activeDocId: string | null = 'doc_1';

      const getActiveDocument = (id: string | null) =>
        mockDocuments.find(d => d.documentId === id) || null;

      expect(getActiveDocument(activeDocId)?.fileName).toBe('Master_Services_Agreement_2025.pdf');

      // Switch to second document
      activeDocId = 'doc_2';
      expect(getActiveDocument(activeDocId)?.fileName).toBe('Mutual_NDA_Draft.pdf');

      // Invalid ID returns null safely
      activeDocId = 'doc_nonexistent';
      expect(getActiveDocument(activeDocId)).toBeNull();
    });

    it('falls back to the first document if the active document is removed', () => {
      const currentList = [...mockDocuments];
      let activeId = 'doc_2';

      // Remove doc_2
      const updatedList = currentList.filter(d => d.documentId !== 'doc_2');
      if (!updatedList.some(d => d.documentId === activeId)) {
        activeId = updatedList[0]?.documentId || '';
      }

      expect(activeId).toBe('doc_1');
    });
  });

  describe('2. Attention Item Selection & Clause Association', () => {
    it('links attention item to related clause when clicked', () => {
      const selectedAttention = mockAttentionItems[0]; // RED item
      expect(selectedAttention.relatedClauseId).toBe('cl_liab_01');

      const matchingClause = mockClauses.find(c => c.clauseId === selectedAttention.relatedClauseId);
      expect(matchingClause).toBeDefined();
      expect(matchingClause?.title).toContain('12-Month Aggregate Liability Cap');
      expect(matchingClause?.riskLevel).toBe('critical');
    });

    it('filters attention items by category (RED, AMBER, GREEN)', () => {
      const redItems = mockAttentionItems.filter(i => i.category === 'RED');
      const amberItems = mockAttentionItems.filter(i => i.category === 'AMBER');
      const greenItems = mockAttentionItems.filter(i => i.category === 'GREEN');

      expect(redItems.length).toBe(1);
      expect(amberItems.length).toBe(1);
      expect(greenItems.length).toBe(0);
    });
  });

  describe('3. Clause Selection & Detail Inspection', () => {
    it('provides both verbatim legal excerpt and plain English translation upon selection', () => {
      const selectedClause = mockClauses[0];

      expect(selectedClause.originalText).toContain('Notice of non-renewal must be delivered in writing');
      expect(selectedClause.plainExplanation).toContain('You must deliver written notice 30 days before');
      expect(selectedClause.section).toBe('Section 4.1');
    });

    it('filters clauses by risk level (critical, high, moderate, low)', () => {
      const criticalClauses = mockClauses.filter(c => c.riskLevel === 'critical');
      const lowClauses = mockClauses.filter(c => c.riskLevel === 'low');

      expect(criticalClauses.length).toBe(1);
      expect(lowClauses.length).toBe(0);
    });
  });

  describe('4. Grounded Q&A Interaction Flow', () => {
    it('answers questions regarding liability caps with grounded citations', () => {
      const answer = getFallbackQAResponse(
        'What is the aggregate liability cap?',
        'Master_Services_Agreement_2025.pdf',
        'Section 8.3 limits liability to fees paid in past 12 months.'
      );

      expect(answer.foundInDocument).toBe(true);
      expect(answer.answer).toContain('Section 8.3');
      expect(answer.sourceReferences.length).toBeGreaterThan(0);
      expect(answer.sourceReferences[0].pageNumber).toBe(7);
      expect(answer.disclaimer).toBeTruthy();
    });

    it('memoizes repeated Q&A queries to avoid redundant network roundtrips', () => {
      const qaCache = new Map<string, typeof mockAttentionItems>();
      let queryCount = 0;

      const askQuestion = (query: string) => {
        if (qaCache.has(query)) {
          return qaCache.get(query);
        }
        queryCount++;
        const res = getFallbackQAResponse(query, 'Master_Services_Agreement_2025.pdf');
        qaCache.set(query, res as unknown as typeof mockAttentionItems);
        return res;
      };

      askQuestion('What is the notice period?');
      expect(queryCount).toBe(1);

      askQuestion('What is the notice period?'); // cached
      expect(queryCount).toBe(1);

      askQuestion('What are the payment terms?');
      expect(queryCount).toBe(2);
    });
  });

  describe('5. Preparation Questions & Negotiation Brief Generation', () => {
    it('constructs structured preparation briefs and attorney discussion points', () => {
      interface PrepBrief {
        documentTitle: string;
        redFlags: number;
        strategicQuestions: string[];
        recommendedProposals: string[];
      }

      const generatePreparationBrief = (
        docTitle: string,
        clauses: Clause[],
        attention: AttentionItem[]
      ): PrepBrief => {
        const redCount = attention.filter(a => a.category === 'RED').length;
        const questions: string[] = [];
        const proposals: string[] = [];

        clauses.forEach(cl => {
          if (cl.riskLevel === 'critical' || cl.riskLevel === 'high') {
            questions.push(`Can we negotiate a mutual carve-out or sub-cap for ${cl.title}?`);
            proposals.push(`Propose 2x annual fee ceiling on ${cl.section}.`);
          }
        });

        return {
          documentTitle: docTitle,
          redFlags: redCount,
          strategicQuestions: questions,
          recommendedProposals: proposals,
        };
      };

      const brief = generatePreparationBrief(
        'Master_Services_Agreement_2025.pdf',
        mockClauses,
        mockAttentionItems
      );

      expect(brief.documentTitle).toBe('Master_Services_Agreement_2025.pdf');
      expect(brief.redFlags).toBe(1);
      expect(brief.strategicQuestions.length).toBe(1);
      expect(brief.strategicQuestions[0]).toContain('12-Month Aggregate Liability Cap');
      expect(brief.recommendedProposals[0]).toContain('Section 8.3');
    });
  });

  describe('6. Error States & Loading Indicators', () => {
    it('manages upload error state and lifecycle transitions cleanly', () => {
      let uploadError: string | null = null;
      let uploading = false;
      let uploadProgress = 0;

      const startUpload = () => {
        uploading = true;
        uploadProgress = 10;
        uploadError = null;
      };

      const failUpload = (msg: string) => {
        uploading = false;
        uploadProgress = 0;
        uploadError = msg;
      };

      startUpload();
      expect(uploading).toBe(true);
      expect(uploadProgress).toBe(10);
      expect(uploadError).toBeNull();

      failUpload('Network interrupted during document transmission.');
      expect(uploading).toBe(false);
      expect(uploadProgress).toBe(0);
      expect(uploadError).toBe('Network interrupted during document transmission.');
    });

    it('tracks progressive upload milestones (15% -> 50% -> 100%)', () => {
      let progress = 0;
      const progressUpdates: number[] = [];

      const setProgress = (val: number) => {
        progress = val;
        progressUpdates.push(val);
      };

      setProgress(15);
      setProgress(50);
      setProgress(100);

      expect(progress).toBe(100);
      expect(progressUpdates).toEqual([15, 50, 100]);
    });
  });
});
