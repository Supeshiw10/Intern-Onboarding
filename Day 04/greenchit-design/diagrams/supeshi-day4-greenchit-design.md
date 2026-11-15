# GreenChit — Architecture Design Pack

## 1. System Context

GreenChit is an internal reimbursement management system used by BISTEC staff. Staff members can submit reimbursement claims with category, date, amount, description, and receipt images. Line managers can review submitted claims and approve, reject, or request additional information. Staff can track their claim status, while Finance can export approved claims as CSV files to a SharePoint folder for payroll processing. The system uses Microsoft Entra ID for authentication and role-based access control to ensure that only authorized users can access claims. Azure SQL Database stores claim information and audit records, while Azure Blob Storage stores receipt images. Microsoft Teams notifications and email fallback keep managers informed about pending approvals. Every claim state transition is recorded in a tamper-evident audit log and retained for seven years.

## 2. Containers (C4 Level 2)

The Container Diagram shows the main deployable and runnable parts of the GreenChit system, their technologies, responsibilities, and interactions with external systems.

### 2.1. Table of Containers

| Container | Technology | Responsibility |
|---|---|---|
| Web App | HTML, CSS, JavaScript / TypeScript | Provides the user interface for staff, managers, and Finance. Allows users to submit claims, upload receipts, track claim status, and manage approvals. |
| Backend API | ASP.NET Core Web API, Azure App Service | Handles business rules, authorization, claim management, receipt upload coordination, SAS URL generation, audit logging, and database operations. |
| Database | Azure SQL Database | Stores claims, user information, receipt metadata, approval details, audit records, and notification delivery status. |
| Blob Storage | Azure Blob Storage | Stores receipt images securely using private containers and signed URLs (SAS). |
| Service Bus | Azure Service Bus | Handles asynchronous claim events and background processing requests. |
| Notification Worker | Azure App Service WebJob | Receives claim events, sends Teams and email notifications, and records notification delivery status. |
| Export Job | Scheduled WebJob | Reads approved claims from Azure SQL, generates payroll CSV files, and uploads them to SharePoint. |

### External Systems

| External System | Technology | Responsibility |
|---|---|---|
| Identity Provider | Microsoft Entra ID | Provides Single Sign-On (SSO) and issues JWT access tokens to authenticate users. |
| Notification Service | Microsoft Teams + Email | Receives manager notifications through Teams Adaptive Cards, with email as a fallback. |
| Payroll Integration | SharePoint | Stores approved claim CSV exports in a folder monitored by payroll automation. |

### 2.2. Container Interactions

1. Staff, Managers, and Finance access the Web App through HTTPS.
2. The Web App communicates with the Backend API using REST APIs over HTTPS.
3. The Backend API validates JWT access tokens issued by Microsoft Entra ID.
4. The Backend API reads and writes claim information in Azure SQL Database.
5. The Backend API generates short-lived SAS URLs for secure receipt uploads to Azure Blob Storage.
6. The Web App uses the SAS URLs to upload receipt images directly to Blob Storage.
7. The Backend API publishes claim events to Azure Service Bus.
8. The Notification Worker receives claim events from Service Bus, sends notifications through Microsoft Teams and email, and records delivery status in Azure SQL.
9. The Export Job reads approved claims from Azure SQL, generates CSV files, and uploads them to SharePoint.

## 3. Component Table — Backend API (C4 Level 3)

The Component Diagram shows the internal components of the GreenChit Backend API, their responsibilities, technologies, and how they interact to handle claim management, authentication, receipt uploads, notifications, and audit logging.

| Component | Technology | Responsibility |
|---|---|---|
| Auth | JWT Middleware + Authorization Policies | Validates JWT tokens and checks whether users have permission to access claims. |
| Claims | ASP.NET Core Controllers + Services | Handles claim creation, draft saving, submission, approval, rejection, and business rules. |
| Receipts | ASP.NET Core Service | Generates SAS upload links and enforces receipt limits (maximum 5 files and 10 MB per file). |
| Audit | Audit Writer | Records who performed each claim state transition, when it happened, and why. |
| Notifications | Outbox Publisher | Creates notification outbox records and publishes events to Azure Service Bus. |
| Claims Repository | Entity Framework Core | Handles database operations and saves claim updates, audit records, and notification outbox records in one database transaction. |

### 3.1. Component Interactions

1. The Web App sends REST API requests to the Auth component over HTTPS.
2. The Auth component validates JWT tokens with Microsoft Entra ID.
3. The Auth component checks user permissions and authorizes requests to the Claims component.
4. The Claims component requests upload links from the Receipts component.
5. The Receipts component generates SAS URLs for uploading receipt images to Azure Blob Storage.
6. The Claims component sends claim state transition details to the Audit component.
7. The Claims component requests notification events through the Notifications component.
8. The Claims component saves claim information through the Claims Repository.
9. The Audit component saves audit records through the Claims Repository.
10. The Notifications component saves outbox records through the Claims Repository.
11. The Claims Repository saves claim, audit, and outbox records in one database transaction in Azure SQL.
12. The Notifications component publishes queued events to Azure Service Bus.