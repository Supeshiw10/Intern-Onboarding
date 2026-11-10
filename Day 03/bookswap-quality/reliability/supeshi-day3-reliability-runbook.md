# BookSwap — Reliability Runbook v0.1

## Failure 1: Azure SQL Primary Unavailable for 5 Minutes

### What the user sees

- Members may see an error message when trying to create a book listing or submit a borrow request, such as:
  - "Sorry, we couldn't create your book listing right now. Please try again later."
  - "We couldn't submit your borrow request. Please try again in a few minutes."
- Search results may be temporarily unavailable if the requested data is not available in the cache. Members may see:
  - "We're unable to load search results right now. Please try again shortly."
- Members may see a temporary service unavailable message if the backend service is down, such as:
  - "BookSwap is temporarily unavailable. Please try again in a few minutes."

### Detection

The team uses Azure Monitor and Application Insights to detect the problem.

- Azure SQL Database `connection_failed` metric increases.
- Application Insights shows an increase in failed SQL dependency calls.

### Mitigation in design (timeouts, retries, circuit breaker, fallback)

**1. Timeout**

- Set the SQL connection timeout to 3 seconds.
- This prevents waiting too long and unnecessary resource usage.

**2. Retry with exponential backoff**

- Retry failed SQL operations up to 3 times.
- Wait 1 second before the first retry.
- Wait 2 seconds before the second retry.
- Wait 3 seconds before the third retry.

**3. Circuit breaker**

- Open the circuit breaker after 5 consecutive SQL failures within 30 seconds.
- Keep it open for 30 seconds.
- After that, allow one test request.
- If the test succeeds, close the circuit breaker.
- If it fails, keep the circuit open.

**4. Fallback**

- For read requests (e.g. searching for a book or viewing book details), use recently cached data from Redis whenever available.
- Allow stale cached book details to be used for a maximum of 5 minutes.
- For write requests (Create a new book listing, Update book details, etc.), return `503 Service Unavailable` when Azure SQL is unavailable, instead of accepting requests that cannot be saved.

**5. Idempotency**

- Require an idempotency key for book listing creation requests.
- Store the key with the result of the operation.
- If a member retries the same request, return the previous result instead of creating another book listing.

### Manual response (who is paged, what they do)

**Who is paged:**

- On-call engineers receive the Azure Monitor alert.
- Site Reliability / Operations team handles database availability.
- Engineering Lead coordinates the incident if the outage continues.

**Actions:**

- Check whether the problem is caused by database resource limits or a connection issue.

### Post-incident actions

- Review SQL error logs and Application Insights traces.
- Identify the root cause of the database outage.

---

## Failure 2: Azure Cache for Redis Is Down

### What the user sees

- Book searches and book detail requests may take longer than usual.
- Members can still search for books using Azure SQL.

### Detection

The team uses Azure Application Insights and Azure Monitor.

- Azure Cache for Redis `Errors` metric increases.

### Mitigation in design

**1. Timeout**

- Set the Redis connection timeout to 1 second.

**2. Retry with exponential backoff**

- Retry Redis operations up to 2 times.
- Wait 200 milliseconds before the first retry.
- Wait 300 milliseconds before the second retry.
- Do not keep retrying when Redis is unavailable.

**3. Circuit breaker**

- Open the Redis circuit breaker after 5 consecutive failures within 30 seconds.
- Keep it open for 30 seconds.
- Allow one test request after the waiting period.
- Close the circuit if the test request succeeds.

**4. Fallback to Azure SQL**

- If Redis is unavailable, read book data directly from Azure SQL.
- Continue creating and updating book records in Azure SQL.
- When Redis becomes available again, allow the cache to refill from SQL.

### Manual response

**Who is paged:**

- On-call engineer receives the Redis alert.
- Site Reliability / Operations team investigates the cache service.
- Engineering Lead is informed if the issue affects overall application performance.

**Actions:**

- Check Redis health and Azure Monitor metrics.

### Post-incident actions

- Review Redis error logs and Application Insights traces.
- Identify why Redis became unavailable.

---

## Failure 3: Sunday Tabloid Spike — 10× Sustained Traffic

### What the user sees

- Members may experience slower search results.
- Book listing and borrow request operations may take longer.

### Detection

The team uses Azure Application Insights and Azure Service Bus metrics.

### Mitigation in design (autoscale, queue depth, throttling)

**1. Horizontal autoscaling**

- Run at least 2 App Service instances.
- Scale out when CPU usage stays above 70% for 5 minutes.
- Add 2 instances when scaling out.
- Allow a maximum of 10 instances.
- Scale in only when CPU remains below 40% for 10 minutes.
- Use a 5-minute cooldown period between scaling actions.

