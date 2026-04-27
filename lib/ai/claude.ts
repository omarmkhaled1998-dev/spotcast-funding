import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIRequest, AIResponse } from "./provider";

// Model identifiers — use full date-versioned IDs for stability
const MODELS: Record<"fast" | "smart", string> = {
  fast:  "claude-haiku-4-5",   // Bulk scoring, background jobs — low cost
  smart: "claude-sonnet-4-5",  // Interactive writing + analysis — higher quality
};

// Pricing in USD per 1M tokens (update when Anthropic changes pricing)
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5":  { input: 0.80,  output: 4.00  },
  "claude-sonnet-4-5": { input: 3.00,  output: 15.00 },
};

function computeCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const p = PRICING[model] ?? { input: 3.0, output: 15.0 };
  const usd = (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
  return Math.round(usd * 100);
}

class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    });
  }

  async complete(request: AIRequest): Promise<AIResponse> {
    const model = MODELS[request.tier];
    const maxTokens = request.maxTokens ?? 1500;
    const temperature = request.temperature ?? 0.3;

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: request.system,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    return {
      content,
      inputTokens,
      outputTokens,
      costUsdCents: computeCostCents(model, inputTokens, outputTokens),
      model,
    };
  }

  async *stream(request: AIRequest): AsyncGenerator<string> {
    const model = MODELS[request.tier];
    const maxTokens = request.maxTokens ?? 2000;
    const temperature = request.temperature ?? 0.3;

    const stream = this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature,
      system: request.system,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}

// Singleton — instantiated lazily so missing API key doesn't crash on import
let _instance: ClaudeProvider | null = null;

export function getClaudeProvider(): AIProvider {
  if (!_instance) _instance = new ClaudeProvider();
  return _instance;
}
