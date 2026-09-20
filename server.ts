import path from 'path';
import express from 'express';
import { app } from './server/app';

const PORT = Number(process.env.PORT) || 3000;
const distPath = path.resolve(process.cwd(), 'dist');

// Serve static assets in production
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Legal Lens production server running on http://0.0.0.0:${PORT}`);
});
