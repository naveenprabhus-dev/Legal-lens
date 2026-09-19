import express from 'express';
import { aiRouter } from './routes/ai';
import { healthRouter } from './routes/health';

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Register API routes under /api
app.use('/api', healthRouter);
app.use('/api/ai', aiRouter);
