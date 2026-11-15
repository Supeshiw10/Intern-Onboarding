# 4. Sequence Diagram — Submit and Approve a Claim

### 4.1. Happy Path

1. Staff creates a claim.
2. The Backend API generates a SAS URL.
3. The Web App uploads receipts directly to Blob Storage.
4. Staff submits the claim.
5. The API saves the claim, audit, and notification outbox records in Azure SQL.
6. The API publishes an event to Service Bus.
7. The Notification Worker sends a Teams notification to the Line Manager.
8. The Line Manager reviews and approves the claim through the Web App.
9. The API updates the claim status and saves an audit record in Azure SQL.


## Happy Path

```mermaid

sequenceDiagram
    autonumber
    actor Staff
    participant FE as Web App
    participant API as Backend API
    participant Entra as Microsoft Entra ID
    participant DB as Azure SQL
    participant Blob as Blob Storage
    participant SB as Service Bus
    participant Worker as Notification Worker
    participant Teams as Microsoft Teams + Email
    actor Manager as Line Manager

    Staff->>FE: Create claim
    FE->>API: Request draft creation (JWT)
    API->>Entra: Validate JWT
    Entra-->>API: Token valid
    API->>DB: Save claim (Draft)
    API-->>FE: Return claim ID and SAS URL

    FE->>Blob: Upload receipt using SAS URL
    Blob-->>FE: Upload successful

    Staff->>FE: Submit claim
    FE->>API: POST /claims/{id}/submit (JWT)
    API->>DB: Save Submitted status, audit and outbox records
    Note over API,DB: Save in one database transaction
    API->>SB: Publish claim.submitted event
    API-->>FE: 200 OK

    SB-->>Worker: Deliver claim.submitted event
    Worker->>Teams: Send Adaptive Card
    Teams-->>Manager: New claim notification

    Manager->>FE: Open and review claim
    FE->>API: POST /claims/{id}/approve (JWT)
    API->>Entra: Validate JWT
    Entra-->>API: Token valid
    API->>DB: Update status and save audit record
    API-->>FE: 200 OK
```


### 4.2. Error Path — Receipt Upload Fails

This describes what happens when a receipt upload fails.

1. The claim remains in Draft status in the database.
2. If the upload fails, the Web App retries the upload.
3. If the retry also fails, the claim remains in Draft status.
4. The claim is not submitted.
5. No notification is sent to the Line Manager.


## Error Path — Receipt Upload Failure

```mermaid
sequenceDiagram
    autonumber
    actor Staff
    participant FE as Web App
    participant API as Backend API
    participant DB as Azure SQL
    participant Blob as Blob Storage

    Staff->>FE: Create claim
    FE->>API: Request draft creation (JWT)
    API->>DB: Save claim (Draft)
    API-->>FE: Return claim ID and SAS URL

    FE->>Blob: Upload receipt using SAS URL

    alt Receipt upload fails
        Blob-->>FE: Upload failed
        FE->>Blob: Retry upload
        Blob-->>FE: Upload failed again
        FE-->>Staff: Show retry message
        Note over FE,DB: Claim remains Draft. Submission and notification do not happen.
    else Receipt upload succeeds
        Blob-->>FE: Upload successful
        FE-->>Staff: Receipt uploaded successfully
    end
```
