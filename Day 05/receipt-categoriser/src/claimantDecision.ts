import type { Category, Ports } from "./types.ts";

/**
 * AC-08. ASSUMPTION: the spec requires accepted/overridden suggestions to be logged
 * but defines no event name or payload. "categoriser.decision" and these fields are
 * placeholders to be confirmed (Open Question 3).
 * Returns the category to use when submitting the claim.
 */
export function recordClaimantDecision(
  ports: Pick<Ports, "logger">, suggested: Category, selected: Category,
): Category {
  ports.logger.trackEvent("categoriser.decision", {
    suggested, selected, overridden: suggested !== selected,
  });
  return selected;
}
