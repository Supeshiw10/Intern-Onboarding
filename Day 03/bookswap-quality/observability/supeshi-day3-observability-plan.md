# BookSwap — Observability Plan

## 1. Setup

This document explains how we monitor the BookSwap system using the three pillars of observability:

- **Logs:** Help us understand what happened.
- **Metrics:** Help us measure system performance and health.
- **Traces:** Help us identify where time is spent across services.

### Logs — Azure Monitor Logs

- **Schema:** Include timestamp, severity, request ID, member ID and event name.
- **Retention:** Retain application logs for 30 days.
- **Redaction rules:** Exclude passwords, JWT tokens, Authorization headers and full request bodies. Mask email addresses and phone numbers. Do not log private addresses.

### Metrics — Azure Application Insights

- **Request metrics:** Monitor API request count, success rate, failure rate and response time.
- **Dependency metrics:** Monitor Azure SQL, Redis, Blob Storage and Service Bus failures and response times.
- **Custom metrics:** Track book listing creation success rate, loan status update success rate, authentication failures and search requests completed within 800ms.

### Traces — Application Insights Distributed Tracing

- **Sampling rate:** Use 100% sampling for failed requests and security events where supported. Use a suitable sampling rate for successful requests to control telemetry costs.

## 2. Required Tests and Validations

| # | Signal type | Source | What it answers | Sample query / metric name |
|---|---|---|---|---|
| 1 | Metric | Application Insights | What is the search latency p95? | `requests \| summarize percentile(duration, 95) by bin(timestamp, 1m)` |
| 2 | Metric | Application Insights | What is the listing creation success rate? | `requests \| where name contains "POST /books" \| summarize successRate = 100.0 * countif(success == true) / count()` |
| 3 | Log | Application Insights traces | Are authentication failures recorded with member ID? | `traces \| where customDimensions.event == "auth.failed" \| project timestamp, customDimensions.requestId, customDimensions.memberId` |
| 4 | Trace | Application Insights | Where is time spent across SQL and Redis? | `dependencies \| summarize avg(duration), percentile(duration, 95) by type, target` |
| 5 | Metric | Azure Service Bus | How many email digest messages are waiting? | `ActiveMessages` |
| 6 | Log | Application Insights traces | Are loan creation and return events audited? | `traces \| where customDimensions.event in ("loan.created", "loan.returned")` |
| 7 | Metric | Application Insights | What percentage of search requests complete within 800ms? | `requests \| where name contains "GET /books" \| summarize good = countif(success == true and duration < 800), total = count() \| extend sli = 100.0 * good / total` |

## 3. Results Summary

| Metric | Target | Achieved |
|---|---|---|
| SLOs covered by an alert | 100% | Pending validation |
| Alerts with a clear runbook link | 100% | Pending validation |
| Dashboards for operations | 1 health dashboard, 1 business dashboard | Proposed |

### Dashboards for Operations

#### Dashboard 1 — System Health

This dashboard helps the operations team understand whether the system is healthy.

**Display:**

- API request count.
- API error rate.
- Search p95 latency.
- App Service CPU and memory usage.
- Azure SQL dependency failures.
- Redis errors and availability.
- Service Bus active messages and dead-letter messages.
- Blob Storage availability.

#### Dashboard 2 — Business Operations

This dashboard helps the team monitor important BookSwap activities.

**Display:**

- Number of books listed.
- Successful and failed listing creations.
- Borrow requests created.
- Loans created and returned.
- Overdue loans.
- In-app notification delivery time.
- Weekly email digest job status.

## 4. Alert Proposal

| Alert | Condition | Severity | Notification | Runbook |
|---|---|---|---|---|
| Search SLO burn | Search requests under 800ms fall below 99% over the rolling 28-day SLO window; use a 5-minute fast-burn alert for immediate detection | Sev2 | Pager + Teams | `reliability/runbook.md` |
| Listing creation failures | Listing creation success rate falls below 99.9% | Sev2 | Pager + Teams | `reliability/runbook.md` |
| Photo upload failures | Valid photo upload success rate falls below 99% | Sev3 | Teams | `reliability/runbook.md` |
| Notification delay | In-app notifications are not delivered within 2 seconds at the required 99% target | Sev2 | Pager + Teams | `reliability/runbook.md` |
| Email digest delay | More than 5% of digest jobs are not submitted within 24 hours | Sev3 | Teams | `reliability/runbook.md` |
| Loan update failures | Loan creation or return success rate falls below 99.9% | Sev2 | Pager + Teams | `reliability/runbook.md` |
| Authentication failure | Invalid or missing JWT requests are accepted by a protected endpoint | Sev1 | Pager + Teams | `reliability/runbook.md` |
| Listings endpoint outage | Complete listings endpoint outage is detected and on-call is paged within 3 minutes | Sev1 | Pager + Teams | `reliability/runbook.md` |

### Severity

| Severity | Meaning | Impact |
|---|---|---|
| Sev1 | Critical | Main service unavailable or critical security issue |
| Sev2 | High | Important feature affected |
| Sev3 | Medium | Minor feature issue |

**Alert notes:**

- Configure Azure Monitor alerts using the relevant Application Insights or Service Bus metrics.
- Use action groups to notify the on-call engineer through the agreed paging channel and Teams.
- Alert thresholds must be validated against actual traffic and the SLO measurement windows.
- Security alerts should not include JWT tokens or private member information.

## 5. What We Are Deliberately NOT Alerting On

1. **Individual 404 responses:** A missing book may be a normal user action and does not always indicate a system failure.
2. **Every single authentication failure:** Invalid login attempts can happen normally. We monitor unusual increases and alert on suspicious activity instead.
3. **Every successful API request:** Successful requests are monitored through dashboards and metrics, not individual pages.
4. **Small temporary queue increases:** A short queue increase is not necessarily a failure. Alert when queue depth or message age indicates a delivery problem.
5. **Development-only warnings:** These should be reviewed during development rather than paging the production on-call engineer.

## PII Protection

BookSwap handles member information, so telemetry must not expose private data.

The following information must be excluded or masked:

- Passwords and authentication tokens.
- Authorization headers.
- Private addresses.
- Phone numbers.
- Full request and response bodies containing personal information.

Use request IDs and trace IDs to investigate requests without exposing private member details.

Access to Application Insights and Azure Monitor Logs must be restricted to authorized team members.