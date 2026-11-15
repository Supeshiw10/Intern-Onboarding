# ADR 0003: Choose Azure SQL Database

## Status

Accepted (date: 2026-11-14)

## Context

- GreenChit stores related data such as claims, users, approvals, receipt metadata, and audit records.
- Claim information and approval history must remain consistent.
- Claim updates, audit records, and notification outbox records must be saved together in a single database transaction.
- If one operation fails, all changes must be rolled back to prevent incomplete updates.
- Finance requires reliable queries to retrieve approved claims for CSV exports.
- The expected future data volume and workload are not yet fully known.

## Decision

- We choose Azure SQL Database as the primary database for GreenChit.
- We use Entity Framework Core to manage database operations.
- We use database transactions to save claim updates, audit records, and notification outbox records together.
- We ensure that all three operations succeed or fail as one transaction.
- We store claims, user information, receipt metadata, approval details, audit records, and notification delivery information in Azure SQL Database.

## Consequences

### Easier

- Relational data such as claims, users, and approvals can be managed using tables and relationships.
- SQL queries make it easier to retrieve approved claims for Finance CSV exports.
- Database transactions help maintain consistency between claim updates, audit records, and notification outbox records.
- Entity Framework Core simplifies database access and data management.

### Harder

- Database schema changes require migrations and careful deployment.
- Database performance must be monitored as the number of claims and users increases.
- Database capacity and scaling may require additional cost and planning.

### Different

- The system uses a relational database structure instead of a NoSQL document-based model.
- Database transactions are used to maintain consistency across related records.
- Developers must manage database schemas, relationships, and migrations.

## Alternatives considered

- **Azure Cosmos DB** — Rejected because GreenChit has relational data and requires consistent updates across claims, audit records, and notification outbox records. Azure SQL provides a suitable relational model and straightforward transaction management for this design.
- **Separate databases for claims, audit, and notifications** — Rejected because maintaining consistency across multiple databases would introduce additional transaction coordination and complexity. Keeping these records in Azure SQL allows them to be saved in one database transaction.