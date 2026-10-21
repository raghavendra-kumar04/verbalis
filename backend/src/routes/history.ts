import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth.js';
import { SessionSummary } from '../models/SessionSummary.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'personal_user_1';

  try {
    const summaries = await SessionSummary.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (summaries && summaries.length > 0) {
      res.json(summaries);
      return;
    }
  } catch {}

  // Mock initial history for developer preview
  res.json([
    {
      _id: 'mock_1',
      topicId: 'dsa',
      topicName: 'Hash Tables Collision Resolution',
      overallScore: {
        grammar: 4.0,
        clarity: 4.2,
        technicalAccuracy: 4.5,
        interviewReadiness: 4.3,
      },
      strengths: ['Clear explanation of chaining', 'Confident pacing'],
      recurringWeaknesses: ['Hesitation on quadratic probing'],
      turnCount: 3,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'mock_2',
      topicId: 'databases',
      topicName: 'Database Indexing (B-Trees)',
      overallScore: {
        grammar: 3.9,
        clarity: 3.8,
        technicalAccuracy: 4.6,
        interviewReadiness: 4.0,
      },
      strengths: ['Accurate logarithmic tree complexity'],
      recurringWeaknesses: ['Filler words (um, basically)'],
      turnCount: 4,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);
});

router.get('/progress', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({
    averageClarity: 4.2,
    totalSessions: 14,
    totalAudioSeconds: 2280,
    topRecurringWeaknesses: [
      { weakness: 'Filler words during transitions (basically, like)', frequency: 3 },
      { weakness: 'Fast opening rate (> 150 wpm)', frequency: 2 },
    ],
  });
});

export const historyRoutes = router;
