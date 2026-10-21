import fs from 'fs';
import Groq from 'groq-sdk';
import { FeedbackObject, FeedbackObjectSchema, TurnTempContext } from '../types/index.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_groq_key',
});

export class GroqService {
  /**
   * Transcribes an audio file (.m4a) using Groq Whisper model.
   * File is deleted immediately after transcription.
   */
  public static async transcribeAudio(filePath: string): Promise<string> {
    try {
      const response = await groq.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-large-v3-turbo',
        language: 'en',
        response_format: 'json',
      });
      return response.text.trim();
    } finally {
      // Ephemeral storage guarantee: always delete uploaded raw audio immediately
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('Failed to delete temp audio file:', filePath, err);
      }
    }
  }

  /**
   * Evaluates speech answer using LLaMA 3.3 70B Versatile with strict JSON Schema.
   */
  public static async evaluateAnswer(
    topicName: string,
    questionAsked: string,
    transcript: string,
    coachingFocus: string,
    priorWeaknesses: string[] = []
  ): Promise<FeedbackObject> {
    const systemPrompt = `You are an English communication coach for technical interviews.
Evaluate spoken English communication. Preserve technical terms exactly (HashMap, O(n), polymorphism, etc.).
Correct real errors only; do not rewrite informal but correct speech.
Never invent filler words, mistakes, or pauses not in the transcript.
Distinguish possible transcription errors from genuine mistakes.
Do not penalize Indian English accent. Separate communication quality from technical correctness.
Respond ONLY in valid JSON matching the schema.`;

    const userPrompt = `Topic: ${topicName}
Question Asked: ${questionAsked}
User's Spoken Transcript: "${transcript}"
User Coaching Focus: ${coachingFocus}
Prior Weaknesses Noted: ${priorWeaknesses.join(', ') || 'None'}

Evaluate this verbal answer. Provide constructive feedback, phrasing upgrade, and coach tip. Return JSON:
{
  "grammarScore": <1-5>,
  "clarityScore": <1-5>,
  "technicalAccuracyScore": <1-5>,
  "interviewReadinessScore": <1-5>,
  "strengths": ["<max 2 brief strings>"],
  "improvements": ["<max 2 brief strings>"],
  "improvedAnswerVersion": "<clearer, more executive phrasing>",
  "fillerWordsDetected": ["<only words genuinely spoken>"],
  "technicalAccuracyNote": "<observation or null>",
  "quickCoachTip": "<1 practical actionable tip>",
  "followUpQuestion": "<adaptive follow-up question>",
  "keyPointsMentioned": ["<summary points for context>"],
  "newWeaknesses": ["<any recurring issues>"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return FeedbackObjectSchema.parse(parsed);
  }

  /**
   * Generates next adaptive follow-up question using lightweight LLaMA 3.1 8B Instant.
   */
  public static async generateFollowUpQuestion(
    topicName: string,
    lastQuestion: string,
    keyPoints: string[]
  ): Promise<string> {
    const prompt = `Topic: ${topicName}
Previously Asked: ${lastQuestion}
Key Points User Covered: ${keyPoints.join(', ')}

Generate one adaptive, natural follow-up technical interview question. Return JSON:
{ "question": "<question string>" }`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 200,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return parsed.question || 'Could you elaborate on the practical trade-offs of this approach?';
  }
}
