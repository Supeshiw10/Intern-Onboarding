import assert from "node:assert/strict";
import { categoriseReceipt } from "../src/categoriseReceipt.ts";
import { recordClaimantDecision } from "../src/claimantDecision.ts";
import { CATEGORIES, OcrParseError, type CategoriseRequest, type Ports } from "../src/types.ts";

type Evt = { name: string; props: Record<string, unknown> };
const events: Evt[] = [];

const RECEIPT = "Restaurant rice and curry LKR 2,400 Visa 4111111111111111 John Perera";

const ports = (o: Partial<Ports> = {}): Ports => ({
  ocr: async () => ({ text: RECEIPT }),
  completeWithLlm: async () => ({ category: "Meals", confidence: 0.92 }),
  getClaimAccess: async () => "ok",
  logger: { trackEvent: (name, props) => void events.push({ name, props }) },
  ...o,
});
const req = (o: Partial<CategoriseRequest> = {}): CategoriseRequest => ({
  authenticated: true, claimId: "c1",
  file: { mimeType: "image/jpeg", sizeBytes: 1000, bytes: new Uint8Array(1) }, ...o,
});

const tests: Array<[string, () => Promise<void>]> = [
  ["AC-01 happy path", async () => {
    events.length = 0;
    const r = await categoriseReceipt(req(), ports());
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { category: "Meals", confidence: 0.92, needs_review: false, source: "llm", message: null });
    assert.ok(events.some(e => e.name === "categoriser.suggested"));
  }],
  ["AC-02/03 confidence 0.45 -> needs_review", async () => {
    const r = await categoriseReceipt(req(), ports({ completeWithLlm: async () => ({ category: "Other", confidence: 0.45 }) }));
    assert.equal(r.body!.needs_review, true);
  }],
  ["threshold: 0.6 is not flagged", async () => {
    const r = await categoriseReceipt(req(), ports({ completeWithLlm: async () => ({ category: "Meals", confidence: 0.6 }) }));
    assert.equal(r.body!.needs_review, false);
  }],
  ["AC-04 LLM 503 -> rule-based", async () => {
    const r = await categoriseReceipt(req(), ports({ completeWithLlm: async () => { throw new Error("503"); } }));
    assert.equal(r.status, 200);
    assert.equal(r.body!.source, "rule-based");
    assert.ok(r.body!.confidence <= 0.5);
    assert.ok((CATEGORIES as readonly string[]).includes(r.body!.category));
  }],
  ["AC-04 invalid LLM output -> rule-based", async () => {
    const r = await categoriseReceipt(req(), ports({ completeWithLlm: async () => ({ category: "Food", confidence: 2 }) }));
    assert.equal(r.body!.source, "rule-based");
  }],
  ["AC-05 OCR failure", async () => {
    const r = await categoriseReceipt(req(), ports({ ocr: async () => { throw new OcrParseError(); } }));
    assert.equal(r.status, 200);
    assert.equal(r.body!.category, "Other");
    assert.equal(r.body!.confidence, 0.0);
    assert.equal(r.body!.needs_review, true);
    assert.ok(r.body!.message);
  }],
  ["OCR service outage -> 502", async () => {
    const r = await categoriseReceipt(req(), ports({ ocr: async () => { throw new Error("down"); } }));
    assert.equal(r.status, 502);
  }],
  ["AC-06 unsupported format -> 400, >10MB -> 413", async () => {
    const pdf = { mimeType: "application/pdf", sizeBytes: 10, bytes: new Uint8Array(1) };
    const big = { mimeType: "image/png", sizeBytes: 10 * 1024 * 1024 + 1, bytes: new Uint8Array(1) };
    assert.equal((await categoriseReceipt(req({ file: pdf }), ports())).status, 400);
    assert.equal((await categoriseReceipt(req({ file: big }), ports())).status, 413);
  }],
  ["400 on missing claim id / file", async () => {
    assert.equal((await categoriseReceipt(req({ claimId: undefined }), ports())).status, 400);
    assert.equal((await categoriseReceipt(req({ file: undefined }), ports())).status, 400);
  }],
  ["401 / 403 / 404", async () => {
    assert.equal((await categoriseReceipt(req({ authenticated: false }), ports())).status, 401);
    assert.equal((await categoriseReceipt(req(), ports({ getClaimAccess: async () => "forbidden" }))).status, 403);
    assert.equal((await categoriseReceipt(req(), ports({ getClaimAccess: async () => "not_found" }))).status, 404);
  }],
  ["AC-07 no PII or card numbers in events (LLM and fallback paths)", async () => {
    events.length = 0;
    await categoriseReceipt(req(), ports());
    await categoriseReceipt(req(), ports({ completeWithLlm: async () => { throw new Error("503"); } }));
    await categoriseReceipt(req(), ports({ ocr: async () => { throw new OcrParseError(); } }));
    const s = JSON.stringify(events);
    assert.ok(events.length === 3);
    assert.ok(!/John|Perera|4111|Visa|Restaurant/.test(s));
  }],
  ["AC-08 selected category is used and decision logged", async () => {
    events.length = 0;
    const used = recordClaimantDecision(ports(), "Meals", "Travel");
    assert.equal(used, "Travel");
    assert.equal(events[0].props.overridden, true);
    assert.equal(recordClaimantDecision(ports(), "Meals", "Meals"), "Meals");
  }],
];

let failed = 0;
for (const [name, fn] of tests) {
  try { await fn(); console.log("PASS", name); }
  catch (e) { failed++; console.log("FAIL", name, (e as Error).message); }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
