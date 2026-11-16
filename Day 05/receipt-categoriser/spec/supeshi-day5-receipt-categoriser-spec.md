# Receipt Categoriser — Feature Spec v0.1

## 1. Why

### User / Business Outcome

The GreenChit Receipt Categoriser helps staff members categorise expenses when submitting reimbursement claims.

Currently, claimants need to identify and select an expense category manually. This feature will read the line items from an uploaded receipt image and suggest the most appropriate expense category.

The claimant can review the suggested category and either accept it or change it before submitting the claim.

The feature aims to:
- Reduce the manual effort required to categorise expenses.
- Improve consistency and accuracy of expense categorisation.
- Make the reimbursement claim submission process easier and faster.

### Success Metrics

- At least 95% of valid receipt uploads should receive a displayed suggestion within 4 seconds (p95).
- The cost per categorisation suggestion must not exceed LKR 5 at the expected volume of approximately 2,000 suggestions per month.
- Every accepted or overridden suggestion must be logged for future model evaluation.
- The categoriser must continue providing suggestions during transient Azure OpenAI provider outages through rule-based fallback.

## 2. Scope

### In Scope

- Accept a single receipt image in JPEG or PNG format, with a maximum file size of 10 MB, and read its line items using Azure AI Document Intelligence.
- Suggest one expense category from Meals, Travel, Lodging, Office Supplies, or Other, together with a confidence score between 0.0 and 1.0.
- Allow the claimant to accept or change the suggested category before submitting the claim.
- Display "Needs review" when the confidence score is below 0.6.
- Use a rule-based categoriser when Azure OpenAI experiences a transient outage.
- Log every accepted or overridden suggestion using Application Insights customEvents.
- Allow the feature to be enabled or disabled without deployment through Azure App Configuration.

### Affected Containers / Services

| Container / Service | Responsibility |
|---|---|
| GreenChit Web App (React) | Upload receipt and display category suggestions, confidence and review status. |
| GreenChit Claims API (ASP.NET Core Web API) | Handle categorisation requests and coordinate the categorisation process. |
| Azure AI Document Intelligence | Extract receipt text and line items using OCR. |
| Azure OpenAI Service (gpt-4.1 family) | Analyse extracted receipt information and suggest an expense category. |
| Rule-based Categoriser | Provide a fallback suggestion when Azure OpenAI has a transient outage. |
| Azure SQL Database | Maintain claim and expense category information. |
| Azure Blob Storage | Store uploaded receipt images. |
| Application Insights | Record categorisation suggestion events. |
| Azure App Configuration | Manage the Receipt Categoriser feature flag. |

## 3. Contract

### Inputs

The categorisation endpoint accepts the following inputs:

**Endpoint:**

`POST /claims/{id}/receipts/categorise`

**Path Parameter:**

| Parameter | Type | Description |
|---|---|---|
| id | String | Unique identifier of the reimbursement claim. |

**Request:**

- Receipt image: JPEG or PNG.
- Maximum file size: 10 MB.
- Claim ID: Required.
- User must be authenticated and authorised to access the claim.

### Outputs

A successful categorisation response contains:

| Field | Type | Description |
|---|---|---|
| category | Enum | Suggested expense category. |
| confidence | Float | Confidence score between 0.0 and 1.0. |
| needs_review | Boolean | Indicates whether the suggestion requires manual review. |
| source | String | Indicates whether the suggestion came from the LLM or rule-based fallback. |
| message | String / null | Human-readable explanation if OCR or parsing fails; otherwise null. |

**Allowed category values:**
- Meals
- Travel
- Lodging
- Office Supplies
- Other

**Allowed source values:**
- `llm`
- `rule-based`

**Example response:**

```json
{
  "category": "Meals",
  "confidence": 0.92,
  "needs_review": false,
  "source": "llm",
  "message": null
}
```

- If the confidence score is below 0.6, the suggestion must be displayed with the status "Needs review".
- The claimant must be able to accept or change the suggested category before submitting the claim.

### Errors

| HTTP Status | Error | Description |
|---|---|---|
| 400 | Bad Request | Missing claim ID, missing receipt image or unsupported file format. |
| 401 | Unauthorized | User is not authenticated. |
| 403 | Forbidden | User is not authorised to access the claim. |
| 404 | Not Found | The specified claim does not exist. |
| 413 | Payload Too Large | Receipt image exceeds 10 MB. |
| 502 | Bad Gateway | An upstream service failure prevents categorisation and no supported fallback can produce a result. |

- A transient Azure OpenAI outage alone must not result in a 502 response because the rule-based categoriser must be used as a fallback.
- If OCR fails or the receipt cannot be parsed, the claimant must receive a clear error message and the suggested category must be "Other".

### Side Effects

- An Application Insights customEvent named `categoriser.suggested` must be emitted for each suggestion.
- Every accepted or overridden suggestion must be logged for future model evaluation.
- Event data must not contain personally identifiable information (PII) or full payment card numbers.
- Logging must not expose sensitive receipt contents outside the BISTEC Azure tenant.

## 4. Acceptance Criteria

The feature must satisfy all acceptance criteria documented in the separate file:

`supeshi-day5-receipt-categoriser-acceptance.md`

## 5. Examples

### Example 1: Happy Path — Restaurant Receipt

**Input:**

A valid restaurant receipt image containing food and beverage items, totalling LKR 2,400.

**Expected Output:**

```json
{
  "category": "Meals",
  "confidence": 0.92,
  "source": "llm"
}
```

**Expected Behaviour:**

- The system suggests Meals.
- The confidence score is above 0.6.
- The claimant can accept or change the suggestion.
- The suggestion is logged for future model evaluation.

### Example 2: Ambiguous Receipt — Mixed Items

**Input:**

A receipt containing both food items and stationery items.

**Expected Output:**

```json
{
  "category": "Other",
  "confidence": 0.45,
  "source": "llm"
}
```

**Expected Behaviour:**

- The system provides a category suggestion.
- The confidence score is below 0.6.
- The claimant sees "Needs review".
- The claimant can change the suggested category before submitting the claim.

### Example 3: OCR Failure — Unreadable Receipt

**Input:**

A damaged or unclear receipt image that Azure AI Document Intelligence cannot parse.

**Expected Output:**

```json
{
  "category": "Other",
  "confidence": 0.0,
  "source": "rule-based"
}
```

**Expected Behaviour:**

- The claimant receives a clear message explaining that the receipt could not be read.
- The suggested category is Other.
- The claimant can review and change the category before submitting the claim.

## 6. Out of Scope

- The feature supports categorisation of one receipt image per request only.
- The system will not submit reimbursement claims automatically after categorisation. Claimant confirmation is required.
- The categoriser will not approve or reject reimbursement claims.
- Suggestions and overrides will be logged, but automatic model retraining is out of scope for v1.
- Custom expense categories beyond the five predefined categories.

## 7. Open Questions

1. What rules should be used for category suggestions when the LLM is unavailable?
2. How should the system handle OCR failures?
3. What information should be included in the categorisation event logs?
4. How can we monitor the cost per suggestion to keep it below LKR 5?
5. What should happen when the Receipt Categoriser feature is disabled?