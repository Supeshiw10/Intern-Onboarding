# BookSwap — SLI/SLO Map

## 1. NFR Inventory

| # | NFR (from Day 2) | User-visible behaviour |
|---|---|---|
| 1 | Catalogue search should respond in under 300 ms (p95) for up to 5,000 books. | Members can search for books and receive results quickly. |
| 2 | Listing creation must succeed even if the email service is unavailable. | Members can add new books without being affected by email service failures. |
| 3 | Book photos must support JPEG and PNG formats, with a maximum size of 5 MB. Photos must not be stored in the database. | Members can upload supported book photos without storing image files directly in the database. |
| 4 | In-app notifications must be delivered within 2 seconds. | Members receive borrow request notifications quickly. |
| 5 | Weekly email digests are best-effort. | Members receive a weekly email showing the 10 most recently added books when the email service is available. |
| 6 | Personal addresses and phone numbers must never be returned by API responses. | Members cannot see private contact information through API responses. |
| 7 | Loan records must track borrowed, returned, and overdue books after 30 days. | Members can see the correct loan status and borrowing history. |

## 2. SLI / SLO Table

| # | SLI Definition | Measurement Source | SLO Target | Window | Error Budget |
|---|---|---|---|---|---|
| 1 | Percentage of successful catalogue search requests completed in under 800 ms. | Azure Application Insights | 99% of search requests under 800 ms, even at 10× normal traffic. | Rolling 28 days | 1% of search requests can exceed the target. |
| 2 | Percentage of valid book listing requests successfully created without depending on email delivery. | Azure Application Insights | 99.9% successful listing creation requests. | Rolling 28 days | 0.1% of listing requests can fail. |
| 3 | Percentage of valid photo uploads (JPEG/PNG, maximum 5 MB) successfully stored in Azure Blob Storage. | Azure Blob Storage metrics | 99% successful valid photo uploads. | Rolling 28 days | 1% of valid uploads can fail. |
| 4 | Percentage of in-app notifications delivered within 2 seconds after a borrow request is created. | Application Insights | 99% delivered within 2 seconds. | Rolling 28 days | 1% of notifications can exceed 2 seconds. |
| 5 | Percentage of scheduled weekly digest jobs successfully processed and submitted to the email service. | Azure Service Bus | 95% of digest jobs successfully submitted within 24 hours of their scheduled time. | Rolling 28 days | 5% of digest jobs can miss the target. |
| 6 | Percentage of protected API requests without a valid JWT correctly rejected with 401 Unauthorized. | Logs | 100% of protected API requests without a valid JWT are rejected with 401. Tokens expire within 1 hour. | Measured 24/7 | Zero |
| 7 | Time taken to detect a complete outage of the listings endpoint and notify the on-call team. | Azure Application Insights | 100% of complete listings endpoint outages trigger an on-call alert within 3 minutes. | Measured 24/7 | Zero |
| 8 | Percentage of loan records correctly marked as overdue after 30 days and returned when a return is recorded. | Logs | 99.9% of loan status updates processed correctly. | Rolling 30 days | 0.1% of loan status updates can fail. |

## 3. Error Budget Policy

The error budget is the amount of failure allowed while still meeting an SLO.

For example, a 99% SLO allows 1% of requests to miss the target during the measurement window.

**What the team stops doing when the budget is exhausted:**

- Stop releasing new features and non-critical changes.
- Stop deployments that are not required to fix the reliability problem.
- Focus on finding the root cause of the failures.
- Fix the problem and run tests before allowing normal deployments again.
- Continue monitoring the affected SLI until the service becomes stable.

**Who owns the decision:**

| Responsible Person / Team | Responsibility |
|---|---|
| Engineering Lead and Site Reliability / Operations team | Review the error budget and decide when to stop deployments. |
| On-call engineer | Investigate incidents and report the findings to the team. |
| Security Team | Investigate security incidents and ensure that vulnerabilities are fixed immediately. |

Security requirements such as preventing private data exposure and enforcing JWT authentication have zero tolerance and must be fixed immediately.

## 4. Out of Budget Right Now

I bet say that we cannot currently meet the 99% search SLO under 10× normal traffic because our original BookSwap design was prepared for a much smaller workload, and we have not yet tested its performance at this increased traffic level.