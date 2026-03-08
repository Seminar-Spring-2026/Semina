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
    this.model = getEnv('GEMINI_MODEL') || 'gemini-2.5-flash';
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

    const modelId = options?.model || this.model;
    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: options?.maxOutputTokens ?? 1000,
        temperature: options?.temperature ?? 0.7,
      },
    };
    const axiosConfig = {
      params: { key: this.apiKey },
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    };

    const endpoints: { base: string; model: string }[] = [
      { base: 'https://generativelanguage.googleapis.com/v1beta', model: modelId },
      { base: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.5-flash' },
      { base: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash' },
      { base: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.5-pro' },
    ];

    let response: { status: number; data: unknown } | null = null;
    let lastStatus = 0;
    let lastBody: unknown;

    for (const { base, model } of endpoints) {
      const url = `${base}/models/${encodeURIComponent(model)}:generateContent`;
      const res = await axios.post(url, payload, axiosConfig);
      lastStatus = res.status;
      lastBody = res.data;
      if (res.status === 200) {
        response = { status: res.status, data: res.data };
        break;
      }
      console.error(`[Gemini] ${res.status} for ${model} at ${base}:`, typeof res.data === 'object' && res.data && 'error' in (res.data as object) ? (res.data as { error?: { message?: string } }).error?.message : res.statusText);
    }

    if (!response || response.status !== 200) {
      const body = lastBody as Record<string, unknown> | undefined;
      const errorMessage =
        body && typeof body.error === 'object' && body.error !== null && 'message' in (body.error as object)
          ? String((body.error as { message?: string }).message)
          : `All endpoints returned ${lastStatus}`;
      console.error('[Gemini] All model attempts failed. Last:', errorMessage);
      throw new Error(`Gemini API error: ${errorMessage}`);
    }

    const data = response.data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join('') ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== 'string') {
      throw new Error('Gemini returned an empty response');
    }

    return text;
  }
}

