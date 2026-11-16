I haven’t seen your existing source tree, logger or test runner, so the code below takes them as injected interfaces. Swap in your real ones. As the prompt asks, the ambiguities come first.

Ambiguities I’d want clarified
Stack mismatch: the spec names an ASP.NET Core API, but this task is TypeScript. I’ve treated the categoriser as a framework-agnostic handler.
Rule-based rules (Open Q1): there is no keyword or category mapping. The only constraints are confidence ≤ 0.5 and a valid category.
OCR failure (Open Q2):
AC-05 doesn’t give source, but Example 3 says rule-based.
It doesn’t say whether the status is 200 or an error.
The message wording is unspecified.
A parse failure isn’t distinguished from Document Intelligence being down (which could be a 502).
Feature flag off (Open Q5): no status code or behaviour is defined, and the error table has nothing for it.
Accept/override logging (AC-08): there is no confirm endpoint, no event name and no payload for it. Only categoriser.suggested is named.
Log contents (Open Q3): the allowed properties aren’t listed. “No PII” is defined only by exclusion.
Validation order: it’s unclear which check wins when several fail (401 vs 400 vs 413 vs 404 vs 403). “10 MB” could mean 10×1024×1024 or 10,000,000 bytes, and format detection could use MIME type or magic bytes.
LLM failure scope: only a 503 is mentioned. It’s unclear whether timeouts, 429s or malformed or out-of-range model output should also fall back.
Fallback message: the spec says message is for OCR failures only, so I assume null on fallback.
4s p95 and cost (Open Q4): there is no per-stage timeout budget and no defined cost-tracking field, so I haven’t implemented either.
Threshold edge: needs_review is true below 0.6. I’ve taken exactly 0.6 as false.
Implementation (with assumptions marked)
ts
// receiptCategoriser.ts
export const CATEGORIES = ["Meals", "Travel", "Lodging", "Office Supplies", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Source = "llm" | "rule-based";

export interface CategoriseResult {
  category: Category; confidence: number; needs_review: boolean;
  source: Source; message: string | null;
}
export interface HandlerResponse { status: number; body?: CategoriseResult }
export interface Request {
  authenticated: boolean;
  claimId?: string;
  file?: { mimeType: string; sizeBytes: number; bytes: Uint8Array };
}
export class OcrParseError extends Error {}

export interface Deps {
  isEnabled(): Promise<boolean>;
  getClaim(id: string): Promise<{ authorised: boolean } | null>;
  ocr(bytes: Uint8Array): Promise<{ text: string }>;        // throws OcrParseError if unreadable
  llm(text: string): Promise<{ category: string; confidence: number }>;
  logger: { event(name: string, props: Record<string, string | number | boolean>): void };
}

const MAX_BYTES = 10 * 1024 * 1024;           // ASSUMPTION: MiB
const ALLOWED_MIME = ["image/jpeg", "image/png"];
const REVIEW_THRESHOLD = 0.6;

// ASSUMPTION: keyword rules are placeholders pending Open Q1.
const RULES: [Category, RegExp][] = [
  ["Meals", /restaurant|cafe|coffee|lunch|dinner|burger|rice|meal|food/i],
  ["Travel", /taxi|uber|pickme|fuel|petrol|flight|bus|train|toll/i],
  ["Lodging", /hotel|room|lodg|resort|stay/i],
  ["Office Supplies", /pen|paper|stationery|stapler|notebook|toner/i],
];
export function ruleBased(text: string): { category: Category; confidence: number } {
  for (const [category, re] of RULES) if (re.test(text)) return { category, confidence: 0.4 };
  return { category: "Other", confidence: 0.2 };
}

const build = (category: Category, confidence: number, source: Source, message: string | null = null): CategoriseResult =>
  ({ category, confidence, needs_review: confidence < REVIEW_THRESHOLD, source, message });

export async function categorise(req: Request, d: Deps): Promise<HandlerResponse> {
  if (!req.authenticated) return { status: 401 };
  if (!(await d.isEnabled())) return { status: 404 };          // ASSUMPTION: unspecified (Open Q5)
  if (!req.claimId || !req.file) return { status: 400 };
  if (req.file.sizeBytes > MAX_BYTES) return { status: 413 };
  if (!ALLOWED_MIME.includes(req.file.mimeType)) return { status: 400 };
  const claim = await d.getClaim(req.claimId);
  if (!claim) return { status: 404 };
  if (!claim.authorised) return { status: 403 };

  let text: string;
  try {
    text = (await d.ocr(req.file.bytes)).text;
  } catch (e) {
    if (e instanceof OcrParseError) {
      const r = build("Other", 0.0, "rule-based", "We could not read this receipt. Please select a category manually.");
      log(d, req.claimId, r, true);
      return { status: 200, body: r };
    }
    return { status: 502 };                                    // ASSUMPTION: OCR service outage
  }

  let result: CategoriseResult;
  try {
    const s = await d.llm(text);
    const valid = (CATEGORIES as readonly string[]).includes(s.category) &&
                  Number.isFinite(s.confidence) && s.confidence >= 0 && s.confidence <= 1;
    if (!valid) throw new Error("invalid llm output");
    result = build(s.category as Category, s.confidence, "llm");
  } catch {                                                    // ASSUMPTION: any LLM failure falls back
    const f = ruleBased(text);
    result = build(f.category, f.confidence, "rule-based");
  }
  log(d, req.claimId, result, false);
  return { status: 200, body: result };
}

// PII-safe: only claim id + derived fields; never receipt text, names or card data.
function log(d: Deps, claimId: string, r: CategoriseResult, ocrFailed: boolean) {
  d.logger.event("categoriser.suggested", {
    claimId, category: r.category, confidence: r.confidence,
    needs_review: r.needs_review, source: r.source, ocrFailed,
  });
}

// AC-08. ASSUMPTION: event name and shape are not in the spec.
export function recordClaimantDecision(
  d: Deps, claimId: string, suggested: Category, selected: Category,
): Category {
  d.logger.event("categoriser.decision", { claimId, suggested, selected, overridden: suggested !== selected });
  return selected; // this is the category used on claim submission
}
Test runner (AC-01 to AC-08)
ts
// receiptCategoriser.test.ts
import assert from "node:assert/strict";
import { categorise, recordClaimantDecision, OcrParseError, CATEGORIES, Deps, Request } from "./receiptCategoriser";

const events: { name: string; props: any }[] = [];
const base = (o: Partial<Deps> = {}): Deps => ({
  isEnabled: async () => true,
  getClaim: async () => ({ authorised: true }),
  ocr: async () => ({ text: "Restaurant rice and curry LKR 2,400 | Card 4111111111111111 | John Perera" }),
  llm: async () => ({ category: "Meals", confidence: 0.92 }),
  logger: { event: (name, props) => void events.push({ name, props }) },
  ...o,
});
const req = (o: Partial<Request> = {}): Request => ({
  authenticated: true, claimId: "c1",
  file: { mimeType: "image/jpeg", sizeBytes: 1000, bytes: new Uint8Array(1) }, ...o,
});

const tests: [string, () => Promise<void>][] = [
  ["AC-01 happy path", async () => {
    events.length = 0;
    const r = await categorise(req(), base());
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { category: "Meals", confidence: 0.92, needs_review: false, source: "llm", message: null });
    assert.ok(events.some(e => e.name === "categoriser.suggested"));
  }],
  ["AC-02 ambiguous -> needs_review when <0.6", async () => {
    const r = await categorise(req(), base({ llm: async () => ({ category: "Other", confidence: 0.45 }) }));
    assert.equal(r.body!.needs_review, true);
  }],
  ["AC-03 low confidence 0.45", async () => {
    const r = await categorise(req(), base({ llm: async () => ({ category: "Meals", confidence: 0.45 }) }));
    assert.equal(r.body!.needs_review, true);
  }],
  ["AC-04 LLM 503 -> rule-based", async () => {
    const r = await categorise(req(), base({ llm: async () => { throw new Error("503"); } }));
    assert.equal(r.status, 200);
    assert.equal(r.body!.source, "rule-based");
    assert.ok(r.body!.confidence <= 0.5);
    assert.ok((CATEGORIES as readonly string[]).includes(r.body!.category));
  }],
  ["AC-05 OCR failure", async () => {
    const r = await categorise(req(), base({ ocr: async () => { throw new OcrParseError(); } }));
    assert.equal(r.body!.category, "Other");
    assert.equal(r.body!.confidence, 0.0);
    assert.equal(r.body!.needs_review, true);
    assert.ok(r.body!.message);
  }],
  ["AC-06 bad format -> 400, oversize -> 413", async () => {
    assert.equal((await categorise(req({ file: { mimeType: "application/pdf", sizeBytes: 10, bytes: new Uint8Array(1) } }), base())).status, 400);
    assert.equal((await categorise(req({ file: { mimeType: "image/png", sizeBytes: 10 * 1024 * 1024 + 1, bytes: new Uint8Array(1) } }), base())).status, 413);
  }],
  ["AC-07 no PII in event", async () => {
    events.length = 0;
    await categorise(req(), base());
    const s = JSON.stringify(events);
    assert.ok(!/John|Perera|4111/.test(s));
  }],
  ["AC-08 decision used and logged", async () => {
    events.length = 0;
    const used = recordClaimantDecision(base(), "c1", "Meals", "Travel");
    assert.equal(used, "Travel");
    assert.equal(events[0].props.overridden, true);
  }],
  ["errors: 401/403/404", async () => {
    assert.equal((await categorise(req({ authenticated: false }), base())).status, 401);
    assert.equal((await categorise(req(), base({ getClaim: async () => ({ authorised: false }) }))).status, 403);
    assert.equal((await categorise(req(), base({ getClaim: async () => null }))).status, 404);
  }],
];

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log("PASS", name); }
    catch (e) { failed++; console.log("FAIL", name, e); }
  }
  process.exit(failed ? 1 : 0);
})();
What I didn’t build
Document Intelligence, Azure OpenAI and App Configuration clients (they’re injected).
The 4s timeout and cost tracking.
The React UI behaviour (“Needs review” display and category picker). The backend only supplies needs_review.

The assumptions I’d most like you to confirm are flag-off behaviour, the decision-event shape, OCR-failure source, and the rule-based keywords. If you share your actual logger and test setup, I’ll adapt this to fit.