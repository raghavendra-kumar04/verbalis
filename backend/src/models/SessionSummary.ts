import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionSummary extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: string;
  topicId: string;
  overallScore: {
    grammar: number;
    clarity: number;
    technicalAccuracy: number;
    interviewReadiness: number;
  };
  strengths: string[];
  recurringWeaknesses: string[];
  recommendedExercises: string[];
  improvedAnswerExample?: string;
  turnCount: number;
  durationSeconds?: number;
  createdAt: Date;
}

const SessionSummarySchema: Schema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  userId: { type: String, required: true, index: true },
  topicId: { type: String, required: true },
  overallScore: {
    grammar: { type: Number, required: true, min: 1, max: 5 },
    clarity: { type: Number, required: true, min: 1, max: 5 },
    technicalAccuracy: { type: Number, required: true, min: 1, max: 5 },
    interviewReadiness: { type: Number, required: true, min: 1, max: 5 }
  },
  strengths: { type: [String], default: [] },
  recurringWeaknesses: { type: [String], default: [] },
  recommendedExercises: { type: [String], default: [] },
  improvedAnswerExample: { type: String },
  turnCount: { type: Number, default: 0 },
  durationSeconds: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const SessionSummary = mongoose.model<ISessionSummary>('SessionSummary', SessionSummarySchema);
