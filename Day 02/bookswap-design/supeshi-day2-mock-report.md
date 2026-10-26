# BookSwap — Mock Smoke Test Report

## **1. Setup**

| **Item** | **Details** |
|---|---|
| **OpenAPI file** | `openapi/supeshi-day2-bookswap-openapi.yaml` |
| **Prism command used** | `npx.cmd @stoplight/prism-cli mock openapi/supeshi-day2-bookswap-openapi.yaml` |
| **Postman / Bruno collection link** | [BookSwap Smoke Tests Collection](https://supeshiw10-449330.postman.co/workspace/Supehi-Wedagedara) |
| **Mock server URL** | [http://127.0.0.1:4010](http://127.0.0.1:4010) |
| **Testing tool** | Postman |
| **Collection** | BookSwap Smoke Tests |
| **Evidence** | Postman screenshots showing request details and actual response status codes |

## **2. Results Summary**

| **Metric** | **Target** | **Achieved** |
|---|---:|---|
| Tests run | 5 | 5 |
| Tests passing against the mock | 5 | 3 confirmed; 1 partially verified; 1 failed |
| Endpoints with explicit error responses | 4+ | 1 error response observed; specification coverage needs further verification |

## **3. Test Results**

| **#** | **Endpoint** | **Method** | **Expected Status** | **Actual Status** | **Result** |
|---:|---|---|---:|---:|---|
| 1 | `/books?page=1&pageSize=20` | GET | 200 | 200 | Pass |
| 2 | `/books` | POST | 201 | 201 | Pass |
| 3 | `/books` (missing title) | POST | 400 or 422 | 422 | Partial — error reason needs verification |
| 4 | `/books/999/borrow-requests` | POST | 201 | 201 | Status matched; JWT authentication not tested |
| 5 | `/books?page=1&pageSize=20` (without Authorization) | GET | 401 | 200 | Fail — authentication was not enforced by the mock |

## **4. Findings**

### **4.1 What did the mock reveal that the OpenAPI on its own did not?**

**1. The mock returned a different book.**

The `POST /books` request was sent with the title `"The Great Gatsby"`, but the response showed `"Jane Eyre"`. This shows that the mock returns sample data and does not confirm that the new book was saved.

**2. The missing-title test returned an unclear error.**

The `POST /books` request without a title returned `422 Unprocessable Entity`. However, the response message was `BOOK_NOT_FOUND`. Therefore, it is not clear whether the missing-title validation was checked correctly.

**3. The books endpoint worked without a token.**

The `GET /books` request without an `Authorization` header returned `200 OK` instead of the expected `401 Unauthorized`. This shows that the mock allowed the request without a token.

**4. The borrow request returned a different book ID.**

The request to `/books/999/borrow-requests` returned `201 Created`, but the response contained `bookId: book-105`. This makes it difficult to check how the API handles a book that does not exist.

### **4.2 Which endpoints feel awkward to call?**

- The `POST /books` endpoint is confusing because the response shows a different book from the one submitted.
- The `POST /books` endpoint returns a `BOOK_NOT_FOUND` error when the title is missing. The error message is unclear.
- The `POST /books/{bookId}/borrow-requests` endpoint is confusing because the response returns a different book ID from the one requested.
- The `GET /books` endpoint returns `200 OK` without a token, even though `401 Unauthorized` is expected.

## **5. Spec Changes You Would Make**

**1. Require the book title.**

- **File:** `openapi/supeshi-day2-bookswap-openapi.yaml`
- The `POST /books` request schema should require the `title` field.
- A clear `400 Bad Request` or `422 Unprocessable Entity` error response should be added for requests without a title.

**2. Check authentication settings.**

- **File:** `openapi/supeshi-day2-bookswap-openapi.yaml`
- The security settings for `GET /books` and other protected endpoints should be checked.
- If authentication is required, `bearerAuth` and a `401 Unauthorized` response should be added.

**3. Add a response for books that do not exist.**

- **File:** `openapi/supeshi-day2-bookswap-openapi.yaml`
- A `404 Not Found` response should be added to the borrow-request endpoint for books that do not exist.
- The response example should also use the correct book ID.

## **6. Reproducibility**

1. Install Node.js and npm.
2. Open the terminal in the `bookswap-design` folder.
3. Start the Prism mock server using this command:

   ```powershell
   npx.cmd @stoplight/prism-cli mock openapi/supeshi-day2-bookswap-openapi.yaml --port 4010
   ```

4. If port `4010` is already in use, use the running server or stop it before starting another one.
5. Open Postman and select the BookSwap Smoke Tests collection.
6. Send all five requests and check the status codes and responses.
7. Compare the actual results with the expected results and update the report if needed.



