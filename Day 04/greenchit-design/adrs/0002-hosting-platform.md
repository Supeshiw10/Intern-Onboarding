# ADR 0002: Choose Azure App Service

## Status

Accepted (date: 2026-11-14)

## Context

- GreenChit requires a reliable hosting platform for its Web API.
- The system must support 99.9% availability during business hours (08:00–19:00 SLST, weekdays).
- The project has a small development team of approximately 10 people.
- The team needs a hosting solution that is easy to deploy, operate, and maintain.
- The system requires background processing for notifications and scheduled Finance CSV exports.
- The future workload and scaling requirements are not yet fully known.

## Decision

- We choose Azure App Service to host the GreenChit Backend API.
- We use ASP.NET Core Web API as a modular monolith.
- We use Azure App Service WebJobs for background notification processing and scheduled CSV exports.
- We configure application monitoring and health checks to monitor service availability.
- We use deployment slots to support safer application deployments.

## Consequences

### Easier

- Application deployment and management are simpler.
- The development team can maintain one main API application.
- WebJobs allow background tasks to run within the App Service environment.
- The solution requires less operational management than a distributed container-based architecture.

### Harder

- Independent deployment of individual backend modules is limited.
- Background jobs share the App Service environment and its resources.
- Scaling individual components independently is more difficult.
- The application may require additional capacity as usage increases.

### Different

- The system uses a modular monolith instead of multiple independently deployed microservices.
- Background processing is handled using App Service WebJobs.
- The architecture prioritizes operational simplicity over independent service deployment.

## Alternatives considered

- **Azure Container Apps** — Rejected because deploying and operating multiple containerized services would introduce additional complexity for the current small development team.
- **Separate microservices** — Rejected because the current system requirements do not justify the additional deployment, monitoring, and communication complexity.