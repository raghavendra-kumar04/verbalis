import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth.js';
import { SessionSummary } from '../models/SessionSummary.js';
import { Topic } from '../models/Topic.js';

const router = Router();
router.use(authenticateJwt);

const TOPIC_NAMES: Record<string, string> = {
  dsa: 'Data Structures & Algorithms',
  java: 'Java Core & Modern Features',
  c: 'C & Low-Level Systems',
  databases: 'Database Design & SQL',
  os: 'Operating Systems & Concurrency',
  networks: 'Computer Networks & Protocols',
  aiml: 'AI & Machine Learning Concepts',
  hr: 'Behavioral & Leadership',
  custom: 'Custom Technical Practice',
};

/**
 * GET /api/history
 * Retrieves real past session summaries from MongoDB for authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const summaries = await SessionSummary.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = summaries.map((s: any) => ({
      ...s,
      topicName: TOPIC_NAMES[s.topicId] || s.topicId,
      keyStrengths: s.strengths || [],
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve session history' });
  }
});

/**
 * Handler for progress metrics, weekly report, and recurring weaknesses
 */
export const getProgressHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const summaries = await SessionSummary.find({ userId }).sort({ createdAt: -1 }).lean();

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyMap = new Map<string, { day: string; date: string; spokenSeconds: number; sessionCount: number; scores: number[] }>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = dayLabels[d.getDay()];
      dailyMap.set(dateStr, {
        day: dayLabel,
        date: dateStr,
        spokenSeconds: 0,
        sessionCount: 0,
        scores: [],
      });
    }

    if (!summaries || summaries.length === 0) {
      const emptyDaily = Array.from(dailyMap.values()).map((entry) => ({
        day: entry.day,
        date: entry.date,
        spokenMinutes: 0,
        spokenSeconds: 0,
        sessionCount: 0,
        averageScore: 0,
      }));

      res.json({
        totalSessions: 0,
        averageClarity: 0,
        averageTechnical: 0,
        averageGrammar: 0,
        averageReadiness: 0,
        totalSpokenSeconds: 0,
        topRecurringWeaknesses: [],
        completedTopicIds: [],
        weeklyReport: {
          thisWeekSessions: 0,
          thisWeekSpokenSeconds: 0,
          thisWeekAverageScore: 0,
          weeklyGoalMinutes: 30,
          weeklyGoalPercent: 0,
          streakDays: 0,
          dailyActivity: emptyDaily,
        },
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

    let thisWeekSessions = 0;
    let thisWeekSeconds = 0;
    const thisWeekScores: number[] = [];

    for (const s of summaries) {
      if (s.overallScore) {
        sumClarity += s.overallScore.clarity || 0;
        sumTech += s.overallScore.technicalAccuracy || 0;
        sumGrammar += s.overallScore.grammar || 0;
        sumReadiness += s.overallScore.interviewReadiness || 0;
      }
      const secs = s.durationSeconds || 0;
      totalSeconds += secs;
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

      // Check weekly inclusion
      const createdAt = s.createdAt ? new Date(s.createdAt) : null;
      if (createdAt && createdAt >= sevenDaysAgo) {
        thisWeekSessions++;
        thisWeekSeconds += secs;
        const dateStr = createdAt.toISOString().split('T')[0];
        const dayEntry = dailyMap.get(dateStr);
        if (dayEntry) {
          dayEntry.spokenSeconds += secs;
          dayEntry.sessionCount++;
          if (s.overallScore?.clarity) {
            dayEntry.scores.push(s.overallScore.clarity);
          }
        }
        if (s.overallScore?.clarity) {
          thisWeekScores.push(s.overallScore.clarity);
        }
      }
    }

    const topRecurringWeaknesses = Object.entries(weaknessCounts)
      .map(([weakness, frequency]) => ({ weakness, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    const dailyActivity = Array.from(dailyMap.values()).map((entry) => ({
      day: entry.day,
      date: entry.date,
      spokenMinutes: Number((entry.spokenSeconds / 60).toFixed(1)),
      spokenSeconds: entry.spokenSeconds,
      sessionCount: entry.sessionCount,
      averageScore: entry.scores.length > 0
        ? Number((entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length).toFixed(1))
        : 0,
    }));

    const thisWeekAverageScore = thisWeekScores.length > 0
      ? Number((thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length).toFixed(1))
      : 0;

    const weeklyGoalMinutes = 30;
    const weeklyGoalPercent = Math.min(100, Math.round(((thisWeekSeconds / 60) / weeklyGoalMinutes) * 100));

    // Calculate streak days
    let streakDays = 0;
    const distinctDates = Array.from(
      new Set(
        summaries
          .map((s) => (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : null))
          .filter(Boolean)
      )
    ).sort().reverse() as string[];

    if (distinctDates.length > 0) {
      const todayStr = now.toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let checkDate = new Date();
      if (!distinctDates.includes(todayStr) && distinctDates.includes(yesterdayStr)) {
        checkDate = yesterday;
      }

      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (distinctDates.includes(dStr)) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    res.json({
      totalSessions,
      averageClarity: Number((sumClarity / totalSessions).toFixed(1)),
      averageTechnical: Number((sumTech / totalSessions).toFixed(1)),
      averageGrammar: Number((sumGrammar / totalSessions).toFixed(1)),
      averageReadiness: Number((sumReadiness / totalSessions).toFixed(1)),
      totalSpokenSeconds: totalSeconds,
      topRecurringWeaknesses,
      completedTopicIds: Array.from(topicSet),
      weeklyReport: {
        thisWeekSessions,
        thisWeekSpokenSeconds: thisWeekSeconds,
        thisWeekAverageScore,
        weeklyGoalMinutes,
        weeklyGoalPercent,
        streakDays,
        dailyActivity,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to aggregate progress' });
  }
};

router.get('/progress', getProgressHandler);

export const historyRoutes = router;
