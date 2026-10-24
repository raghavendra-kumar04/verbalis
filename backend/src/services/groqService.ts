import 'dotenv/config';
import fs from 'fs';
import Groq from 'groq-sdk';
import { DifficultyLevel, FeedbackObject, FeedbackObjectSchema, SessionSummaryResult, TurnTempContext } from '../types/index.js';

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'dummy_groq_key') {
    throw new Error('GROQ_API_KEY is missing or invalid in environment. Please provide a valid Groq API key.');
  }
  return new Groq({ apiKey });
}

// ---------------------------------------------------------------------------
// Difficulty Tier Descriptors
// ---------------------------------------------------------------------------

const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  beginner:     'Beginner (foundational – definitions, "what is", simple examples)',
  intermediate: 'Intermediate (practical usage, common pitfalls, code-level reasoning)',
  advanced:     'Advanced (system design trade-offs, concurrency, failure modes, performance tuning)',
};

const DIFFICULTY_GUIDANCE: Record<DifficultyLevel, string> = {
  beginner: `Ask "what is" or "can you define" style questions.
Focus on basic concepts, vocabulary, and simple real-world examples.
DO NOT ask about system design, trade-offs, concurrency, or performance.
Example style: "What is a hash table and when would you use one?"`,

  intermediate: `Ask practical questions about usage, typical problems, and code-level thinking.
You may ask about trade-offs between two options, common bugs, or implementation decisions.
DO NOT ask about large-scale distributed systems or deep concurrency internals.
Example style: "What happens when two keys have the same hash value, and how is that handled?"`,

  advanced: `Ask deep questions about system-level trade-offs, concurrency pitfalls, performance bottlenecks, or architectural decisions.
Challenge the candidate with edge cases, failure modes, or scalability concerns.
Example style: "How would you design a consistent hashing ring that handles hot-spot redistribution under node failure?"`,
};

/**
 * Computes next difficulty based on last N technical accuracy scores.
 * Rules:
 *   - After 2 consecutive good answers (technicalScore >= 4), bump up one level.
 *   - If last answer was very poor (technicalScore <= 2), drop one level.
 *   - Score 3 → stay at current level.
 */
export function computeNextDifficulty(
  currentDifficulty: DifficultyLevel,
  recentTurns: TurnTempContext[]
): DifficultyLevel {
  const scoredTurns = recentTurns.filter((t) => t.technicalScore != null);
  if (scoredTurns.length === 0) return currentDifficulty;

  const lastScore = scoredTurns[scoredTurns.length - 1].technicalScore!;
  const last2 = scoredTurns.slice(-2).map((t) => t.technicalScore!);
  const allRecentGood = last2.length >= 2 && last2.every((s) => s >= 4);

  if (allRecentGood) {
    if (currentDifficulty === 'beginner') return 'intermediate';
    if (currentDifficulty === 'intermediate') return 'advanced';
    return 'advanced';
  }

  if (lastScore <= 2) {
    if (currentDifficulty === 'advanced') return 'intermediate';
    if (currentDifficulty === 'intermediate') return 'beginner';
    return 'beginner';
  }

  return currentDifficulty;
}



