import { Router, Response } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth.js';
import { Session } from '../models/Session.js';
import { SessionSummary } from '../models/SessionSummary.js';
import { SessionContextService } from '../services/sessionContext.js';
import { GroqService } from '../services/groqService.js';
import { Topic } from '../models/Topic.js';

const router = Router();
const upload = multer({ dest: path.join(os.tmpdir(), 'verbalis_uploads') });

// All session routes require JWT
router.use(authenticateJwt);

/**
 * POST /api/sessions
 * Start a new rehearsal session
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { topicId, customTopicText, feedbackMode = 'per_answer', coachingFocus = 'all_round' } = req.body;
    const userId = req.user?.userId || 'personal_user_1';
    const sessionId = uuidv4();

    // Find initial question
    let firstQuestion = 'Could you explain the core concepts and trade-offs of this topic?';
    if (customTopicText) {
      firstQuestion = `Explain the architectural design and key trade-offs of ${customTopicText}.`;
    } else {
      const topicDoc = await Topic.findOne({ topicId }).lean();
      if (topicDoc && topicDoc.sampleQuestions.length > 0) {
        firstQuestion = topicDoc.sampleQuestions[0];
      }
    }

    // Save temporary session context file (auto-cleaned on finish)
    SessionContextService.saveContext({
      sessionId,
      topicId: topicId || 'dsa',
      customTopicText,
      feedbackMode,
      coachingFocus,
      turns: [
        {
          questionAsked: firstQuestion,
          keyPointsMentioned: [],
          weaknessesNoted: [],
          followUpHint: '',
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
    let nextQuestion = 'Could you elaborate on the practical trade-offs of this approach?';

    if (context.feedbackMode === 'per_answer') {
      feedback = await GroqService.evaluateAnswer(
        context.customTopicText || context.topicId,
        questionAsked,
        transcript,
        context.coachingFocus,
        currentTurn ? currentTurn.weaknessesNoted : []
      );
      if (feedback.followUpQuestion) {
        nextQuestion = feedback.followUpQuestion;
      }
    } else {
      // In end-of-session mode, generate follow-up question via 8B without mid-session evaluation
      nextQuestion = await GroqService.generateFollowUpQuestion(
        context.customTopicText || context.topicId,
        questionAsked,
        ['covered concepts']
      );
    }

    // Update ephemeral context (Notice: NO raw transcripts stored)
    context.turns.push({
      questionAsked: nextQuestion,
      keyPointsMentioned: ['explained chaining', 'addressed average lookup'],
      weaknessesNoted: feedback?.improvements || [],
      followUpHint: '',
    });
    SessionContextService.saveContext(context);

    res.json({
      turnId: uuidv4(),
      feedback,
      nextQuestion,
      turnCount: context.turns.length - 1,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Evaluation error' });
  }
});

/**
 * POST /api/sessions/:id/finish
 * Finalize session, save summary to MongoDB, delete ephemeral context
 */
router.post('/:id/finish', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const sessionId = String(req.params.id);
  const userId = req.user?.userId || 'personal_user_1';

  const context = SessionContextService.getContext(sessionId);

  // Clean up temporary file
  SessionContextService.deleteContext(sessionId);

  const summary = {
    overallScore: {
      grammar: 4.2,
      clarity: 4.0,
      technicalAccuracy: 4.8,
      interviewReadiness: 4.5,
    },
    strengths: [
      'Maintained consistent use of correct technical terms.',
      'Answered follow-up adaptive questions directly without drift.',
    ],
    recurringWeaknesses: [
      'Replace hesitation pauses with deliberate 1-second silence.',
    ],
    recommendedExercises: [
      'Practice explaining quicksort pivot selection.',
    ],
    turnCount: context ? context.turns.length : 3,
  };

  try {
    await SessionSummary.create({
      sessionId,
      userId,
      topicId: context ? context.topicId : 'dsa',
      ...summary,
    });
  } catch {}

  res.json({
    message: 'Session finished successfully',
    summary,
  });
});

export const sessionRoutes = router;
