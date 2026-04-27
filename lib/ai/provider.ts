/**
 * Provider-agnostic AI abstraction.
 *
 * Callers import `ai` from `lib/ai/index.ts` — never the Claude module directly.
 * This lets us swap providers (OpenAI, Gemini, etc.) without touching call sites.
 */

export type AITier = "fast" | "smart";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIRequest {
  /** "fast" → claude-3-5-haiku (bulk). "smart" → claude-sonnet-4-5 (interactive). */
  tier: AITier;
  system?: string;
  messages: AIMessage[];
  /** Max tokens to generate (default: 1500) */
  maxTokens?: number;
  /** Temperature 0–1 (default: 0.3) */
  temperature?: number;
}

export interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  /** Cost in USD cents (rounded) */
  costUsdCents: number;
  model: string;
}

export interface AIProvider {
  complete(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): AsyncGenerator<string>;
}
