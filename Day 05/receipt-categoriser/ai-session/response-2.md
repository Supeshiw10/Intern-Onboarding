The Receipt Categoriser is implemented in TypeScript and all 12 tests pass, covering every acceptance criterion. The src/ files also pass a strict type-check. The test file couldn’t be type-checked because @types/node isn’t installable offline here. I used no new dependencies. The tests run with node --experimental-strip-types test/categoriser.test.ts, and the real Azure clients and logger are injected through a Ports interface.

Files created (/mnt/user-data/outputs/receipt-categoriser/)
File	Purpose
src/types.ts	Categories, response shape and Ports interface (OCR, LLM, claim access, logger). Also the two error classes.
src/categoriseReceipt.ts	Main logic: validation, OCR, LLM-or-fallback choice, needs_review, event emission.
src/llmCategoriser.ts	Calls the LLM and validates its output. Any failure or invalid output raises LlmUnavailableError.
src/ruleBasedCategoriser.ts	Keyword fallback, with confidence capped at 0.5.
src/claimantDecision.ts	Logs accept/override and returns the category to submit (AC-08).
test/categoriser.test.ts	Dependency-free test runner.
tsconfig.json	Strict config.

I modified nothing else; the two uploads are byte-identical to the earlier pair.

How each acceptance criterion is satisfied
AC-01: The LLM result is returned as Meals, 0.92, needs_review: false, source: "llm", message: null, and a categoriser.suggested event is emitted.
AC-02 and AC-03: needs_review = confidence < 0.6. A 0.45 result gives true, and exactly 0.6 gives false. The “Needs review” label and the category picker are UI work, and the API only supplies the flag.
AC-04: Any LLM failure (503, timeout or invalid output) falls back to the rule-based categoriser. The result is 200 with source: "rule-based", confidence ≤ 0.5 and a valid category. It never produces a 502.
AC-05: OcrParseError returns Other, 0.0, needs_review: true, a clear message and source: "rule-based". The claimant can then pick a category manually.
AC-06: An unsupported MIME type returns 400. A file over 10 MiB returns 413. The other spec errors are covered too: missing claim ID or file returns 400, unauthenticated 401, forbidden 403, claim not found 404.
AC-07: The event is built only from category, confidence, needs_review and source. Receipt text never reaches the logger, and the test feeds a name and card number through all three paths (LLM, fallback and OCR failure).
AC-08: recordClaimantDecision returns the selected category and logs whether it was overridden. The event name and fields are my assumption (see below).
Ambiguities and assumptions

These stay open until you confirm them.

Feature flag (Open Q5): I left the flag check out because the spec defines no behaviour or status code when it’s off. Checking it in the web app or before calling categoriseReceipt avoids inventing one.
AC-08 event: The spec requires logging accepted and overridden suggestions but gives no event name or payload. categoriser.decision with suggested, selected and overridden is a placeholder.
OCR failure: AC-05 doesn’t state source, but Example 3 says rule-based, so I used that. I also assumed 200 for an unreadable receipt, since the spec doesn’t give a status.
OCR service outage: I return 502, since no fallback exists without OCR text. The spec doesn’t separate this from a parse failure, so the split is my assumption.
Rule-based keywords (Open Q1): The keyword lists are placeholders. A single-category match gives 0.5, and no match or mixed matches give Other at 0.2.
LLM failure scope: The spec only mentions a 503. I fall back on any LLM error or malformed output, which is a judgement call.
Validation order: I check 401, then 400 (missing parts), then 413, then 400 (format), then 404 and 403. The spec doesn’t say which wins when several apply.
Limits: I read 10 MB as 10 MiB (10×1024×1024 bytes). Format is checked by MIME type, not by inspecting the file’s bytes.
Logger: Your existing logger isn’t visible to me, so the Ports.logger.trackEvent signature is a stand-in to map onto it.
Not implemented: the 4-second p95 target and cost-per-suggestion monitoring (Open Q4). Neither has a defined mechanism in the spec.

I’d like confirmation on items 1, 2 and 5 first, as they have the most effect on behaviour.