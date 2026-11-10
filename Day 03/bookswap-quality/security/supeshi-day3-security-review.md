# BookSwap — Security Review of the API

## 1. Security Review Findings

| Category | Question | Finding | Severity | Mitigation |
|---|---|---|---|---|
| **Authn** | Is every nonpublic endpoint protected by JWT? | If JWT validation is missing from a protected endpoint, an unauthenticated user may access private API operations.<br><br>A request without a token:<br>`GET /books HTTP/1.1`<br>`Host: api.bookswap.example`<br><br>Expected response:<br>`HTTP/1.1 401 Unauthorized` | High | Require valid JWT authentication on every endpoint except `/health`. Validate token signature, issuer, audience and expiration. Reject expired tokens with `401 Unauthorized`. Set token lifetime to a maximum of 1 hour. |
| **Authz**<br>(Authorization checks whether an authenticated user is allowed to access a particular resource.) | Does every `/{id}`-shaped endpoint check object ownership? | An authenticated member may change a book, borrow-request or loan ID in a URL and attempt to access another member's information.<br><br>Broken Object Level Authorization (BOLA) occurs when the API checks whether a user is logged in but does not check whether that user has permission to access the requested object. Resource-level authorization = checks whether you have permission to access or modify a specific book, borrow request, or loan.<br><br>**Concrete attack scenario**<br>Assume:<br>• Member A owns `book-100`.<br>• Member B owns `book-105`.<br>• Member A has a valid JWT.<br><br>Member A can normally request:<br>`GET /books/book-100/loans HTTP/1.1`<br>`Host: api.bookswap.example`<br>`Authorization: Bearer <member-a-jwt>`<br><br>Now Member A changes the book ID:<br>`GET /books/book-105/loans HTTP/1.1`<br>`Host: api.bookswap.example`<br>`Authorization: Bearer <member-a-jwt>`<br><br>If the API only checks the JWT and does not verify book ownership, Member A may access Member B's loan history. This is a Broken Object Level Authorization risk. | High | Implement resource-level authorization checks in the API for all endpoints that access or modify books, borrow requests, and loans. Verify that the authenticated user's ID matches the resource owner or that the user has the required permissions before processing each request. Only allow book owners to accept or decline borrow requests and restrict loan updates to authorized members. Reject unauthorized access attempts with `403 Forbidden`. Do not rely only on JWT authentication to protect resources. |
| **Injection** | Are all DB queries parameterised? | If user input is concatenated directly into SQL queries, an attacker may manipulate database commands through search fields or other inputs. SQL injection occurs when untrusted input is treated as part of a SQL command.<br><br>**Example risk**<br>An unsafe implementation might build a query by joining user input directly into SQL:<br>`const query = "SELECT * FROM Books WHERE title = '" + req.query.title + "'";`<br><br>An attacker may manipulate the SQL query through the search input. | High | Use parameterised SQL queries or prepared statements. Never concatenate untrusted input into SQL commands. Validate and limit the maximum search input length.<br><br>`const result = await pool.request()`<br>`.input("title", sql.NVarChar, req.query.title)`<br>`.query("SELECT * FROM Books WHERE title = @title");` |
| **Secrets** | Where are connection strings stored? | Database passwords or API secrets stored in source code or committed `.env` files may be exposed to unauthorized people. Secrets include:<br>• Azure SQL connection strings.<br>• Database credentials.<br>• JWT signing secrets or private keys, where applicable.<br>• Azure service credentials.<br>• Third-party API keys. | High | Store production secrets in Azure Key Vault. Use managed identity to access Key Vault. Never commit secrets to GitHub. Rotate regularly. Do not commit `.env` files or secrets to GitHub. |
| **Transport** | Is TLS enforced at Front Door? | If HTTP traffic is accepted without redirecting to HTTPS, information may be exposed during transmission. Transport security protects information while it travels between the client and the API. | Medium | Implement secure HTTPS communication through Azure Front Door. Redirect all HTTP requests to HTTPS and use valid TLS certificates. Enable HTTPS communication between Azure Front Door and backend services where supported. Reject insecure connections where required and avoid exposing sensitive information in URLs. |
| **Rate limit**<br>(Rate limiting restricts the number of requests a user or client can make within a specified time period.) | Are auth and write endpoints rate limited? | If authentication and write endpoints do not have rate limits, attackers can send too many requests repeatedly. This can cause brute-force login attempts, spam book creation, and excessive borrow requests.<br>• Authentication endpoints provided by the identity provider.<br>• `POST /books`<br>• `POST /books/{bookId}/borrow-requests`<br>• `PATCH /borrow-requests/{requestId}`<br>• `PATCH /loans/{loanId}` | Medium | Set up Azure Front Door WAF rate-limiting rules.<br><br>Proposed starting limits:<br>• General authenticated API traffic: 100 requests per minute per member.<br>• Authentication attempts: Apply stricter limits to prevent repeated login attempts.<br>• Write endpoints: Apply suitable limits to prevent repeated submissions.<br><br>Return: `HTTP/1.1 429 Too Many Requests` |
| **PII** | What PII appears in responses, logs, or queues? | Request or error logs may accidentally contain member addresses, phone numbers, email addresses or JWT tokens. Queue messages may also contain unnecessary personal information.<br><br>**PII leakage scenario**<br>A member sends a request to update their profile. If the API logs the complete request body or `Authorization` header, personal information and JWT tokens may be stored in Application Insights or Azure Monitor Logs. A person with unauthorized log access may then see this information.<br><br>**Risk in queues**<br>Azure Service Bus messages may also expose personal information if they contain complete member profiles or unnecessary contact details. | High | Never return private addresses or phone numbers in API responses. Exclude JWT tokens and `Authorization` headers from logs. Mask necessary personal information. Keep queue messages limited to the data required by background workers. |

