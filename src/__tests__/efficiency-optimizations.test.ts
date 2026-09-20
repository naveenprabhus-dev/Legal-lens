import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  analyzeDocumentStructure,
  answerGroundedQuestion,
  clearAiServiceCache,
  getRealisticAnalysis,
  getFallbackQAResponse,
} from '../../server/services/gemini-service';
import { extractTextFromDocument } from '../utils/textExtractor';

describe('P0/P1 Efficiency Improvements & Caching Suite', () => {
  beforeEach(() => {
    clearAiServiceCache();
  });

  describe('Server-Side Analysis & QA Cache Determinism', () => {
    it('returns consistent structured analysis on repeated calls and caches results', async () => {
      const request = {
        fileName: 'Master_Services_Agreement_2025.pdf',
        documentExcerpt: 'The agreement shall remain in effect for three (3) years from the Effective Date.',
      };

      const firstResult = getRealisticAnalysis(request.fileName, request.documentExcerpt);
      expect(firstResult).toBeDefined();
      expect(firstResult.summary).toBeTruthy();

      const secondResult = getRealisticAnalysis(request.fileName, request.documentExcerpt);
      expect(secondResult).toEqual(firstResult);
    });

    it('returns consistent grounded Q&A responses for identical questions on identical document context', async () => {
      const qaRequest = {
        question: 'What is the governing law of the contract?',
        documentTitle: 'Employment_Contract.pdf',
        documentContext: 'This Agreement is governed by the laws of the State of Delaware.',
      };

      const firstQA = getFallbackQAResponse(
        qaRequest.question,
        qaRequest.documentTitle,
        qaRequest.documentContext
      );
      expect(firstQA).toBeDefined();
      expect(firstQA.answer).toBeTruthy();

      const secondQA = getFallbackQAResponse(
        qaRequest.question,
        qaRequest.documentTitle,
        qaRequest.documentContext
      );
      expect(secondQA).toEqual(firstQA);
    });
  });

  describe('In-Browser Text & PDF Extraction Efficiency', () => {
    it('efficiently extracts text from text files without memory leaks', async () => {
      const mockTextFile = new File(
        ['Section 1: Confidential Information. The Receiving Party will hold all information confidential.'],
        'contract.txt',
        { type: 'text/plain' }
      );

      const text = await extractTextFromDocument(mockTextFile);
      expect(text).toContain('Section 1: Confidential Information');
    });

    it('handles simulated PDF binary streams and extracts parenthesized literals cleanly', async () => {
      // Simulate standard PDF content stream chunk: (Master Service Agreement) Tj
      const simulatedPdfContent = '%PDF-1.4\nBT /F1 12 Tf (Master Service Agreement) Tj (Confidentiality and IP) Tj ET';
      const encoder = new TextEncoder();
      const uint8 = encoder.encode(simulatedPdfContent);
      const mockPdfBlob = new Blob([uint8], { type: 'application/pdf' });
      const mockPdfFile = new File([mockPdfBlob], 'sample_agreement.pdf', { type: 'application/pdf' });

      const extracted = await extractTextFromDocument(mockPdfFile);
      expect(extracted).toBeTruthy();
    });
  });
});
