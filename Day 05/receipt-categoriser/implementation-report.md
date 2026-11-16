# AI-Driven Implementation Report

## 1. Required Reviews

| **#** | **What you asked the AI** | **What it produced** | **Did it match the spec?** | **Your fix / follow-up** |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Review the feature specification and acceptance criteria. Identify ambiguities before writing code. | Identified 11 ambiguities and generated initial TypeScript code. Example: `needs_review = confidence < 0.6`. | Partial — identified ambiguities but generated code even though the prompt explicitly asked it not to write code yet. | Saved the response and reviewed the identified ambiguities before continuing. |
| 2 | Implement the Receipt Categoriser in TypeScript based on the specification and acceptance criteria. | Created `types.ts`, `categoriseReceipt.ts`, `llmCategoriser.ts`, `ruleBasedCategoriser.ts`, `claimantDecision.ts` and acceptance tests. Implemented LLM fallback, OCR handling and decision logging. | Partial — the main categorisation requirements were implemented, but feature flag behaviour, 4-second latency monitoring and cost monitoring were not implemented. Some behaviours were based on assumptions. | Ran the tests locally (12/12 passed) and completed TypeScript type-checking. Recorded the remaining assumptions and limitations for future improvements. |

## 2. Testing Results

The implementation was tested locally using Node.js.

| **Test** | **Result** |
| :--- | :--- |
| AC-01 Happy path | PASS |
| AC-02/03 Confidence and needs review | PASS |
| AC-04 LLM failure and fallback | PASS |
| AC-05 OCR failure | PASS |
| AC-06 Invalid input and file size | PASS |
| AC-07 PII protection | PASS |
| AC-08 Claimant decision logging | PASS |

**Total: 12/12 tests passed.**

TypeScript type-checking was also completed successfully using:

```bash
npx.cmd tsc --noEmit
```

No TypeScript errors were reported.

## 3. Limitations and Remaining Work

- Real Azure OpenAI and Azure AI Document Intelligence clients are not connected.
- Feature flag behaviour needs further clarification.
- The 4-second p95 latency target and cost monitoring are not implemented.
- Rule-based keyword mappings are initial assumptions.
- The claimant decision event name and properties need confirmation.