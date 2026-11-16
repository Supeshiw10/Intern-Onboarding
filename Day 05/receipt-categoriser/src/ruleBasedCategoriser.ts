import type { Category, Suggestion } from "./types.ts";

/** Fallback confidence is capped at 0.5 (AC-04). */
export const RULE_MATCH_CONFIDENCE = 0.5;
export const RULE_NO_MATCH_CONFIDENCE = 0.2;

// ASSUMPTION (spec Open Question 1): keyword lists are placeholders, not a spec-defined ruleset.
const RULES: ReadonlyArray<readonly [Category, RegExp]> = [
  ["Lodging", /\b(hotel|resort|lodging|guest ?house|accommodation|room charge)\b/i],
  ["Travel", /\b(taxi|uber|pickme|fuel|petrol|diesel|flight|airline|bus|train|toll|parking)\b/i],
  ["Meals", /\b(restaurant|cafe|coffee|lunch|dinner|breakfast|burger|rice|curry|meal|food|beverage)\b/i],
  ["Office Supplies", /\b(stationery|pen|pens|paper|notebook|stapler|toner|ink|folder)\b/i],
];

/** Synchronous, dependency-free, never throws. */
export function ruleBasedCategorise(receiptText: string): Suggestion {
  const matches = RULES.filter(([, re]) => re.test(receiptText));
  if (matches.length === 0) return { category: "Other", confidence: RULE_NO_MATCH_CONFIDENCE };
  // Mixed signals: do not guess confidently.
  if (matches.length > 1) return { category: "Other", confidence: RULE_NO_MATCH_CONFIDENCE };
  return { category: matches[0][0], confidence: RULE_MATCH_CONFIDENCE };
}
