# Receipt Categoriser

A TypeScript-based receipt categorisation feature for GreenChit.

## Features
- Five predefined receipt categories.
- LLM categorisation with rule-based fallback.
- Confidence scores and needs-review status.
- Logs suggestions and claimant decisions.

## Run Tests
`node --experimental-strip-types tests/categoriser.test.ts`

## Type Check
`npx tsc --noEmit`