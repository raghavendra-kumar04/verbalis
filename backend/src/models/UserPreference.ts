import mongoose, { Schema, Document } from 'mongoose';
import { FeedbackMode, CoachingFocus } from '../types/index.js';

export interface ITopicHistoryItem {
  topicId: string;
  lastPracticed: Date;
  sessionCount: number;
}

export interface IUserPreference extends Document {
  userId: string;
  preferredFeedbackMode: FeedbackMode;
  coachingFocus: CoachingFocus;
  topicHistory: ITopicHistoryItem[];
}

const UserPreferenceSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
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
  topicHistory: [{
    topicId: { type: String, required: true },
    lastPracticed: { type: Date, default: Date.now },
    sessionCount: { type: Number, default: 1 }
  }]
}, {
  timestamps: true
});

export const UserPreference = mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema);
