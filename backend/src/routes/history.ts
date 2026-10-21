import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth.js';
import { SessionSummary } from '../models/SessionSummary.js';
import { Topic } from '../models/Topic.js';

const router = Router();
router.use(authenticateJwt);

/**
 * GET /api/history
 * Retrieves real past session summaries from MongoDB (never hallucinated)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'personal_user_1';

  try {
    const summaries = await SessionSummary.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(summaries || []);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve session history' });
  }
});

/**
 * Handler for progress metrics and recurring weaknesses
 */
export const getProgressHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'personal_user_1';

  try {
    const summaries = await SessionSummary.find({ userId }).lean();

    if (!summaries || summaries.length === 0) {
      res.json({
        totalSessions: 0,
        averageClarity: 0,
        averageTechnical: 0,
        averageGrammar: 0,
        averageReadiness: 0,
        totalSpokenSeconds: 0,
        topRecurringWeaknesses: [],
        completedTopicIds: [],
      });
      return;
    }

    const totalSessions = summaries.length;
    let sumClarity = 0;
    let sumTech = 0;
    let sumGrammar = 0;
    let sumReadiness = 0;
    let totalSeconds = 0;
    const weaknessCounts: Record<string, number> = {};
    const topicSet = new Set<string>();

    for (const s of summaries) {
      if (s.overallScore) {
        sumClarity += s.overallScore.clarity || 0;
        sumTech += s.overallScore.technicalAccuracy || 0;
        sumGrammar += s.overallScore.grammar || 0;
        sumReadiness += s.overallScore.interviewReadiness || 0;
      }
      totalSeconds += s.durationSeconds || 0;
      if (s.topicId) {
        topicSet.add(s.topicId);
      }
      if (s.recurringWeaknesses && Array.isArray(s.recurringWeaknesses)) {
        for (const w of s.recurringWeaknesses) {
          const trimmed = w.trim();
          if (trimmed) {
            weaknessCounts[trimmed] = (weaknessCounts[trimmed] || 0) + 1;
          }
        }
      }
    }

    const topRecurringWeaknesses = Object.entries(weaknessCounts)
      .map(([weakness, frequency]) => ({ weakness, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    res.json({
      totalSessions,
      averageClarity: Number((sumClarity / totalSessions).toFixed(1)),
      averageTechnical: Number((sumTech / totalSessions).toFixed(1)),
      averageGrammar: Number((sumGrammar / totalSessions).toFixed(1)),
      averageReadiness: Number((sumReadiness / totalSessions).toFixed(1)),
      totalSpokenSeconds: totalSeconds,
      topRecurringWeaknesses,
      completedTopicIds: Array.from(topicSet),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to aggregate progress' });
  }
};

router.get('/progress', getProgressHandler);

export const historyRoutes = router;
