import { Router, Request, Response } from 'express';
import {
  analyzeDocumentStructure,
  answerGroundedQuestion,
  isGeminiConfigured,
} from '../services/gemini-service';

export const aiRouter = Router();

aiRouter.post('/analyze-structure', async (req: Request, res: Response) => {
  try {
    const { fileName, documentExcerpt, analysisScope } = req.body;
    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      return res.status(400).json({ error: 'fileName is required and must be a non-empty string' });
    }
    if (fileName.length > 255) {
      return res.status(400).json({ error: 'fileName exceeds maximum permitted length of 255 characters' });
    }
    if (documentExcerpt !== undefined && typeof documentExcerpt !== 'string') {
      return res.status(400).json({ error: 'documentExcerpt must be a string if provided' });
    }
    if (documentExcerpt && documentExcerpt.length > 200000) {
      return res.status(400).json({ error: 'documentExcerpt exceeds maximum permitted size' });
    }

    const result = await analyzeDocumentStructure({
      fileName: fileName.trim(),
      documentExcerpt,
      analysisScope,
    });

    return res.json({
      success: true,
      data: result,
      geminiConfigured: isGeminiConfigured(),
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal AI service error',
    });
  }
});

aiRouter.post('/ask-document', async (req: Request, res: Response) => {
  try {
    const { question, documentContext, documentTitle } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'question is required and must be a non-empty string' });
    }
    if (question.length > 2000) {
      return res.status(400).json({ error: 'question exceeds maximum permitted length of 2000 characters' });
    }
    if (documentContext !== undefined && typeof documentContext !== 'string') {
      return res.status(400).json({ error: 'documentContext must be a string if provided' });
    }
    if (documentTitle !== undefined && typeof documentTitle !== 'string') {
      return res.status(400).json({ error: 'documentTitle must be a string if provided' });
    }

    const result = await answerGroundedQuestion({
      question: question.trim(),
      documentTitle: typeof documentTitle === 'string' ? documentTitle.trim().slice(0, 255) : undefined,
      documentContext: typeof documentContext === 'string' ? documentContext : '',
    });

    return res.json({
      success: true,
      data: result,
      geminiConfigured: isGeminiConfigured(),
    });
  } catch (error) {
    console.error('AI question error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal AI service error',
    });
  }
});
