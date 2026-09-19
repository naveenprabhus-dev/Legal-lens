import { Router, Request, Response } from 'express';
import { isGeminiConfigured } from '../services/gemini-service';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Legal Lens Backend API',
    geminiConfigured: isGeminiConfigured(),
    timestamp: new Date().toISOString(),
  });
});
