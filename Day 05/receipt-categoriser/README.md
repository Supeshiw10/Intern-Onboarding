# Receipt Categoriser

A TypeScript-based receipt categorisation feature for the GreenChit reimbursement system.

## Features
- Categorises receipts into five predefined categories.
- Uses LLM categorisation with rule-based fallback.
- Provides confidence scores and needs-review status.
- Logs categorisation suggestions and claimant decisions.

## Run Tests
```bash
node --experimental-strip-types tests/categoriser.test.ts
```

## Type Check
```bash
npx tsc --noEmit
```