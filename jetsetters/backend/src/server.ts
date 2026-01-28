import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import adminRoutes from './routes/admin.routes.js';
import { operatorDataService } from './services/operator-data.service.js';
import { ErrorHandler } from './middleware/error-handler.middleware.js';
import { requireFirebaseAuth } from './middleware/firebase-auth.middleware.js';
import { createRateLimiter } from './middleware/rate-limit.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5175',
  'http://localhost:5173',
  'https://jetsetters-frontend.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Keep payload sizes predictable (chat history, etc.)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'jetsetters-backend',
  });
});

// Baseline rate limits (per IP). Chat is tighter than general admin polling.
const adminLimiter = createRateLimiter({ windowMs: 60_000, limit: 300 });
const chatLimiter = createRateLimiter({ windowMs: 60_000, limit: 30 });

app.use('/api/admin/chat', chatLimiter);
app.use('/api/admin/chat/stream', chatLimiter);

app.use('/api/admin', adminLimiter, requireFirebaseAuth, adminRoutes);
app.use(ErrorHandler.handle);

const updateInterval = parseInt(process.env.DATA_UPDATE_INTERVAL_MS || '60000', 10);
operatorDataService.startDataGeneration(updateInterval);

let mlServiceProcess: ReturnType<typeof spawn> | null = null;

const startMLService = () => {
  // macOS commonly reserves port 5000 (e.g. AirPlay Receiver / Control Center).
  // Default to 5050, but allow override via ML_SERVICE_PORT.
  const mlServicePort = process.env.ML_SERVICE_PORT || '5050';
  process.env.ML_SERVICE_PORT = mlServicePort;
  
  const mlServicePath = path.join(__dirname, '..', 'src', 'services', 'ml-inference-service.py');
  
  mlServiceProcess = spawn('python3', [mlServicePath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  
  mlServiceProcess.on('error', (error) => {
    console.error('Failed to start ML inference service:', error);
    console.log('ML service will not be available. Using fallback predictions.');
  });
  
  mlServiceProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`ML inference service exited with code ${code}`);
      console.log('Attempting to restart ML service in 5 seconds...');
      setTimeout(startMLService, 5000);
    }
  });
  
  console.log(`ML inference service starting on port ${mlServicePort}...`);
};

if (process.env.START_ML_SERVICE !== 'false') {
  startMLService();
}

const shutdown = (signal: 'SIGTERM' | 'SIGINT') => {
  console.log(`Received ${signal}. Shutting down...`);
  try {
    operatorDataService.stopDataGeneration();
  } catch (error) {
    console.error('Failed to stop operator data generation:', error);
  }
  if (mlServiceProcess) {
    mlServiceProcess.kill();
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
