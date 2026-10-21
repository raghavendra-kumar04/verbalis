import { Router, Response } from 'express';
import { Topic } from '../models/Topic.js';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth.js';

const router = Router();

const DEFAULT_TOPICS = [
  {
    topicId: 'dsa',
    name: 'Data Structures & Algorithms',
    category: 'Core Computer Science',
    difficulty: 'Intermediate' as const,
    subtopics: ['Arrays & Hash Maps', 'Linked Lists & Trees', 'Dynamic Programming', 'Graph Algorithms'],
    sampleQuestions: [
      'Could you explain the difference between separate chaining and open addressing in hash tables, and how each handles clustering?',
      'How does quicksort select its pivot, and what is its worst-case space and time complexity?',
    ],
  },
  {
    topicId: 'java',
    name: 'Java & Object-Oriented Design',
    category: 'Programming Languages',
    difficulty: 'Intermediate' as const,
    subtopics: ['JVM Memory Model', 'Polymorphism', 'Multithreading', 'Garbage Collection'],
    sampleQuestions: [
      'How does garbage collection work in the JVM, and what is the difference between minor and major GC cycles?',
    ],
  },
  {
    topicId: 'c',
    name: 'C & Systems Programming',
    category: 'Systems & Low Level',
    difficulty: 'Advanced' as const,
    subtopics: ['Pointers & Memory Allocation', 'Structs', 'Stack vs Heap', 'Buffer Overflows'],
    sampleQuestions: [
      'Explain the difference between stack and heap memory allocation in C, and what happens during a stack overflow.',
    ],
  },
  {
    topicId: 'databases',
    name: 'Databases & Indexing',
    category: 'Infrastructure & Data',
    difficulty: 'Intermediate' as const,
    subtopics: ['B-Tree Indexes', 'ACID Properties', 'Transactions & Locking', 'Normalization'],
    sampleQuestions: [
      'How does a B-Tree index accelerate search operations in relational databases, and what are the trade-offs on write performance?',
    ],
  },
  {
    topicId: 'os',
    name: 'Operating Systems & Concurrency',
    category: 'Systems & Architecture',
    difficulty: 'Advanced' as const,
    subtopics: ['Process vs Thread', 'Virtual Memory', 'Deadlocks', 'Context Switching'],
    sampleQuestions: [
      'What is the difference between a process and a thread, and what happens under the hood during an OS context switch?',
    ],
  },
  {
    topicId: 'networks',
    name: 'Computer Networks & Protocols',
    category: 'Infrastructure & Protocols',
    difficulty: 'Intermediate' as const,
    subtopics: ['TCP vs UDP', 'HTTP/1.1 vs HTTP/2 vs HTTP/3', 'DNS Resolution', 'TLS Handshake'],
    sampleQuestions: [
      'Walk me through the steps of a TCP three-way handshake and explain why two steps are insufficient.',
    ],
  },
  {
    topicId: 'aiml',
    name: 'AI & Machine Learning Foundations',
    category: 'Emerging Tech',
    difficulty: 'Intermediate' as const,
    subtopics: ['Supervised vs Unsupervised', 'Bias-Variance', 'Backpropagation', 'Transformers'],
    sampleQuestions: [
      'Explain the intuition behind self-attention in Transformer architectures and how it differs from traditional RNNs.',
    ],
  },
  {
    topicId: 'hr',
    name: 'HR & Behavioral Communication',
    category: 'Interview Readiness',
    difficulty: 'Beginner' as const,
    subtopics: ['Tell Me About Yourself', 'Handling Disagreements', 'Failure & Learning', 'Leadership'],
    sampleQuestions: [
      'Tell me about a challenging technical conflict you had with a teammate and how you arrived at a collaborative resolution.',
    ],
  },
];

// Seed topics if MongoDB is connected
export const seedTopicsIfEmpty = async () => {
  try {
    const count = await Topic.countDocuments();
    if (count === 0) {
      await Topic.insertMany(DEFAULT_TOPICS);
      console.log('Seeded initial technical topics in database');
    }
  } catch (err) {
    console.warn('Could not seed topics into MongoDB (skipping if disconnected):', err);
  }
};

router.get('/', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const topics = await Topic.find().lean();
    if (topics && topics.length > 0) {
      res.json(topics);
      return;
    }
  } catch {}
  // Fallback to static in-memory list
  res.json(DEFAULT_TOPICS);
});

router.get('/revision', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'personal_user_1';

  try {
    const { SessionSummary } = await import('../models/SessionSummary.js');
    const summaries = await SessionSummary.find({ userId }).sort({ createdAt: -1 }).lean();

    const topicLastPracticed: Record<string, { lastDate: Date; weaknesses: string[] }> = {};
    for (const s of summaries) {
      if (s.topicId && !topicLastPracticed[s.topicId]) {
        topicLastPracticed[s.topicId] = {
          lastDate: s.createdAt,
          weaknesses: s.recurringWeaknesses || [],
        };
      }
    }

    const allTopics = await Topic.find().lean();
    const topicsList = allTopics.length > 0 ? allTopics : DEFAULT_TOPICS;

    const revisionSuggestions: any[] = [];
    const now = Date.now();

    for (const t of topicsList) {
      const history = topicLastPracticed[t.topicId];
      if (history) {
        const daysAgo = Math.floor((now - new Date(history.lastDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 3) {
          revisionSuggestions.push({
            topicId: t.topicId,
            name: t.name,
            reason: `Practiced ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago • Focus: ${history.weaknesses[0] || 'Technical accuracy'}`,
          });
        }
      } else {
        revisionSuggestions.push({
          topicId: t.topicId,
          name: t.name,
          reason: 'Not practiced yet • Core interview area',
        });
      }
    }

    res.json(revisionSuggestions.slice(0, 4));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch revision topics' });
  }
});

export const topicRoutes = router;
