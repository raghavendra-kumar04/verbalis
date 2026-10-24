import { Router, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth.js';
import { Session } from '../models/Session.js';
import { SessionSummary } from '../models/SessionSummary.js';
import { SessionContextService } from '../services/sessionContext.js';
import { GroqService, computeNextDifficulty } from '../services/groqService.js';
import { Topic } from '../models/Topic.js';

const router = Router();

const uploadDir = path.join(os.tmpdir(), 'verbalis_uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch {}
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const originalExt = path.extname(file.originalname || '');
    const ext = originalExt || (file.mimetype && file.mimetype.includes('webm') ? '.webm' : '.m4a');
    cb(null, `turn_${Date.now()}_${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

// All session routes require JWT
router.use(authenticateJwt);

/**
 * POST /api/sessions
 * Start a new rehearsal session
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { topicId, customTopicText, feedbackMode = 'per_answer', coachingFocus = 'all_round' } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const sessionId = uuidv4();

    // Dynamically generate a distinct initial question via Groq AI
    let topicName = customTopicText || 'Computer Science & Software Engineering';
    let subtopics: string[] = [];
    if (!customTopicText) {
      const topicDoc = await Topic.findOne({ topicId }).lean();
      if (topicDoc) {
        topicName = topicDoc.name;
        subtopics = topicDoc.subtopics || [];
      }
    }

    const firstQuestion = await GroqService.generateInitialQuestion(topicName, subtopics);

    // Save temporary session context file (auto-cleaned on finish)
    SessionContextService.saveContext({
      sessionId,
      topicId: topicId || 'dsa',
      customTopicText,
      feedbackMode,
      coachingFocus,
      currentDifficulty: 'beginner', // <-- ALWAYS start at beginner
      startedAt: Date.now(),
      turns: [
        {
          questionAsked: firstQuestion,
          keyPointsMentioned: [],
          weaknessesNoted: [],
          followUpHint: '',
          difficultyLevel: 'beginner',
        },
      ],
      expiresAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours TTL
    });

    // Optionally create DB record
    try {
      await Session.create({
        userId,
        topicId: topicId || 'dsa',
        customTopicText,
        feedbackMode,
        coachingFocus,
        turnCount: 0,
        status: 'active',
      });
    } catch {}

    res.json({
      sessionId,
      firstQuestion,
      feedbackMode,
      coachingFocus,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to start session' });
  }
});

/**
 * POST /api/sessions/:id/turns
 * Upload audio turn -> Transcribe -> Evaluate -> Generate Next Question
 */
router.post('/:id/turns', upload.single('audio'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const sessionId = String(req.params.id);
  const audioFile = req.file;

  const context = SessionContextService.getContext(sessionId);
  if (!context) {
    res.status(404).json({ message: 'Session expired or not found. Please start a new session.' });
    return;
  }

  const currentTurn = context.turns[context.turns.length - 1];
  const questionAsked = currentTurn ? currentTurn.questionAsked : 'Explain the technical concept.';

  try {
    if (!audioFile) {
      res.json({
        type: 'clarify',
        message: 'No audio was recorded. Please tap the microphone and speak your answer.',
        nextQuestion: questionAsked,
      });
      return;
    }

    if (!process.env.GROQ_API_KEY) {
      res.status(400).json({
        type: 'config_error',
        message: 'GROQ_API_KEY is not set in backend/.env. Please provide your free Groq API key to transcribe and evaluate speech.',
      });
      return;
    }

    const transcript = await GroqService.transcribeAudio(audioFile.path);

    // If answer is silent, empty, or too short
    if (!transcript || transcript.trim().length === 0 || transcript.split(/\s+/).length < 3) {
      res.json({
        type: 'clarify',
        message: "I couldn't hear any speech clearly. Could you please repeat your answer?",
        nextQuestion: questionAsked,
      });
      return;
    }

    let feedback = null;
    let nextQuestion = '';

    const allAskedQuestions = context.turns.map((t) => t.questionAsked);
    const topicLabel = context.customTopicText || context.topicId;

    // --- Adaptive difficulty: compute next level from prior scores ---
    const currentDifficulty = context.currentDifficulty || 'beginner';
    const nextDifficulty = computeNextDifficulty(currentDifficulty, context.turns);
    console.log(`[Adaptive] Current: ${currentDifficulty} → Next: ${nextDifficulty}`);

    if (context.feedbackMode === 'per_answer') {
      feedback = await GroqService.evaluateAnswer(
        topicLabel,
        questionAsked,
        transcript,
        context.coachingFocus,
        currentTurn ? currentTurn.weaknessesNoted : []
      );
      if (feedback.followUpQuestion && feedback.followUpQuestion.trim().length > 15) {
        // Use AI-generated follow-up but still pass difficulty so it's calibrated
        nextQuestion = feedback.followUpQuestion.trim();
      } else {
        nextQuestion = await GroqService.generateFollowUpQuestion(topicLabel, questionAsked, allAskedQuestions, nextDifficulty);
      }
    } else {
      nextQuestion = await GroqService.generateFollowUpQuestion(topicLabel, questionAsked, allAskedQuestions, nextDifficulty);
    }

    // Update ephemeral context with score for future difficulty computation
    context.currentDifficulty = nextDifficulty;
    context.turns.push({
      questionAsked: nextQuestion,
      keyPointsMentioned: feedback?.keyPointsMentioned || [],
      weaknessesNoted: feedback?.improvements || [],
      followUpHint: '',
      difficultyLevel: nextDifficulty,
      technicalScore: feedback?.technicalAccuracyScore,
    });
    // Store full turn evaluation details on the CURRENT (just-answered) turn
    if (currentTurn) {
      currentTurn.userTranscript = transcript;
      currentTurn.technicalScore = feedback?.technicalAccuracyScore;
      currentTurn.grammarScore = feedback?.grammarScore;
      currentTurn.clarityScore = feedback?.clarityScore;
      currentTurn.interviewReadinessScore = feedback?.interviewReadinessScore;
      currentTurn.strengths = feedback?.strengths || [];
      currentTurn.weaknessesNoted = feedback?.improvements || [];
      currentTurn.fillerWords = feedback?.fillerWordsDetected || [];
    }
    SessionContextService.saveContext(context);

    res.json({
      turnId: uuidv4(),
      feedback,
      nextQuestion,
      turnCount: context.turns.length - 1,
      currentDifficulty: nextDifficulty,
    });
  } catch (error: any) {
    console.error('Turn evaluation error on backend:', error);
    res.status(500).json({ message: error.message || 'Evaluation error' });
  }
});

/**
 * GET /api/sessions/:id/summary
 * Retrieve saved evaluation report for a session
 */
router.get('/:id/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const sessionId = String(req.params.id);
  try {
    const summary = await SessionSummary.findOne({ sessionId }).lean();
    if (summary) {
      res.json(summary);
      return;
    }
    res.status(404).json({ message: 'Summary not found' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch summary' });
  }
});

/**
 * POST /api/sessions/:id/finish
 * Finalize session, generate real dynamic evaluation report from actual spoken answers, save to MongoDB
 */
router.post('/:id/finish', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const sessionId = String(req.params.id);
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const context = SessionContextService.getContext(sessionId);
  let durationSeconds = Number(req.body?.durationSeconds || 0);
  if (durationSeconds <= 0 && context?.startedAt) {
    durationSeconds = Math.max(10, Math.round((Date.now() - context.startedAt) / 1000));
  } else if (durationSeconds <= 0) {
    durationSeconds = 60;
  }

  const topicLabel = context?.customTopicText || context?.topicId || 'Technical Interview';
  const turns = context?.turns || [];

  // Generate dynamic, personalized summary based strictly on what user spoke
  const summary = await GroqService.generateSessionSummary(topicLabel, turns, durationSeconds);

  // Clean up temporary file context
  SessionContextService.deleteContext(sessionId);

  try {
    await SessionSummary.create({
      sessionId,
      userId,
      topicId: context ? context.topicId : 'dsa',
      overallScore: summary.overallScore,
      headline: summary.headline,
      executiveSummary: summary.executiveSummary,
      readinessBadge: summary.readinessBadge,
      strengths: summary.strengths,
      recurringWeaknesses: summary.recurringWeaknesses,
      recommendedExercises: summary.recommendedExercises,
      turnCount: summary.turnCount,
      durationSeconds,
    });
  } catch (err: any) {
    console.error('SessionSummary create error:', err.message);
  }

  // Also mark Session record as finished
  try {
    const { Session } = await import('../models/Session.js');
    await Session.findOneAndUpdate(
      { userId, status: 'active' },
      { status: 'finished', finishedAt: new Date(), turnCount: summary.turnCount },
      { sort: { startedAt: -1 } }
    );
  } catch {}

  res.json({
    message: 'Session finished successfully',
    summary,
  });
});


export const sessionRoutes = router;
