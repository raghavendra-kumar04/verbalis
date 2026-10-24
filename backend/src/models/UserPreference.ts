import mongoose, { Schema, Document } from 'mongoose';
import { FeedbackMode, CoachingFocus } from '../types/index.js';

export interface ITopicHistoryItem {
  topicId: string;
  lastPracticed: Date;
  sessionCount: number;
}

export interface IUserPreference extends Document {
  userId: string;
  email: string;
  firstName: string;
  preferredFeedbackMode: FeedbackMode;
  coachingFocus: CoachingFocus;
  speechSpeed: string;
  reducedMotion: boolean;
  topicHistory: ITopicHistoryItem[];
}

const UserPreferenceSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  preferredFeedbackMode: { type: String, enum: ['per_answer', 'end_of_session'], default: 'per_answer' },
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
  speechSpeed: { type: String, default: '1.0x' },
  reducedMotion: { type: Boolean, default: false },
  topicHistory: [{
    topicId: { type: String, required: true },
    lastPracticed: { type: Date, default: Date.now },
    sessionCount: { type: Number, default: 1 }
  }]
}, {
  timestamps: true
});

export const UserPreference = mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema);