---

## 2. OWASP ZAP Baseline Scan

OWASP ZAP is used to scan the BookSwap Prism mock API for possible web security issues.

**Scan target:** `http://127.0.0.1:4010`

**Scan environment:**

- Prism mock server.
- BookSwap OpenAPI specification.
- Local development environment.

### Running the scan using ZAP Desktop

1. Start the Prism mock server on port 4010.
2. Open OWASP ZAP.
3. Select **Quick Start**.
4. Select **Automated Scan**.
5. Enter `http://127.0.0.1:4010` as the target URL.
6. Start the scan.
7. Wait for the scan to complete.
8. Review the **Alerts** section.
9. Generate an HTML report and save it as `security/zap-baseline-report.html`.

---

## OWASP ZAP Baseline Security Scan Report

### 2.1 Scan Overview

An OWASP ZAP Baseline Scan was performed against the BookSwap API running on the Prism mock server to identify potential security issues.

| Item | Details |
|---|---|
| Security Testing Tool | OWASP ZAP |
| ZAP Version | 2.17.0 |
| Target | `http://host.docker.internal:4010` |
| Scan Type | ZAP Baseline Scan |
| Scan Date | 07 November 2026 |
| Total Endpoints Identified | 4 |
| HTTP Methods Identified | GET |

### 2.2 Summary of Scan Results

The scan identified three types of security alerts.

| Risk Level | Number of Alerts |
|---|---|
| High | 0 |
| Medium | 1 |
| Low | 1 |
| Informational | 1 |
| False Positives | 0 |

**Total:** 3 alert types

> **Note:** The number of alerts represents the number of distinct alert types, not the total number of affected URL instances.

### 2.3 Security Findings

#### Finding 1 – Cross-Domain Misconfiguration

- **Severity:** Medium
- **Plugin ID:** 10098
- **Affected URLs:**
  - `GET /`
  - `GET /books`
  - `GET /robots.txt`

**Evidence:**

```http
Access-Control-Allow-Origin: *
```

**Description:** The API allows cross-origin requests from any external domain through the `Access-Control-Allow-Origin: *` response header. This may allow third-party websites to read responses from unauthenticated API endpoints.

**Impact:** An attacker may create a malicious website that reads publicly accessible API data from the BookSwap API. This could expose information that should only be accessible to trusted applications.

**Mitigation:** Implement a restrictive Cross-Origin Resource Sharing (CORS) policy that allows requests only from trusted frontend domains. Avoid using `Access-Control-Allow-Origin: *` for APIs that expose sensitive information.

---

#### Finding 2 – X-Content-Type-Options Header Missing

- **Severity:** Low
- **Plugin ID:** 10021
- **Affected URL:** `GET /books`

**Description:** The API response does not include the `X-Content-Type-Options` security header with the value `nosniff`.

**Impact:** Some browsers may interpret response content as a different MIME type instead of following the declared content type. This may increase the risk of certain content-based attacks.

**Mitigation:** Add the following HTTP response header to API responses:

```http
X-Content-Type-Options: nosniff
```

This helps prevent browsers from performing MIME-type sniffing.

---

#### Finding 3 – Storable and Cacheable Content

- **Severity:** Informational
- **Plugin ID:** 10049
- **Affected URLs:**
  - `GET /`
  - `GET /books`
  - `GET /robots.txt`
  - `GET /sitemap.xml`

**Description:** The API responses do not explicitly define caching directives. As a result, caching components may store and reuse response content.

**Impact:** If responses contain personal or user-specific information, shared caching may expose sensitive data to other users.

**Mitigation:** For sensitive or user-specific API responses, use the following HTTP response headers:

```http
Cache-Control: no-store, private
Pragma: no-cache
```

Public book catalogue data can use an appropriate caching policy instead of disabling caching for all responses.

---

### 2.4 Recommended Finding for Further Discussion

The **Cross-Domain Misconfiguration (Medium)** finding is selected for further discussion because:

- It has a Medium risk classification.
- The scan identified clear evidence: `Access-Control-Allow-Origin: *`.
- It is relevant to the BookSwap API.
- It has a practical mitigation through a restrictive CORS policy.

Implementing a restrictive CORS policy will help prevent untrusted websites from accessing API responses through browser-based cross-origin requests.

### 2.5 Scan Limitations

The ZAP Baseline Scan identified four endpoints, and all identified requests used the GET method. The `/books` endpoint returned a successful `200 OK` response.

However, this scan was performed against a Prism mock server rather than the complete BookSwap backend implementation.

Therefore, the scan does not confirm whether backend security controls such as JWT authentication, Broken Object Level Authorization (BOLA), and SQL injection protection are correctly implemented.

These security controls require separate testing against the relevant API endpoints and backend implementation.