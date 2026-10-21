import mongoose, { Schema, Document } from 'mongoose';

export interface ITopic extends Document {
  topicId: string;
  name: string;
  category: string;
  subtopics: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  sampleQuestions: string[];
  isCustom: boolean;
}

const TopicSchema: Schema = new Schema({
  topicId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  subtopics: { type: [String], default: [] },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  sampleQuestions: { type: [String], default: [] },
  isCustom: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const Topic = mongoose.model<ITopic>('Topic', TopicSchema);
