/**
 * Public AI entry point.
 *
 * Import `ai` everywhere — never import provider implementations directly.
 * Swap the provider here if we ever move to a different vendor.
 */
export { getClaudeProvider as ai } from "./claude";
export type { AIRequest, AIResponse, AITier, AIMessage, AIProvider } from "./provider";
