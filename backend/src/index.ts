import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes (placeholder)
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'ERIZON AI Backend',
    status: 'initializing'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 ERIZON AI Backend running on port ${PORT}`);
  logger.info(`📡 API: http://localhost:${PORT}`);
  logger.info(`🏥 Health: http://localhost:${PORT}/health`);
});

export default app;
