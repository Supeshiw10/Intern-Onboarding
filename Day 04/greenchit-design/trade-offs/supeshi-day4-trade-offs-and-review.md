# GreenChit — Trade-offs and Design Review

## 1. Setup

This document compares two architectural options for the GreenChit reimbursement management system.

- **Option A: App Service Monolith** – The Backend API is developed as a modular monolith and hosted on Azure App Service. Notification and Export background jobs run as Azure App Service WebJobs.
- **Option B: Container Apps Split** – The Backend API, Notification Worker, and Export Worker are deployed as separate containers using Azure Container Apps.

Both options use the same supporting Azure services:

- Azure SQL Database
- Azure Blob Storage
- Azure Service Bus
- Microsoft Entra ID
- Microsoft Teams and Email
- SharePoint

The options are evaluated using six quality attributes. Scores range from 1 to 5, where 1 represents poor suitability and 5 represents excellent suitability.

## 2. Trade-off Table

| Quality attribute | Option A: App Service Monolith | Option B: Container Apps Split | Why |
|---|---:|---:|---|
| Time-to-first-deploy | 5 | 2 | **A:** App Service offers a simple deployment process with fewer setup steps. **B:** Each container needs its own setup and deployment process. |
| Cost (low spend) | 5 | 2 | **A:** A single App Service hosting approach can reduce initial infrastructure and management costs for a small team. **B:** Separate container services may introduce additional resource and infrastructure costs. |
| Operability for 10-person team | 4 | 3 | **A:** The team can manage the API and background jobs using a simpler hosting approach. **B:** The team needs to manage and monitor multiple containers separately. |
| Independent deploy | 1 | 5 | **A:** The API and WebJobs share the same hosting environment, making separate deployments harder. **B:** Each container can be deployed or updated without redeploying the other services. |
| Future scaling | 2 | 5 | **A:** Scaling the App Service may also increase resources for components that do not need them. **B:** Each container can be scaled separately based on its workload. |
| Authn/authz consistency | 4 | 3 | **A:** Authentication and authorization can be handled centrally through the Backend API. **B:** Separate services need extra coordination to keep authentication and authorization consistent. |
| **Total** | **21** | **20** | **Option A has the higher total score for the current GreenChit requirements.** |

## 3. Results Summary

| Metric | Target | Achieved |
|---|---:|---:|
| Quality attributes scored | 6 | 6 |
| Cells with a written justification | 12 | 12 |
| Decision-affecting attributes identified | 2–3 | 3 |

## 4. Decision and Rationale

**Selected Option: Option A – App Service Monolith**

Option A was selected for the GreenChit system because it better matches the current project requirements and the needs of a small development team.

The main attributes that influenced the decision are:

1. **Time-to-first-deploy:** Azure App Service provides a simpler deployment approach. This helps the team deploy the system quickly without managing multiple container deployments.
2. **Cost (low spend):** The App Service approach can reduce initial infrastructure and operational costs compared with managing multiple separate containers.
3. **Operability for a 10-person team:** A simpler hosting and management approach reduces operational complexity and makes the system easier for the team to maintain.

Option B provides better independent deployment and future scaling. However, these benefits are less important for the current project size and requirements.

Therefore, Option A is selected for the initial GreenChit implementation. The architecture can be reconsidered if the system grows and requires independent scaling or deployment of its services.