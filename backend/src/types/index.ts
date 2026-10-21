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
  grammarScore: z.number().min(1).max(5),
  clarityScore: z.number().min(1).max(5),
  technicalAccuracyScore: z.number().min(1).max(5),
  interviewReadinessScore: z.number().min(1).max(5),
  strengths: z.array(z.string()).max(3),
  improvements: z.array(z.string()).max(3),
  improvedAnswerVersion: z.string(),
  fillerWordsDetected: z.array(z.string()),
  technicalAccuracyNote: z.string().nullable(),
  quickCoachTip: z.string().optional(),
  followUpQuestion: z.string().optional(),
  keyPointsMentioned: z.array(z.string()).default([]),
  newWeaknesses: z.array(z.string()).default([]),
});

export interface TurnTempContext {
  questionAsked: string;
  keyPointsMentioned: string[];
  weaknessesNoted: string[];
  followUpHint: string;
}

export interface SessionTempContext {
  sessionId: string;
  topicId: string;
  customTopicText?: string;
  feedbackMode: FeedbackMode;
  coachingFocus: CoachingFocus;
  turns: TurnTempContext[];
  expiresAt: number;
}