export class GroqService {
  /**
   * Transcribes an audio file (.m4a / .webm) using Groq Whisper model.
   * File is deleted immediately after transcription.
   */
  public static async transcribeAudio(filePath: string): Promise<string> {
    const groq = getGroqClient();
    try {
      const response = await groq.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-large-v3-turbo',
        language: 'en',
        response_format: 'json',
      });
      return response.text ? response.text.trim() : '';
    } catch (err: any) {
      console.warn('Groq Whisper transcription notice:', err.message);
      // If Groq fails because of invalid media or audio with zero voice, return empty string so session asks for clarification
      if (err.message?.includes('invalid_media_file') || err.message?.includes('could not process file')) {
        return '';
      }
      throw err;
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
   * Evaluates speech answer using high-capability model with automatic fast model fallback.
   */
  public static async evaluateAnswer(
    topicName: string,
    questionAsked: string,
    transcript: string,
    coachingFocus: string,
    priorWeaknesses: string[] = []
  ): Promise<FeedbackObject> {
    const systemPrompt = `You are an expert English communication coach for technical interviews.
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

Evaluate this verbal answer. Provide constructive feedback, phrasing upgrade, and a fresh adaptive follow-up question. Return JSON:
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
  "followUpQuestion": "<distinct, technical follow-up question digging deeper into trade-offs or edge cases>",
  "keyPointsMentioned": ["<summary points for context>"],
  "newWeaknesses": ["<any recurring issues>"]
}`;

    const groq = getGroqClient();
    let content = '{}';

    try {
      const completion = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1000,
      });
      content = completion.choices[0]?.message?.content || '{}';
    } catch (err: any) {
      console.warn('Qwen evaluation notice, trying fallback:', err.message);
      const fallbackCompletion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1000,
      });
      content = fallbackCompletion.choices[0]?.message?.content || '{}';
    }

    try {
      const parsed = JSON.parse(content);
      return FeedbackObjectSchema.parse(parsed);
    } catch (parseErr: any) {
      console.warn('Schema parse fallback:', parseErr.message);
      return FeedbackObjectSchema.parse({
        grammarScore: 4,
        clarityScore: 4,
        technicalAccuracyScore: 4,
        interviewReadinessScore: 4,
        strengths: ['Addressed the question clearly'],
        improvements: ['Elaborate with deeper concrete examples'],
        improvedAnswerVersion: transcript,
        fillerWordsDetected: [],
        technicalAccuracyNote: null,
        quickCoachTip: 'Structure your answers using the STAR method or definition-first approach.',
        followUpQuestion: `How would you handle failure scenarios or scaling bottlenecks in this approach?`,
      });
    }
  }

  /**
   * Generates the FIRST question for a session.
   * ALWAYS starts at BEGINNER level — a friendly, definitional warm-up question.
   */
  public static async generateInitialQuestion(
    topicName: string,
    subtopics: string[] = []
  ): Promise<string> {
    const groq = getGroqClient();
    const subtopicHint = subtopics.length > 0 ? `Related subtopics: ${subtopics.slice(0, 4).join(', ')}.` : '';

    const prompt = `Topic: ${topicName}.
${subtopicHint}
Difficulty: ${DIFFICULTY_LABEL['beginner']}
${DIFFICULTY_GUIDANCE['beginner']}

Generate exactly ONE beginner-friendly opening interview question about ${topicName}.
This is the very FIRST question — it must be approachable for someone with basic knowledge of the topic.
Ask for a definition, a simple explanation, or a basic real-world use case.
DO NOT ask about advanced internals, system design, trade-offs, or concurrency.
Respond ONLY in valid JSON format:
{ "question": "<question string>" }`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: 'You are a friendly technical interviewer warming up a candidate. Always output valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 300,
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      if (parsed.question && parsed.question.trim().length > 10) {
        return parsed.question.trim();
      }
    } catch (err: any) {
      console.warn('Initial question generation warning:', err.message);
    }

    return `Can you explain what ${topicName} is and give a simple real-world example of where it's used?`;
  }

  /**
   * Generates an adaptive, non-repeating follow-up question.
   * Difficulty is explicitly passed in (computed by sessions.ts from user scores).
   */
  public static async generateFollowUpQuestion(
    topicName: string,
    lastQuestion: string,
    allPreviousQuestions: string[] = [],
    difficulty: DifficultyLevel = 'beginner'
  ): Promise<string> {
    const groq = getGroqClient();
    const historyText = allPreviousQuestions.length > 0
      ? `Questions already asked (DO NOT repeat any of these concepts):\n${allPreviousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : `Last question asked: ${lastQuestion}`;

    const prompt = `Topic: ${topicName}
${historyText}

Difficulty for NEXT question: ${DIFFICULTY_LABEL[difficulty]}
${DIFFICULTY_GUIDANCE[difficulty]}

CRITICAL RULES:
- The question MUST be completely different from all previous questions listed above.
- Never repeat concepts already covered.
- Match the difficulty level described above EXACTLY — do not go harder or easier than specified.
- Ask one clear, focused question. No multi-part questions.
Respond ONLY in valid JSON format:
{ "question": "<question string>" }`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: 'You are an adaptive technical interviewer. Always output valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 300,
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      if (parsed.question && parsed.question.trim().length > 10) {
        return parsed.question.trim();
      }
    } catch (err: any) {
      console.warn('Follow-up generation warning:', err.message);
    }

    // Difficulty-appropriate fallbacks
    const fallbacks: Record<DifficultyLevel, string> = {
      beginner:     `Can you describe what ${topicName} is used for in a simple application?`,
      intermediate: `What is a common mistake developers make when working with ${topicName}, and how would you avoid it?`,
      advanced:     `How would you diagnose and optimize performance bottlenecks if a ${topicName}-based system experienced high latency under heavy load?`,
    };
    return fallbacks[difficulty];
  }

  /**
   * Synthesizes an executive session evaluation report based strictly on what the candidate actually said.
   */
  public static async generateSessionSummary(
    topicName: string,
    turns: TurnTempContext[],
    durationSeconds: number = 0
  ): Promise<SessionSummaryResult> {
    const spokenTurns = turns.filter(
      (t) => (t.userTranscript && t.userTranscript.trim().length > 0) || t.technicalScore != null
    );

    if (spokenTurns.length === 0) {
      return {
        overallScore: {
          grammar: 1.0,
          clarity: 1.0,
          technicalAccuracy: 1.0,
          interviewReadiness: 1.0,
          average: 1.0,
        },
        headline: 'Practice Session Ended Early',
        executiveSummary:
          'No verbal answers were recorded during this session. In your next practice, speak clearly into the microphone to receive in-depth AI evaluation.',
        readinessBadge: 'Needs Practice',
        strengths: ['Started an interview practice session'],
        recurringWeaknesses: ['Speak your answers aloud into the microphone so your delivery and technical depth can be analyzed.'],
        recommendedExercises: ['Practice explaining a foundational concept out loud in 60 seconds.'],
        turnCount: 0,
        durationSeconds,
      };
    }

    // Compute rubric averages from actual turns
    const calcAvg = (scores: (number | undefined)[], fallback = 3.5): number => {
      const valid = scores.filter((s): s is number => typeof s === 'number' && !isNaN(s) && s > 0);
      if (valid.length === 0) return fallback;
      return Math.round((valid.reduce((sum, val) => sum + val, 0) / valid.length) * 10) / 10;
    };

    const grammar = calcAvg(spokenTurns.map((t) => t.grammarScore));
    const clarity = calcAvg(spokenTurns.map((t) => t.clarityScore));
    const technicalAccuracy = calcAvg(spokenTurns.map((t) => t.technicalScore));
    const interviewReadiness = calcAvg(spokenTurns.map((t) => t.interviewReadinessScore));
    const average = Math.round(((grammar + clarity + technicalAccuracy + interviewReadiness) / 4) * 10) / 10;

    let defaultBadge = 'Good Interview Readiness';
    if (average >= 4.3) defaultBadge = 'Strong Interview Readiness';
    else if (average >= 3.6) defaultBadge = 'Good Interview Readiness';
    else if (average >= 2.8) defaultBadge = 'Moderate Interview Readiness';
    else defaultBadge = 'Needs Foundational Practice';

    // Collect strengths & weaknesses from the turns already evaluated
    const allTurnStrengths = spokenTurns.flatMap((t) => t.strengths || []).filter(Boolean);
    const allTurnWeaknesses = spokenTurns.flatMap((t) => t.weaknessesNoted || []).filter(Boolean);

    // Fallback summary if LLM call fails
    const fallbackSummary: SessionSummaryResult = {
      overallScore: {
        grammar,
        clarity,
        technicalAccuracy,
        interviewReadiness,
        average,
      },
      headline: average >= 4.0 ? 'Solid Technical Articulation' : average >= 3.0 ? 'Developing Technical Delivery' : 'Foundational Practice Required',
      executiveSummary: `You completed ${spokenTurns.length} interview question${spokenTurns.length > 1 ? 's' : ''} on ${topicName}. Continue practicing structured delivery and deep technical explanations.`,
      readinessBadge: defaultBadge,
      strengths: allTurnStrengths.length >= 2 ? allTurnStrengths.slice(0, 2) : (allTurnStrengths.length === 1 ? [allTurnStrengths[0], `Attempted direct technical explanation for ${topicName}.`] : [`Addressed interview questions on ${topicName}.`, 'Showed willingness to communicate technical thought process.']),
      recurringWeaknesses: allTurnWeaknesses.length >= 2 ? allTurnWeaknesses.slice(0, 2) : (allTurnWeaknesses.length === 1 ? [allTurnWeaknesses[0], 'Provide concrete examples and trade-offs in answers.'] : ['Structure responses with definitions first followed by real-world use cases.', 'Reduce hesitation and pause deliberately when forming thoughts.']),
      recommendedExercises: [`Practice a timed 2-minute explanation of core concepts in ${topicName}.`],
      turnCount: spokenTurns.length,
      durationSeconds,
    };

    const transcriptDigest = spokenTurns.map((t, idx) => {
      return `Question ${idx + 1}: "${t.questionAsked}"\nCandidate's Spoken Answer: "${t.userTranscript || '(brief answer)'}"`;
    }).join('\n\n');

    const prompt = `Topic: ${topicName}
Number of Questions Answered: ${spokenTurns.length}

Actual Candidate Transcripts:
${transcriptDigest}

Calculated Rubric Scores:
- Grammar & Formation: ${grammar} / 5
- Clarity & Structure: ${clarity} / 5
- Technical Accuracy: ${technicalAccuracy} / 5
- Interview Readiness: ${interviewReadiness} / 5
- Overall Average: ${average} / 5

CRITICAL RULES:
1. Base all feedback STRICTLY AND ONLY on the candidate's actual spoken answers above.
2. DO NOT mention or invent concepts, jargon, or keywords that the candidate never said (for example, NEVER mention collision resolution or load factor if the candidate did not explicitly discuss them).
3. If the candidate was hesitant, brief, or incomplete, accurately reflect that in a constructive, encouraging manner.
4. Headline: 3 to 5 words (e.g., "Clear Foundational Explanation", "Developing Technical Depth", "Needs More Concrete Detail").
5. Executive Summary: 1-2 sentences summarizing their genuine verbal performance across the answered questions.
6. Readiness Badge: One of "Strong Interview Readiness", "Good Interview Readiness", "Moderate Interview Readiness", "Needs Foundational Practice".
7. Strengths: Exactly 2 concise bullet points highlighting genuine strengths observed in their speech.
8. Recurring Weaknesses (Key Focus for Next Practice): Exactly 2 concise bullet points with actionable improvements based on their real answers.
9. Recommended Exercises: Exactly 1-2 specific practice exercises directly tailored to their gaps.

Respond ONLY in valid JSON matching this structure:
{
  "headline": "<headline>",
  "executiveSummary": "<1-2 sentences>",
  "readinessBadge": "<badge>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "recurringWeaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendedExercises": ["<exercise 1>"]
}`;

    try {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: 'You are an elite technical interview evaluation coach. Always ground your report strictly in the provided candidate transcript. Always output valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 600,
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      if (parsed.headline && Array.isArray(parsed.strengths) && parsed.strengths.length > 0) {
        return {
          overallScore: {
            grammar,
            clarity,
            technicalAccuracy,
            interviewReadiness,
            average,
          },
          headline: parsed.headline.trim(),
          executiveSummary: parsed.executiveSummary?.trim() || fallbackSummary.executiveSummary,
          readinessBadge: parsed.readinessBadge?.trim() || defaultBadge,
          strengths: parsed.strengths.slice(0, 2),
          recurringWeaknesses: Array.isArray(parsed.recurringWeaknesses) && parsed.recurringWeaknesses.length > 0 ? parsed.recurringWeaknesses.slice(0, 2) : fallbackSummary.recurringWeaknesses,
          recommendedExercises: Array.isArray(parsed.recommendedExercises) && parsed.recommendedExercises.length > 0 ? parsed.recommendedExercises.slice(0, 2) : fallbackSummary.recommendedExercises,
          turnCount: spokenTurns.length,
          durationSeconds,
        };
      }
    } catch (err: any) {
      console.warn('Session summary LLM generation notice:', err.message);
    }

    return fallbackSummary;
  }
}