**2. Queue depth management**

- Use Azure Service Bus for background notification and email digest jobs.
- Use retries and a dead-letter queue for messages that repeatedly fail.

**3. Rate limiting**

- Start with a limit of 100 requests per minute per authenticated member.
- Return `429 Too Many Requests` when a member exceeds the limit.

### Manual response

**Who is paged:**

- On-call engineer receives Azure Monitor alerts.
- Site Reliability / Operations team manages scaling and infrastructure.
- Engineering Lead coordinates the incident and prioritizes system stability.

**Actions:**

- Check App Service CPU, HTTP queue length and request failure rate.

### Post-incident actions

- Review traffic levels and peak request rates during the event.
- Identify which API endpoints experienced the highest load.
- Review App Service scaling performance.

---

## Failure 4: Azure Service Bus Unavailable

### What the user sees

- Members may not receive in-app notifications within 2 seconds.
- Weekly email digest jobs may be delayed.

### Detection

The team uses Azure Monitor and Application Insights.

- Azure Service Bus `Server Errors` metric increases.
- Azure Service Bus `Active Messages` continues increasing.

### Mitigation in design

**1. Timeout**

- Set the Service Bus send operation timeout to 3 seconds.
- Do not allow API requests to wait indefinitely for message publishing.

**2. Retry with exponential backoff**

- Retry failed message publishing up to 3 times.
- Wait 1 second before the first retry.
- Wait 2 seconds before the second retry.
- Wait 4 seconds before the third retry.

**3. Circuit breaker**

- Open the circuit breaker after 5 consecutive publishing failures within 30 seconds.
- Keep it open for 30 seconds.
- Allow one test publishing operation after the waiting period.
- Close the circuit if the test succeeds.

**4. Fallback**

- Keep the main book listing operation independent of email delivery.
- Store important pending notification jobs in a durable database-backed outbox.
- When Service Bus becomes available, a background worker publishes the pending messages.
- Retry failed background jobs and move repeatedly failed messages to the dead-letter queue.

### Manual response

**Who is paged:**

- On-call engineer receives the Azure Monitor alert.
- Site Reliability / Operations team investigates Service Bus availability.
- Engineering Lead coordinates the incident if notifications are significantly delayed.

**Actions:**

- Check Azure Service Bus health and server error metrics.
- Check active messages and dead-letter messages.

### Post-incident actions

- Review Service Bus errors and message processing logs.
- Identify the root cause of the outage.
- Check whether any messages were duplicated or lost.

---

## Failure 5: Azure Blob Storage Unavailable

### What the user sees

- Members cannot upload new book photos temporarily.
- Members may receive a `503 Service Unavailable` response when uploading a photo.

### Detection

The team uses Azure Monitor and Application Insights.

- Azure Blob Storage `Availability` metric decreases.
- Photo upload API requests return an increased number of `503` responses.

### Mitigation in design

**1. Timeout**

- Set the Blob Storage connection timeout to 3 seconds.

**2. Retry with exponential backoff**

- Retry temporary Blob Storage failures up to 3 times.
- Wait 1 second before the first retry.
- Wait 2 seconds before the second retry.
- Wait 4 seconds before the third retry.

**3. Circuit breaker**

- Open the circuit breaker after 5 consecutive upload failures within 30 seconds.
- Keep it open for 30 seconds.
- Allow one test upload after the waiting period.
- Close the circuit if the test upload succeeds.

**4. Fallback**

- Allow members to create book listings without uploading a photo, if the photo is optional.
- Return `503 Service Unavailable` for photo upload requests when Blob Storage is unavailable.
- Do not save image files in Azure SQL as a fallback.
- Allow members to retry the photo upload after Blob Storage recovers.

**5. Idempotency**

- Use a unique upload ID for each photo upload operation.
- If the same upload request is retried, check the upload ID before creating another file.
- This helps prevent duplicate photo uploads.

### Manual response

**Who is paged:**

- On-call engineer receives the Azure Monitor alert.
- Site Reliability / Operations team investigates Blob Storage availability.
- Engineering Lead is informed if photo uploads affect the main user experience.

**Actions:**

- Check Azure Blob Storage availability and transaction metrics.
- Check failed upload requests in Application Insights.
- Test a new photo upload.
- Confirm that uploaded photos can be accessed through their stored URLs.

### Post-incident actions

- Review Blob Storage errors and Application Insights traces.
- Identify the root cause of the storage failure.
- Check whether any uploaded photos were lost or duplicated.