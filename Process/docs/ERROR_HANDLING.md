# Error Handling & Conflict Resolution Strategy

## Overview

This document outlines the error handling strategy for the GitHub Contribution Editor application, specifically focusing on API interactions, conflict resolution, and client feedback.

## Conflict Resolution (HTTP 409)

A common scenario in this application is the creation of GitHub repositories. GitHub enforces unique repository names per user account.

### The Problem
When a user attempts to generate a pattern using a text string (e.g., "Hello") that results in a repository name that already exists (e.g., `hello-contribution`), the GitHub API returns a `422 Unprocessable Entity` error with the message "name already exists".

Previously, this resulted in an unhandled `500 Internal Server Error`.

### The Solution

We implement a specific mapping strategy to handle this gracefully:

1.  **Pre-flight Check (Server-Side)**:
    -   In `server/src/githubAutomator.ts`, we first check if the repository exists using `octokit.rest.repos.get`.
    -   If it exists, we **reuse** the repository instead of failing.
    -   If it doesn't exist, we proceed to create it.

2.  **Existing File Handling**:
    -   When creating the workflow file, we check if it already exists.
    -   If it does, we fetch its `sha` and perform an **update** operation instead of a create operation, preventing 422/409 errors.

3.  **Fallback Mapping**:
    -   As a safety net, if a race condition occurs and GitHub returns a 422 "name already exists" error during creation, we map it to a `409 Conflict` error.

4.  **Client Handling**:
    -   The Axios client (`client/lib/apiClient.ts`) has a response interceptor.
    -   It detects the 409 status code.
    -   It displays a `toast.error("Conflict: Repository name already exists...")`.
    -   It does **NOT** retry the request, as retrying a duplicate resource creation without changing parameters is futile.
    -   **Note**: With the new "Reuse" strategy, users should rarely see this error.

## Retry Policy

We use different retry strategies for different scenarios:

-   **Transient Errors (500, 503, Network Errors)**:
    -   **Client-Side**: The Axios client performs exponential backoff retries (up to 3 times) with jitter.
    -   **Server-Side**: The `githubAutomator.ts` uses a custom `withRetry` helper for GitHub API calls that fail with 5xx or 403 (Rate Limit) errors.

-   **Permanent Errors (400, 401, 403, 404, 409, 422)**:
    -   No retry logic is applied.
    -   Immediate feedback is provided to the user via Toasts.

## Circuit Breaker

To prevent cascading failures when GitHub API is down or rate-limited:
-   We use `opossum` circuit breaker in `server/src/utils/circuitBreaker.ts`.
-   If the failure rate exceeds 50%, the breaker opens and fails fast with `503 Service Unavailable`.
-   The client handles 503 by showing a "Service Temporarily Unavailable" toast.

## Testing

-   **Backend**: `server/src/tests/generateControllerErrors.test.ts` verifies the 409 mapping.
-   **Frontend**: `client/tests/apiClient.test.ts` verifies the interceptor logic for 409 errors and ensures no retries occur.
