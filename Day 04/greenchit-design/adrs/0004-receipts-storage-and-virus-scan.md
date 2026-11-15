# ADR 0004: Choose Azure Blob Storage for Receipts

## Status

Accepted (date: 2026-11-14)

## Context

- GreenChit allows staff to upload receipt images with reimbursement claims.
- Each claim can contain a maximum of 5 receipt images.
- Each receipt image must not exceed 10 MB.
- Receipt uploads must remain reliable during intermittent network connectivity.
- Receipt images must be stored securely and accessed only by authorized users.
- Uploaded files must be checked for malware before they are used in the system.
- Receipt storage must be separate from claim and approval information stored in Azure SQL Database.

## Decision

- We choose Azure Blob Storage to store receipt images.
- We use private Blob Storage containers to prevent public access to receipt files.
- We use short-lived Shared Access Signature (SAS) URLs to allow secure receipt uploads and downloads.
- The Backend API generates SAS URLs after checking user authorization.
- The Web App uploads receipt images directly to Blob Storage using the generated SAS URLs.
- We enforce a maximum of 5 receipt images per claim and a maximum file size of 10 MB per image.
- We implement retry handling in the Web App to support uploads affected by intermittent network connectivity.
- We use a malware scanning process to check uploaded receipt files before they are accepted for claim processing.
- We prevent unscanned or infected files from being used as valid claim attachments.

## Consequences

### Easier

- Receipt images can be stored separately from structured claim information.
- Direct uploads using SAS URLs reduce the amount of file data passing through the Backend API.
- Private containers and short-lived SAS URLs help protect receipt files.
- Blob Storage is suitable for storing image files.
- Retry handling helps users recover from temporary upload failures.

### Harder

- SAS URL generation, expiration, and permissions must be managed carefully.
- Malware scanning introduces additional processing time before receipts can be accepted.
- Failed uploads and scanning failures require retry and error-handling mechanisms.
- Storage access and scanning results must be monitored.

### Different

- Receipt images are stored in Azure Blob Storage instead of directly in Azure SQL Database.
- Receipt upload and malware scanning are handled separately from the main claim submission process.
- The system uses temporary signed URLs rather than making receipt files publicly accessible.

## Alternatives considered

- **Store receipt images directly in Azure SQL Database** — Rejected because storing large image files in the relational database would increase database storage usage and affect database management.
- **Use Azure Files** — Rejected because Azure Blob Storage is more suitable for storing and accessing receipt image objects through secure SAS URLs.