import { llmCategorise } from "./llmCategoriser.ts";
import { ruleBasedCategorise } from "./ruleBasedCategoriser.ts";
import {
  OcrParseError,
  type CategoriseRequest, type CategoriseResponse, type CategoriseResult, type Category, type Ports, type Source,
} from "./types.ts";

export const REVIEW_THRESHOLD = 0.6;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // ASSUMPTION: "10 MB" = 10 MiB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
export const OCR_FAILURE_MESSAGE =
  "We could not read this receipt. Please select a category manually.";

function buildResult(category: Category, confidence: number, source: Source, message: string | null = null): CategoriseResult {
  return { category, confidence, needs_review: confidence < REVIEW_THRESHOLD, source, message };
}

/**
 * PII protection (AC-07): the event is built only from derived fields.
 * Receipt text, names and card numbers never reach the logger.
 */
function emitSuggested(ports: Ports, r: CategoriseResult): void {
  ports.logger.trackEvent("categoriser.suggested", {
    category: r.category,
    confidence: r.confidence,
    needs_review: r.needs_review,
    source: r.source,
  });
}

export async function categoriseReceipt(req: CategoriseRequest, ports: Ports): Promise<CategoriseResponse> {
  if (!req.authenticated) return { status: 401 };
  if (!req.claimId || !req.file) return { status: 400 };
  if (req.file.sizeBytes > MAX_FILE_BYTES) return { status: 413 };
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimeType)) return { status: 400 };

  const access = await ports.getClaimAccess(req.claimId);
  if (access === "not_found") return { status: 404 };
  if (access === "forbidden") return { status: 403 };

  let text: string;
  try {
    text = (await ports.ocr(req.file.bytes)).text;
  } catch (e) {
    if (e instanceof OcrParseError) {
      const result = buildResult("Other", 0.0, "rule-based", OCR_FAILURE_MESSAGE);
      emitSuggested(ports, result);
      return { status: 200, body: result };
    }
    return { status: 502 }; // OCR service failure: no fallback can produce a result
  }

  let result: CategoriseResult;
  try {
    const s = await llmCategorise(text, ports.completeWithLlm);
    result = buildResult(s.category, s.confidence, "llm");
  } catch {
    const s = ruleBasedCategorise(text);
    result = buildResult(s.category, s.confidence, "rule-based");
  }
  emitSuggested(ports, result);
  return { status: 200, body: result };
}
