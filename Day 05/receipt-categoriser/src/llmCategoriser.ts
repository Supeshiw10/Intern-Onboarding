import { CATEGORIES, LlmUnavailableError, type Category, type Ports, type Suggestion } from "./types.ts";

/**
 * Asks the LLM for a category and validates the answer.
 * Throws LlmUnavailableError on any failure so the caller can fall back.
 */
export async function llmCategorise(
  receiptText: string,
  complete: Ports["completeWithLlm"],
): Promise<Suggestion> {
  let raw;
  try {
    raw = await complete(receiptText);
  } catch (e) {
    throw new LlmUnavailableError(`LLM call failed: ${(e as Error).message}`);
  }
  const { category, confidence } = raw ?? {};
  const validCategory = (CATEGORIES as readonly unknown[]).includes(category);
  const validConfidence = typeof confidence === "number" && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1;
  if (!validCategory || !validConfidence) {
    throw new LlmUnavailableError("LLM returned an invalid category or confidence");
  }
  return { category: category as Category, confidence };
}
