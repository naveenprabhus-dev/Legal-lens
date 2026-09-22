import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { aiRouter } from '../../server/routes/ai';

// Helper to create mock Express req/res
function createMockContext(body: Record<string, unknown>) {
  const req = {
    body,
  } as unknown as Request;

  let statusCode = 200;
  let responseData: any = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
  } as unknown as Response;

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => responseData,
  };
}

// Find route handler by route path and method
function getRouteHandler(path: string) {
  const layer = (aiRouter.stack as any[]).find(
    (l: any) => l.route && l.route.path === path && l.route.methods.post
  );
  if (!layer) throw new Error(`Route POST ${path} not found`);
  return layer.route.stack[0].handle;
}

describe('Server AI Route Validation & Security Boundaries', () => {
  const analyzeHandler = getRouteHandler('/analyze-structure');
  const askHandler = getRouteHandler('/ask-document');

  describe('POST /api/ai/analyze-structure', () => {
    it('returns 400 Bad Request if fileName is missing', async () => {
      const { req, res, getStatus, getBody } = createMockContext({
        documentExcerpt: 'Sample text',
      });

      await analyzeHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getBody().error).toContain('fileName is required');
    });

    it('returns 400 Bad Request if fileName is empty string or only whitespace', async () => {
      const { req, res, getStatus, getBody } = createMockContext({
        fileName: '   ',
        documentExcerpt: 'Sample text',
      });

      await analyzeHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getBody().error).toContain('fileName is required');
    });

    it('returns 400 Bad Request if fileName exceeds maximum allowed length', async () => {
      const { req, res, getStatus, getBody } = createMockContext({
        fileName: 'a'.repeat(300),
        documentExcerpt: 'Sample text',
      });

      await analyzeHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getBody().error).toContain('exceeds maximum permitted length');
    });

    it('returns 400 Bad Request if documentExcerpt exceeds maximum permitted size', async () => {
      const { req, res, getStatus, getBody } = createMockContext({
        fileName: 'Large.pdf',
        documentExcerpt: 'x'.repeat(250000),
      });

      await analyzeHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getBody().error).toContain('exceeds maximum permitted size');
    });
  });

  describe('POST /api/ai/ask-document', () => {
    it('returns 400 Bad Request if question is missing', async () => {
      const { req, res, getStatus, getBody } = createMockContext({
        documentContext: 'Some text',
      });

      await askHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getBody().error).toContain('question is required');
    });

    it('returns 400 Bad Request if question is empty whitespace', async () => {
      const { req, res, getStatus, getBody } = createMockContext({
        question: '   ',
      });

      await askHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getBody().error).toContain('question is required');
    });

    it('returns 400 Bad Request if question exceeds maximum permitted length', async () => {
      const { req, res, getStatus, getBody } = createMockContext({
        question: 'x'.repeat(2500),
      });

      await askHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getBody().error).toContain('exceeds maximum permitted length');
    });

    it('returns 400 Bad Request if documentContext is not a string', async () => {
      const { req, res, getStatus, getBody } = createMockContext({
        question: 'Valid question?',
        documentContext: 12345,
      });

      await askHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getBody().error).toContain('documentContext must be a string');
    });
  });
});
