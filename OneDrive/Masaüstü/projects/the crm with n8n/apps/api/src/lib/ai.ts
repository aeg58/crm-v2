import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@crm/config';

// AI Service Class
export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  // Sentiment Analysis
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_POSITIVE' | 'VERY_NEGATIVE';
    confidence: number;
    emotions: string[];
  }> {
    try {
      const prompt = `
        Analyze the sentiment of this message: "${text}"
        
        Return a JSON response with:
        - sentiment: one of "POSITIVE", "NEUTRAL", "NEGATIVE", "VERY_POSITIVE", "VERY_NEGATIVE"
        - confidence: number between 0 and 1
        - emotions: array of detected emotions (e.g., ["happy", "excited", "frustrated"])
        
        Be precise and objective in your analysis.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = JSON.parse(response.text());

      return {
        sentiment: this.normalizeSentiment(analysis.sentiment),
        confidence: analysis.confidence || 0.5,
        emotions: analysis.emotions || []
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        sentiment: 'NEUTRAL',
        confidence: 0.5,
        emotions: []
      };
    }
  }

  // Intent Classification
  async classifyIntent(text: string): Promise<{
    intent: MessageIntent;
    confidence: number;
    entities: Record<string, any>;
  }> {
    try {
      const prompt = `
        Classify the intent of this customer message: "${text}"
        
        Possible intents:
        - PRICING: Questions about prices, costs, plans
        - DEMO: Requests for demonstrations, trials, samples
        - SUPPORT: Technical issues, problems, complaints
        - COMPLAINT: Dissatisfaction, negative feedback
        - PURCHASE: Ready to buy, asking about purchase process
        - GENERAL: General questions, greetings, other
        
        Return JSON with:
        - intent: the classified intent
        - confidence: number between 0 and 1
        - entities: extracted entities (products, amounts, dates, etc.)
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const classification = JSON.parse(response.text());

      return {
        intent: this.normalizeIntent(classification.intent),
        confidence: classification.confidence || 0.5,
        entities: classification.entities || {}
      };
    } catch (error) {
      console.error('Intent classification error:', error);
      return {
        intent: MessageIntent.GENERAL,
        confidence: 0.5,
        entities: {}
      };
    }
  }

  // Lead Scoring
  async calculateLeadScore(
    message: string,
    customerHistory: {
      messageCount: number;
      lastInteraction: Date;
      previousIntents: MessageIntent[];
      averageResponseTime: number;
    }
  ): Promise<{
    score: number;
    factors: Record<string, number>;
    recommendations: string[];
  }> {
    try {
      const prompt = `
        Calculate a lead score (0-100) for this customer based on:
        
        Current message: "${message}"
        Customer history:
        - Message count: ${customerHistory.messageCount}
        - Last interaction: ${customerHistory.lastInteraction}
        - Previous intents: ${customerHistory.previousIntents.join(', ')}
        - Average response time: ${customerHistory.averageResponseTime}ms
        
        Consider factors like:
        - Purchase intent keywords
        - Urgency indicators
        - Engagement level
        - Response time
        - Message frequency
        
        Return JSON with:
        - score: number between 0 and 100
        - factors: breakdown of scoring factors
        - recommendations: actionable next steps
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const scoring = JSON.parse(response.text());

      return {
        score: Math.min(Math.max(scoring.score || 50, 0), 100),
        factors: scoring.factors || {},
        recommendations: scoring.recommendations || []
      };
    } catch (error) {
      console.error('Lead scoring error:', error);
      return {
        score: 50,
        factors: {},
        recommendations: ['Follow up with customer']
      };
    }
  }

  // Response Generation
  async generateResponse(
    customerMessage: string,
    context: {
      customerName?: string;
      previousMessages?: string[];
      productInfo?: string;
      intent: MessageIntent;
    }
  ): Promise<{
    response: string;
    tone: 'professional' | 'friendly' | 'urgent' | 'empathetic';
    suggestedActions: string[];
  }> {
    try {
      const prompt = `
        Generate a professional customer service response for this message: "${customerMessage}"
        
        Context:
        - Customer: ${context.customerName || 'Unknown'}
        - Intent: ${context.intent}
        - Previous messages: ${context.previousMessages?.join(' | ') || 'None'}
        - Product info: ${context.productInfo || 'Not provided'}
        
        Return JSON with:
        - response: professional, helpful response (max 200 words)
        - tone: appropriate tone for the situation
        - suggestedActions: next steps for the agent
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const generated = JSON.parse(response.text());

      return {
        response: generated.response || 'Thank you for your message. We will get back to you soon.',
        tone: generated.tone || 'professional',
        suggestedActions: generated.suggestedActions || ['Follow up']
      };
    } catch (error) {
      console.error('Response generation error:', error);
      return {
        response: 'Thank you for your message. We will get back to you soon.',
        tone: 'professional',
        suggestedActions: ['Follow up']
      };
    }
  }

  // Keyword Extraction
  async extractKeywords(text: string): Promise<{
    keywords: string[];
    categories: string[];
    urgency: 'low' | 'medium' | 'high';
  }> {
    try {
      const prompt = `
        Extract keywords and analyze this message: "${text}"
        
        Return JSON with:
        - keywords: important words/phrases
        - categories: topic categories (e.g., "billing", "technical", "sales")
        - urgency: urgency level based on language used
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const extraction = JSON.parse(response.text());

      return {
        keywords: extraction.keywords || [],
        categories: extraction.categories || [],
        urgency: extraction.urgency || 'low'
      };
    } catch (error) {
      console.error('Keyword extraction error:', error);
      return {
        keywords: [],
        categories: [],
        urgency: 'low'
      };
    }
  }

  // Helper methods
  private normalizeSentiment(sentiment: string): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_POSITIVE' | 'VERY_NEGATIVE' {
    const normalized = sentiment.toUpperCase();
    if (normalized.includes('VERY_POSITIVE') || normalized.includes('VERY POSITIVE')) return 'VERY_POSITIVE';
    if (normalized.includes('VERY_NEGATIVE') || normalized.includes('VERY NEGATIVE')) return 'VERY_NEGATIVE';
    if (normalized.includes('POSITIVE')) return 'POSITIVE';
    if (normalized.includes('NEGATIVE')) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  private normalizeIntent(intent: string): MessageIntent {
    const normalized = intent.toUpperCase();
    if (Object.values(MessageIntent).includes(normalized as MessageIntent)) {
      return normalized as MessageIntent;
    }
    return MessageIntent.GENERAL;
  }
}

// Message Intent Enum
export enum MessageIntent {
  PRICING = 'PRICING',
  DEMO = 'DEMO',
  SUPPORT = 'SUPPORT',
  COMPLAINT = 'COMPLAINT',
  PURCHASE = 'PURCHASE',
  GENERAL = 'GENERAL'
}

// AI Service Instance
export const aiService = new AIService();
