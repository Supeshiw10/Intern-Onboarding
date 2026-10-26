BookSwap - Storage and Cache Decisions

1. Data Inventory

Data type	Example record	Volume estimate (1y)	Read/write ratio
Book listing	Book title, author, owner, condition, availability, ISBN	Approximately 50,000 listings across all buildings	Read-heavy
Member profile	Member ID, name, contact details	Approximately 5,000 profiles	Read-heavy
Book photo	JPEG or PNG image, maximum 5 MB	Approximately 50,000–100,000 images	Read-heavy; writes on upload or replacement
Borrow request	Request ID, book ID, borrower ID, status (Pending, Accepted, Declined)	Approximately 20,000 requests	Mixed reads and writes
Loan record	Loan ID, book ID, borrower, due date, return date	Approximately 15,000 loans	Mixed reads and writes


2. Storage Selection

Data type	Primary store	Why this store	Why not the alternatives
Book listing	Azure SQL Database	Book listings have structured fields and relationships with members, borrow requests, and loans through foreign keys.	A document database could duplicate relational data and make relationships harder to manage.
Member profile	Azure SQL Database	Member records are structured and maintain valid relationships with other records.	Blob Storage is designed for files, not member data.
Book photo	Azure Blob Storage	Blob Storage is suitable for image files and avoids storing large binary objects in transactional tables.	Storing images as SQL BLOBs would increase database storage and backup size.
Borrow request	Azure SQL Database	It manages borrow requests and updates their status reliably.	Redis is not a permanent record. Blob Storage and a document store are less suitable.
Loan record	Azure SQL Database	It stores loan details and tracks borrowing and returns accurately.	A cache is not suitable for permanent loan history.


3. Cache Plan

3.1 What Is Hot Enough to Cache?

Azure Cache for Redis will be used to cache frequently requested book listings and search results. The application is expected to support up to 5,000 books, and book search should complete within 300 ms at p95.
- Book listing results: Cache the first pages of recent and frequently requested book listings.
- Popular search results: Cache results for frequently used title, author, ISBN, and condition searches.
- Individual book details: Cache details of books that users frequently view.
Personal addresses and phone numbers will not be cached.

3.2 Cache-Aside Pattern

When a user requests book ID 32671, the API first checks Redis for book:32671. If the book is found in the cache, the API returns the cached data. If not, it retrieves the book details from Azure SQL, stores them in Redis with a 60-second TTL, and returns the data. When the book is updated, the API deletes book:32671 from Redis so the next request fetches the latest data from Azure SQL.

3.3 TTL and Invalidation Strategy

Time-to-live (TTL): How long cached data remains available before it expires.
Cached data	TTL	Reason
Individual book details	5 minutes	Book details can change when a book is updated.
Book listing results	2 minutes	Availability and newly listed books should appear reasonably quickly.
Popular search results	2 minutes	Search results should reflect recent listing and availability changes.


Cache invalidation:

When a book is created, updated, deleted, or its availability changes, the API will delete the related data from Redis cache. This includes the book details, book listings, and search results. When a user requests the data again, the API will get the latest information from Azure SQL and save it in Redis cache again. The API will update Azure SQL first before deleting the cache data. If Redis is not working, the API will get the data directly from Azure SQL so that users can still view the books.

4. Queue Plan

4.1 Which Work Goes on a Queue and Why?

Azure Service Bus will handle background tasks such as notifications and weekly email digests. When a borrow request is created, accepted, or declined, the API saves the changes in Azure SQL and sends a message to the queue for notification processing. The weekly digest process will also send a message to the queue to prepare and send emails about the latest 10 books.

4.2 What Happens If the Consumer Is Down for 30 Minutes?

If the queue consumer is down for 30 minutes, messages will stay in Azure Service Bus until the consumer becomes available again.

Once the consumer restarts, it will process the pending messages.

If a message fails, the system will try again.

Messages that keep failing will be moved to the Dead-Letter Queue (DLQ) to check and process later.