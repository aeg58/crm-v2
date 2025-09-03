import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@crm/config';
import { TextAnalysis } from '@crm/types';

type SentimentUpper = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_POSITIVE' | 'VERY_NEGATIVE';

function toSentimentUpper(s?: string): SentimentUpper {
  const m = (s || '').toLowerCase();
  if (m === 'positive') return 'POSITIVE';
  if (m === 'negative') return 'NEGATIVE';
  if (m === 'very_positive') return 'VERY_POSITIVE';
  if (m === 'very_negative') return 'VERY_NEGATIVE';
  return 'NEUTRAL';
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Analyzes text using Gemini API to extract sentiment, lead score, intent, and tags
 * @param text - The text to analyze
 * @returns Promise<TextAnalysis> - Analysis results with sentiment, score, intent, and tags
 */
export async function analyzeText(text: string): Promise<TextAnalysis> {
  try {
    // Set timeout for the request
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout')), 8000);
    });

    const analysisPromise = model.generateContent(`
      Analyze the following customer message and provide a JSON response with:
      1. sentiment: "positive", "neutral", or "negative"
      2. score: lead score from 0-100 (higher = more likely to convert)
      3. intent: brief description of customer intent
      4. tags: array of relevant tags (max 5)

      Message: "${text}"

      Respond with only valid JSON in this format:
      {
        "sentiment": "positive|neutral|negative",
        "score": number,
        "intent": "string",
        "tags": ["string", "string"]
      }
    `);

    const result = await Promise.race([analysisPromise, timeoutPromise]);
    const response = await result.response;
    const analysisText = response.text();

    // Parse the JSON response
    const analysis = JSON.parse(analysisText.trim());

    // Validate and sanitize the response
    const sentiment = toSentimentUpper(analysis.sentiment);

    const score = Math.max(0, Math.min(100, parseInt(analysis.score) || 50));
    const intent = analysis.intent || 'general inquiry';
    const tags = Array.isArray(analysis.tags) 
      ? analysis.tags.slice(0, 5).filter((tag: any) => typeof tag === 'string')
      : [];

    return {
      sentiment: sentiment as 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
      score,
      intent,
      tags
    };

  } catch (error) {
    console.error('Gemini analysis error:', error);
    
    // Return default neutral analysis on error
    return {
      sentiment: 'NEUTRAL',
      score: 50,
      intent: 'general inquiry',
      tags: []
    };
  }
}

/**
 * Batch analyze multiple texts
 * @param texts - Array of texts to analyze
 * @returns Promise<TextAnalysis[]> - Array of analysis results
 */
export async function analyzeTexts(texts: string[]): Promise<TextAnalysis[]> {
  const promises = texts.map((text: string) => analyzeText(text));
  return Promise.all(promises);
}
