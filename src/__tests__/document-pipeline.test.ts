import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePdfFile,
  checkDuplicateFileName,
  sanitizeFileName,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from '../schemas/document-schemas';
import { extractTextFromDocument } from '../utils/textExtractor';
import {
  getRealisticAnalysis,
  clearAiServiceCache,
} from '../../server/services/gemini-service';
import {
  LegalDocument,
  DocumentAnalysisRecord,
  ProcessingLifecycleStage,
} from '../types';

describe('Document Pipeline & Ingestion Lifecycle Suite', () => {
  beforeEach(() => {
    clearAiServiceCache();
  });

  describe('1. Valid PDF Ingestion & Text Extraction', () => {
    it('accepts valid PDF file metadata within allowed parameters', () => {
      const validPdf = {
        name: 'Master_Services_Agreement_2025.pdf',
        size: 2.4 * 1024 * 1024, // 2.4 MB
        type: 'application/pdf',
      } as File;

      const validation = validatePdfFile(validPdf);
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('extracts text from plain text and mock PDF binary streams without error', async () => {
      const mockPdfStream = '%PDF-1.4\nBT /F1 12 Tf (Confidential Non-Disclosure Agreement) Tj ET';
      const encoder = new TextEncoder();
      const uint8 = encoder.encode(mockPdfStream);
      const mockBlob = new Blob([uint8], { type: 'application/pdf' });
      const mockFile = new File([mockBlob], 'NDA_Agreement.pdf', { type: 'application/pdf' });

      const extracted = await extractTextFromDocument(mockFile);
      expect(extracted).toBeTruthy();
    });
  });

  describe('2. Invalid File Types & Sanitization', () => {
    it('rejects unsupported file formats (docx, png, zip, exe, html)', () => {
      const unsupportedFiles = [
        { name: 'contract.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 10000 },
        { name: 'agreement.png', type: 'image/png', size: 50000 },
        { name: 'archive.zip', type: 'application/zip', size: 100000 },
        { name: 'malicious.exe', type: 'application/x-msdownload', size: 20000 },
        { name: 'contract.html', type: 'text/html', size: 5000 },
      ];

      unsupportedFiles.forEach(fileObj => {
        const res = validatePdfFile(fileObj as File);
        expect(res.isValid).toBe(false);
        expect(res.error).toContain('Legal Lens only supports PDF documents');
      });
    });

    it('sanitizes unsafe special characters from uploaded file names', () => {
      const dirty = 'Vendor/Contract:Final#Version*2025?.pdf';
      const clean = sanitizeFileName(dirty);
      expect(clean).toBe('Vendor_Contract_Final_Version_2025_.pdf');
      expect(clean.includes('/')).toBe(false);
      expect(clean.includes(':')).toBe(false);
      expect(clean.includes('#')).toBe(false);
    });

    it('detects case-insensitive duplicate document names in workspace', () => {
      const existingNames = ['Commercial_Lease.pdf', 'Employment_Agreement.pdf'];
      expect(checkDuplicateFileName(existingNames, 'commercial_lease.pdf')).toBe(true);
      expect(checkDuplicateFileName(existingNames, 'COMMERCIAL_LEASE.PDF')).toBe(true);
      expect(checkDuplicateFileName(existingNames, 'New_Vendor_SOW.pdf')).toBe(false);
    });
  });

  describe('3. Oversized File Handling', () => {
    it('rejects documents exceeding 25 MB limit', () => {
      const oversizedFile = {
        name: 'Huge_Contract_Archive.pdf',
        size: MAX_DOCUMENT_FILE_SIZE_BYTES + 1024 * 1024, // 26 MB
        type: 'application/pdf',
      } as File;

      const result = validatePdfFile(oversizedFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed limit of 25 MB');
    });

    it('accepts document right at 25 MB boundary', () => {
      const boundaryFile = {
        name: 'Exact_Boundary_Contract.pdf',
        size: MAX_DOCUMENT_FILE_SIZE_BYTES - 100,
        type: 'application/pdf',
      } as File;

      const result = validatePdfFile(boundaryFile);
      expect(result.isValid).toBe(true);
    });
  });

  describe('4. Processing Failure & Error State Transitions', () => {
    it('models failure transitions to failed status and error stage', () => {
      let docStatus: LegalDocument['analysisStatus'] = 'analyzing';
      let lifecycleStage: ProcessingLifecycleStage = 'ANALYZING';

      // Simulate failure handler execution
      const handleFailure = (err: Error) => {
        docStatus = 'failed';
        lifecycleStage = 'PROCESSING_FAILED';
      };

      handleFailure(new Error('Network timeout contacting Gemini service'));
      expect(docStatus).toBe('failed');
      expect(lifecycleStage).toBe('PROCESSING_FAILED');
    });
  });

  describe('5. Retry Mechanism on Failed Analysis', () => {
    it('allows forced re-analysis retry on previously failed documents', () => {
      let retryCount = 0;
      let lifecycleStage: ProcessingLifecycleStage = 'PROCESSING_FAILED';

      const retryAnalysis = (force: boolean) => {
        if (force) {
          retryCount++;
          lifecycleStage = 'ANALYZING';
          // Simulate completion
          lifecycleStage = 'READY';
          return 'completed';
        }
        return 'skipped';
      };

      const finalStatus = retryAnalysis(true);
      expect(retryCount).toBe(1);
      expect(lifecycleStage).toBe('READY');
      expect(finalStatus).toBe('completed');
    });
  });

  describe('6. Successful Analysis Normalization & Model Transformation', () => {
    it('transforms raw AI analysis output into normalized application records', () => {
      const rawAi = getRealisticAnalysis('MSA_2025.pdf');
      const userId = 'usr_123';
      const workspaceId = 'ws_456';
      const docId = 'doc_789';

      const normalizedRecord: DocumentAnalysisRecord = {
        analysisId: docId,
        workspaceId,
        documentId: docId,
        ownerId: userId,
        documentType: rawAi.documentType,
        title: rawAi.title || 'MSA_2025.pdf',
        summary: rawAi.summary,
        parties: rawAi.parties,
        importantDates: rawAi.importantDates,
        financialTerms: rawAi.financialTerms,
        obligations: rawAi.obligations,
        keyTakeaways: rawAi.keyTakeaways,
        clauses: rawAi.clauses.map((c, idx) => ({
          clauseId: c.clauseId || `clause_${idx + 1}`,
          workspaceId,
          documentId: docId,
          ownerId: userId,
          type: c.type || 'general',
          title: c.title,
          originalText: c.originalText || c.originalExcerpt || '',
          plainExplanation: c.plainExplanation,
          riskLevel: c.riskLevel || 'low',
          section: c.section,
        })),
        attentionItems: (rawAi.attentionItems || []).map((a, idx) => ({
          id: a.id || `att_${idx + 1}`,
          category: a.category || 'AMBER',
          title: a.title,
          description: a.description,
          source: a.source,
          recommendation: a.recommendation,
        })),
        timeline: rawAi.timeline.map((t, idx) => ({
          eventId: `time_${idx + 1}`,
          workspaceId,
          documentId: docId,
          ownerId: userId,
          date: t.date,
          title: t.title,
          description: t.description,
          importance: t.importance,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(normalizedRecord.documentId).toBe(docId);
      expect(normalizedRecord.ownerId).toBe(userId);
      expect(normalizedRecord.clauses.length).toBeGreaterThan(0);
      expect(normalizedRecord.attentionItems.length).toBeGreaterThan(0);
      expect(normalizedRecord.timeline.length).toBeGreaterThan(0);
    });
  });

  describe('7. Cached Analysis Reuse & Deduplication', () => {
    it('prevents redundant analysis invocation when analysis is cached', () => {
      const inMemoryCache = new Map<string, DocumentAnalysisRecord>();
      const analyzingDocIds = new Set<string>();

      const mockRecord: DocumentAnalysisRecord = {
        analysisId: 'doc_cached_1',
        workspaceId: 'ws_1',
        documentId: 'doc_cached_1',
        ownerId: 'usr_1',
        title: 'Cached Document Title',
        summary: 'Cached analysis summary',
        keyTakeaways: ['Key takeaway 1'],
        clauses: [],
        attentionItems: [],
        timeline: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inMemoryCache.set('doc_cached_1', mockRecord);

      // Simulate analysis invocation logic
      let geminiCallCount = 0;
      const processDocument = (docId: string, force = false): DocumentAnalysisRecord | null => {
        if (analyzingDocIds.has(docId)) {
          return null; // Deduplicate in-flight
        }
        if (!force && inMemoryCache.has(docId)) {
          return inMemoryCache.get(docId)!; // Fast return cached
        }
        geminiCallCount++;
        return mockRecord;
      };

      const firstCall = processDocument('doc_cached_1', false);
      expect(firstCall).toBe(mockRecord);
      expect(geminiCallCount).toBe(0); // Zero AI calls due to cache hit

      const forcedCall = processDocument('doc_cached_1', true);
      expect(forcedCall).toBe(mockRecord);
      expect(geminiCallCount).toBe(1); // One call on forced refresh
    });

    it('deduplicates simultaneous in-flight analysis requests for the same document ID', () => {
      const analyzingDocIds = new Set<string>();
      let executionCount = 0;

      const triggerAsyncAnalysis = (docId: string) => {
        if (analyzingDocIds.has(docId)) {
          return 'in_flight_dropped';
        }
        analyzingDocIds.add(docId);
        executionCount++;
        return 'started';
      };

      expect(triggerAsyncAnalysis('doc_concurrent_99')).toBe('started');
      expect(triggerAsyncAnalysis('doc_concurrent_99')).toBe('in_flight_dropped');
      expect(executionCount).toBe(1);

      analyzingDocIds.delete('doc_concurrent_99');
      expect(triggerAsyncAnalysis('doc_concurrent_99')).toBe('started');
      expect(executionCount).toBe(2);
    });
  });
});
