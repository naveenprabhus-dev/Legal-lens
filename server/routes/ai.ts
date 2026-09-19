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
    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const result = await analyzeDocumentStructure({
      fileName,
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
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question is required and must be a string' });
    }

    const result = await answerGroundedQuestion({
      question: question.trim(),
      documentTitle: typeof documentTitle === 'string' ? documentTitle.trim() : undefined,
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
