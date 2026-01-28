import axios from 'axios';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface GeminiChatOptions {
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== '' ? v : undefined;
}

function toGeminiRole(role: ChatRole): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

export class GeminiChatService {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const apiKey = getEnv('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the backend');
    }
    this.apiKey = apiKey;
    this.model = getEnv('GEMINI_MODEL') || 'gemini-1.5-flash';
  }

  public async generateReply(args: {
    systemPrompt: string;
    userMessage: string;
    history?: ChatMessage[];
    options?: GeminiChatOptions;
  }): Promise<string> {
    const { systemPrompt, userMessage, history = [], options } = args;

    const contents = [
      ...history
        .filter((m) => typeof m.content === 'string' && m.content.trim() !== '')
        .map((m) => ({
          role: toGeminiRole(m.role),
          parts: [{ text: m.content }],
        })),
      {
        role: 'user' as const,
        parts: [{ text: userMessage }],
      },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      options?.model || this.model
    )}:generateContent`;

    const response = await axios.post(
      url,
      {
        // Gemini API supports a top-level systemInstruction for system prompts.
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: options?.maxOutputTokens ?? 1000,
          temperature: options?.temperature ?? 0.7,
        },
      },
      {
        params: { key: this.apiKey },
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const text: string | undefined =
      response.data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('') ||
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== 'string') {
      throw new Error('Gemini returned an empty response');
    }

    return text;
  }
}

