import { z } from 'zod';

export interface JwtPayload {
  userId: string;
  email: string;
}

export type TopicCategory =
  | 'dsa'
  | 'java'
  | 'c'
  | 'databases'
  | 'os'
  | 'networks'
  | 'aiml'
  | 'hr'
  | 'custom';

export type FeedbackMode = 'per_answer' | 'end_of_session';

export type CoachingFocus =
  | 'grammar'
  | 'technical_accuracy'
  | 'answer_structure'
  | 'filler_words'
  | 'pacing'
  | 'interview_readiness'
  | 'vocabulary'
  | 'all_round';

export interface FeedbackObject {
  grammarScore: number;
  clarityScore: number;
  technicalAccuracyScore: number;
  interviewReadinessScore: number;
  strengths: string[];
  improvements: string[];
  improvedAnswerVersion: string;
  fillerWordsDetected: string[];
  technicalAccuracyNote: string | null;
  quickCoachTip?: string;
  followUpQuestion?: string;
  keyPointsMentioned?: string[];
  newWeaknesses?: string[];
}

export const FeedbackObjectSchema = z.object({
  grammarScore: z.coerce.number().min(1).max(5).default(4),
  clarityScore: z.coerce.number().min(1).max(5).default(4),
  technicalAccuracyScore: z.coerce.number().min(1).max(5).default(4),
  interviewReadinessScore: z.coerce.number().min(1).max(5).default(4),
  strengths: z.array(z.string()).default([]).transform((arr) => arr.slice(0, 3)),
  improvements: z.array(z.string()).default([]).transform((arr) => arr.slice(0, 3)),
  improvedAnswerVersion: z.string().default(''),
  fillerWordsDetected: z.array(z.string()).default([]),
  technicalAccuracyNote: z.string().nullable().optional().default(null),
  quickCoachTip: z.string().default('Keep your explanations structured and focused on technical trade-offs.'),
  followUpQuestion: z.string().optional(),
  keyPointsMentioned: z.array(z.string()).default([]),
  newWeaknesses: z.array(z.string()).default([]),
});

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TurnTempContext {
  questionAsked: string;
  userTranscript?: string;
  keyPointsMentioned: string[];
  weaknessesNoted: string[];
  strengths?: string[];
  followUpHint: string;
  difficultyLevel?: DifficultyLevel;
  /** Individual rubric scores from answer evaluation (1-5) */
  technicalScore?: number;
  grammarScore?: number;
  clarityScore?: number;
  interviewReadinessScore?: number;
  fillerWords?: string[];
}

export interface SessionSummaryResult {
  overallScore: {
    grammar: number;
    clarity: number;
    technicalAccuracy: number;
    interviewReadiness: number;
    average: number;
  };
  headline: string;
  executiveSummary: string;
  readinessBadge: string;
  strengths: string[];
  recurringWeaknesses: string[];
  recommendedExercises: string[];
  turnCount: number;
  durationSeconds?: number;
}

export interface SessionTempContext {
  sessionId: string;
  topicId: string;
  customTopicText?: string;
  feedbackMode: FeedbackMode;
  coachingFocus: CoachingFocus;
  turns: TurnTempContext[];
  expiresAt: number;
  startedAt?: number;
  /** Current adaptive difficulty – starts at beginner, escalates as user succeeds */
  currentDifficulty?: DifficultyLevel;
}

