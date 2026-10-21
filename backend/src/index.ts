import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { authRoutes } from './routes/auth.js';
import { topicRoutes, seedTopicsIfEmpty } from './routes/topics.js';
import { sessionRoutes } from './routes/sessions.js';
import { historyRoutes, getProgressHandler } from './routes/history.js';
import { profileRoutes } from './routes/profile.js';
import { authenticateJwt } from './middleware/auth.js';
import { SessionContextService } from './services/sessionContext.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Keep-alive and health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', service: 'Verbalis Backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/history', historyRoutes);
app.get('/api/progress', authenticateJwt, getProgressHandler);
app.use('/api/profile', profileRoutes);

// Connect to MongoDB Atlas (or graceful local fallback)
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB Atlas');
      await seedTopicsIfEmpty();
    })
    .catch((err) => {
      console.warn('MongoDB connection failed; running in offline/ephemeral mode:', err.message);
    });
} else {
  console.log('No MONGODB_URI provided in .env; running in local in-memory/ephemeral mode');
}

// Cleanup any expired session files from prior runs
SessionContextService.cleanupExpiredSessions();

app.listen(PORT, () => {
  console.log(`Verbalis backend running on port ${PORT}`);
  console.log(`Health check ready at http://localhost:${PORT}/health`);
});
