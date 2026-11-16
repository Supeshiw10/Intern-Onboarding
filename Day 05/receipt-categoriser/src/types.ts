export const CATEGORIES = ["Meals", "Travel", "Lodging", "Office Supplies", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Source = "llm" | "rule-based";

/** Response body (spec section 3, Outputs). No extra fields. */
export interface CategoriseResult {
  category: Category;
  confidence: number;
  needs_review: boolean;
  source: Source;
  message: string | null;
}

/** A raw suggestion before needs_review/source are applied. */
export interface Suggestion {
  category: Category;
  confidence: number;
}

export interface CategoriseRequest {
  authenticated: boolean;
  claimId?: string;
  file?: { mimeType: string; sizeBytes: number; bytes: Uint8Array };
}

/** Status-only for errors: the spec defines no error body. */
export interface CategoriseResponse {
  status: 200 | 400 | 401 | 403 | 404 | 413 | 502;
  body?: CategoriseResult;
}

export type ClaimAccess = "ok" | "not_found" | "forbidden";

/** OCR could not read or parse the receipt (AC-05). */
export class OcrParseError extends Error {}

/** Any LLM failure: 503, timeout, or unusable output. Triggers rule-based fallback. */
export class LlmUnavailableError extends Error {}

export interface Ports {
  /** Azure AI Document Intelligence. Throws OcrParseError if unreadable; any other throw = service failure. */
  ocr(image: Uint8Array): Promise<{ text: string }>;
  /** Azure OpenAI call. Returns the raw model output; validated by the LLM categoriser. */
  completeWithLlm(receiptText: string): Promise<{ category: unknown; confidence: unknown }>;
  getClaimAccess(claimId: string): Promise<ClaimAccess>;
  /** Existing logger, narrowed to what we need. Maps to an App Insights customEvent. */
  logger: { trackEvent(name: string, properties: Record<string, string | number | boolean>): void };
}
