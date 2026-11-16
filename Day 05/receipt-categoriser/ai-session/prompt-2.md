# Prompt 2 — Implement Receipt Categoriser

Based on the feature specification and acceptance criteria provided earlier, implement the Receipt Categoriser in TypeScript.

Requirements:

1. Implement the main categorisation logic.
2. Implement the LLM categoriser separately.
3. Implement the rule-based fallback separately.
4. Follow the five predefined categories:
   - Meals
   - Travel
   - Lodging
   - Office Supplies
   - Other
5. Return confidence between 0.0 and 1.0.
6. Set `needs_review` to true when confidence is below 0.6.
7. Use rule-based fallback when the LLM is unavailable.
8. Ensure fallback confidence is 0.5 or below.
9. Handle invalid input and OCR failures according to the specification.
10. Ensure logs do not contain personal information or full card numbers.
11. Implement tests covering at least three acceptance criteria.

Constraints:
- Follow the specification and acceptance criteria.
- Do not invent additional fields, endpoints, or behaviour.
- Do not add unnecessary dependencies.
- Keep the implementation simple and easy to test.
- If an ambiguity prevents correct implementation, explain it instead of silently inventing behaviour.

After implementation:
- List all files created or modified.
- Explain how the implementation satisfies each acceptance criterion.
- List any remaining limitations or assumptions.