import 'dotenv/config';
import dns from 'dns';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { authRoutes } from './routes/auth.js';
import { topicRoutes, seedTopicsIfEmpty } from './routes/topics.js';
import { sessionRoutes } from './routes/sessions.js';
import { historyRoutes, getProgressHandler } from './routes/history.js';
import { profileRoutes } from './routes/profile.js';
import { authenticateJwt } from './middleware/auth.js';
import { SessionContextService } from './services/sessionContext.js';

// Ensure DNS SRV resolution succeeds even when connected via cellular hotspot
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr: any) {
  console.warn('DNS server override warning:', dnsErr.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Keep-alive and health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', service: 'Verbalis Backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/history', historyRoutes);
app.get('/api/progress', authenticateJwt, getProgressHandler);
app.use('/api/profile', profileRoutes);

// Connect strictly to MongoDB Atlas (no local fallback)
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not defined in .env');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas successfully!');
    await seedTopicsIfEmpty();
  })
  .catch((err) => {
    console.error('MongoDB Atlas connection failed:', err.message);
  });

// Cleanup any expired session files from prior runs
SessionContextService.cleanupExpiredSessions();

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Verbalis backend running on port ${PORT} (0.0.0.0)`);
  console.log(`Health check ready at http://localhost:${PORT}/health`);
});
