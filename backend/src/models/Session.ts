import mongoose, { Schema, Document } from 'mongoose';
import { FeedbackMode, CoachingFocus } from '../types/index.js';

export interface ISession extends Document {
  sessionId?: string;
  userId: string;
  topicId: string;
  customTopicText?: string;
  feedbackMode: FeedbackMode;
  coachingFocus: CoachingFocus;
  status: 'active' | 'finished' | 'abandoned';
  turnCount: number;
  coveredSubtopics: string[];
  startedAt: Date;
  finishedAt?: Date;
}

const SessionSchema: Schema = new Schema({
  sessionId: { type: String, index: true },
  userId: { type: String, required: true, index: true },
  topicId: { type: String, required: true },
  customTopicText: { type: String },
  feedbackMode: { type: String, enum: ['per_answer', 'end_of_session'], required: true },
  coachingFocus: { 
    type: String, 
    enum: [
      'grammar', 
      'technical_accuracy', 
      'answer_structure', 
      'filler_words', 
      'pacing', 
      'interview_readiness', 
      'vocabulary', 
      'all_round'
    ], 
    default: 'all_round' 
  },
  status: { type: String, enum: ['active', 'finished', 'abandoned'], default: 'active' },
  turnCount: { type: Number, default: 0 },
  coveredSubtopics: { type: [String], default: [] },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date }
}, {
  timestamps: true
});

export const Session = mongoose.model<ISession>('Session', SessionSchema);
