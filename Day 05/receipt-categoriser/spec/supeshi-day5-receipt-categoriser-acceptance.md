# Receipt Categoriser — Acceptance Criteria

## AC-01: Happy Path — Clear Meal Receipt

**Given** a claimant uploads a valid restaurant receipt image containing food items totalling LKR 2,400.

**When** the claimant sends a categorisation request using `POST /claims/{id}/receipts/categorise`.

**Then** the response should be `200 OK` with:

- `category`: `Meals`
- `confidence`: greater than or equal to 0.7
- `needs_review`: `false`
- `source`: `llm`
- `message`: `null`

**And** an Application Insights customEvent named `categoriser.suggested` should be emitted.

## AC-02: Ambiguous Receipt — Mixed Items

**Given** a receipt containing both food and stationery items.

**When** the claimant uploads the receipt for categorisation.

**Then** the system should return a category suggestion with a confidence score between 0.0 and 1.0.

**And** if the confidence score is below 0.6, `needs_review` must be `true` and the claimant must see "Needs review".

## AC-03: Low Confidence Suggestion

**Given** a valid receipt receives a confidence score of 0.45.

**When** the categorisation result is displayed to the claimant.

**Then** `needs_review` must be `true`.

**And** the claimant must be able to review and change the suggested category before submitting the claim.

## AC-04: LLM Unavailable — Rule-Based Fallback

**Given** Azure OpenAI is temporarily unavailable and returns a 503 error.

**When** the claimant uploads a valid receipt for categorisation.

**Then** the system should return `200 OK` using the rule-based fallback.

**And** the response must contain:

- `source`: `rule-based`
- `confidence`: less than or equal to 0.5
- A valid category from the five predefined categories.

## AC-05: OCR Failure — Unreadable Receipt

**Given** a receipt image that Azure AI Document Intelligence cannot read or parse.

**When** the claimant uploads the receipt for categorisation.

**Then** the system must return:

- `category`: `Other`
- `confidence`: `0.0`
- `needs_review`: `true`
- A clear error message in `message`

**And** the claimant must be able to select a category manually.

## AC-06: Invalid or Oversized Receipt

**Given** the claimant uploads an unsupported file format or a receipt image larger than 10 MB.

**When** the categorisation request is submitted.

**Then** the system must reject the request.

**And** return:

- `400 Bad Request` for an unsupported file format.
- `413 Payload Too Large` for a file exceeding 10 MB.

## AC-07: PII Protection

**Given** a receipt containing a customer name and payment card details.

**When** the categorisation request is processed and the suggestion is logged.

**Then** the Application Insights customEvent `categoriser.suggested` must not contain personally identifiable information (PII) or full payment card numbers.

## AC-08: Claimant Confirmation and Suggestion Logging

**Given** the system has suggested an expense category for a receipt.

**When** the claimant accepts the suggestion or changes it to another category.

**Then** the selected category must be used when submitting the claim.

**And** the accepted or overridden suggestion must be logged for future model evaluation.