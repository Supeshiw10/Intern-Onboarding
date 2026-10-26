Container Diagram (C4 Level 2)

BookSwap container diagram

## How to Read the Diagram

1. The Member uses the React Native mobile app to browse and swap books.
2. The mobile app sends REST API requests to the Node.js Express API hosted on Azure App Service, and the app uses Microsoft Entra External ID to sign in and obtain a JWT that the API validates.
3. The API reads and writes book, member, request, and loan records in Azure SQL, uses Azure Cache for Redis for hot reads, and stores book photos in Azure Blob Storage.
4. For email work, the API places jobs on Azure Service Bus, and the Notification Worker consumes queued messages and sends email digests through Azure Communication Services.
5. The blue solid arrows represent synchronous request/response or data-access calls, while the orange dashed arrows represent asynchronous background work. The Queue and Object Store are separate services, with no direct connection between them.

## Main Components

| Component | Responsibility |
|---|---|
| Member | Uses the BookSwap application. |
| Mobile app | Member-facing interface. |
| API service | Handles REST API requests and application logic. |
| Identity | Authenticates users and issues JWTs; the API validates tokens. |
| Database | Stores system-of-record data in Azure SQL. |
| Cache | Keeps frequently accessed data in Redis temporarily. |
| Object store | Stores book photos in Azure Blob Storage. |
| Queue | Carries email and notification jobs through Azure Service Bus. |
| Notification worker | Processes queue messages and reads the latest 10 books for digests. |
| Email | Sends emails and weekly digests through Azure Communication Services. |

Line	Meaning
Solid blue	Synchronous call (request/response)
Dashed orange	Asynchronous message / background work