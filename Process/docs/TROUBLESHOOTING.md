# Troubleshooting Log

## Incident: HTTP 500 Internal Server Error (Req ID: req-1769961036677-569)

**Date:** 2026-02-01
**Component:** Server (API / generate endpoint)
**Severity:** High (Service Disruption)

### Root Cause Analysis
The `handleGenerate` function triggers an automated GitHub process. When this process encountered a GitHub API error (e.g., `401 Bad Credentials`, `403 Rate Limit`, or `404 Not Found`), the error handling logic in `githubAutomator.ts` caught the error and re-threw a new generic `Error` object ("GitHub Automation Failed: ...").

Crucially, this re-thrown error **lost the original HTTP status code** from the GitHub API response.

When this status-less error reached the `generateController` and subsequently the `errorHandler` middleware:
1. The `errorHandler` checked for a `status` property.
2. Finding none, it defaulted to `500 Internal Server Error`.
3. This masked the true nature of the problem (e.g., authentication failure or rate limiting) and triggered the client's 500-retry logic, which is inappropriate for permanent errors like 401.

### Resolution
1. **Server-Side Fix**: Updated `server/src/githubAutomator.ts` to preserve the `status` property when re-throwing errors.
   ```typescript
   // Before
   throw new Error(`GitHub Automation Failed: ${error.message}`);
   
   // After
   const enhancedError: any = new Error(`GitHub Automation Failed: ${error.message}`);
   if (error.status) {
       enhancedError.status = error.status;
   }
   throw enhancedError;
   ```

2. **Verification**:
   - Created `server/src/tests/githubAutomatorErrors.test.ts` to verify status code preservation.
   - Created `server/src/tests/generateControllerStatus.test.ts` to verify the controller sends the correct status code instead of falling back to 500.

### Outcome
- Requests failing due to GitHub API errors now return the correct status code (401, 403, 404, etc.) to the client.
- The client correctly handles these codes (e.g., showing "Session expired" for 401) without unnecessary retries.
- Actual 500 errors (crashes) are still caught and retried by the client.

## Incident: HTTP 409 Conflict Errors during Art Generation

**Date:** 2026-02-01
**Component:** Server (GitHub Automator) & Client
**Severity:** Medium (User Workflow Interruption)

### Root Cause Analysis
Users encountered HTTP 409 Conflict errors when:
1.  Trying to create a repository that already existed (`repoName` collision).
2.  Trying to update a file (`.github/workflows/generate_art.yml`) without providing the correct `sha` of the existing file (GitHub API requirement).

### Resolution
1.  **Pre-flight Check**: Implemented a check in `githubAutomator.ts` to see if the repository exists before attempting creation. If it exists, the system now logs a message and reuses it.
2.  **SHA Management**: Added logic to fetch the `sha` of the existing workflow file before attempting to update it. This prevents the "Conflict" error during file updates.
3.  **Exponential Backoff for 409**: Updated the `withRetry` utility in `githubAutomator.ts` to treat status `409` as retryable. This ensures that if a conflict occurs (e.g., due to race conditions or propagation lag), the system will retry with backoff, allowing time for the state to settle or for the new SHA fetch logic to succeed on the next attempt.
4.  **Client-Side Handling**: Validated that `client/lib/apiClient.ts` correctly identifies 409 errors and displays a user-friendly "Conflict" toast message instead of a generic error, and does *not* blindly retry (leaving the smart retry logic to the server).

### Verification
-   **Unit Tests**:
    -   `server/src/tests/githubAutomator.test.ts`: Verified logic for existing repo reuse and new repo creation.
    -   `client/tests/apiClient.test.ts`: Verified 409 errors trigger the correct toast message and do not trigger client-side retries.
