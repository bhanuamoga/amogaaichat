// utils/calculateCost.ts

interface Usage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export function calculateCost(
  provider: string,
  model: string,
  usage?: Usage
): number {
  if (!usage) return 0;

  const input = usage.promptTokens ?? 0;
  const output = usage.completionTokens ?? 0;

  // Example pricing table (per 1K tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    // OpenAI
    "openai:gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "openai:gpt-4o": { input: 0.0025, output: 0.01 },

    // Google Gemini
    "google:gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
    "google:gemini-1.5-pro": { input: 0.00125, output: 0.005 },
    "google:gemini-2.0-flash": { input: 0.0001, output: 0.0004 },
    "google:gemini-2.5-flash": { input: 0.0001, output: 0.0004 },

    // Anthropic Claude
    "claude:claude-3-5-sonnet": { input: 0.003, output: 0.015 },

    // Mistral
    "mistral:mistral-large-latest": { input: 0.002, output: 0.006 },

    // Groq (llama)
    "groq:llama-3.3-70b": { input: 0.00005, output: 0.0001 },
  };

  const key = `${provider}:${model}`;
  const price = pricing[key];

  if (!price) {
    console.warn(`No pricing found for ${key}`);
    return 0;
  }

  const cost =
    (input / 1000) * price.input + (output / 1000) * price.output;

  return parseFloat(cost.toFixed(6)); // round to 6 decimals
}
