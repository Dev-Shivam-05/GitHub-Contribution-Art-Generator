# Troubleshooting Guide: Backend Failures & 500 Errors

## Overview
This document outlines the diagnosis and resolution of critical backend failures, specifically "AxiosError 500" and "Socket Hang Up" issues during the pattern generation process.

## 1. 500 Internal Server Error (AxiosError)

### Symptoms
*   User receives a "Server Error" toast notification.
*   Client console shows `AxiosError: Request failed with status code 500`.
*   Server logs show `Unhandled Error` or stack traces related to GitHub API.

### Root Causes
1.  **GitHub Automation Failure**: The most common cause is the `automateGitHubProcess` failing to create or update files in the repository.
    *   *Specific Error*: `Failed to create workflow file after 10 attempts: Not Found`
    *   *Why*: The GitHub token lacks `repo` or `workflow` scopes, or the repository was not propagated in time.
2.  **Authentication Failure**: `401 Bad credentials` from GitHub API was previously treating as an unhandled 500 error.

### Resolution & Fixes
*   **Enhanced Error Handling**:
    *   We updated `server/src/middleware/errorHandler.ts` to intercept `Failed to create workflow` errors.
    *   It now returns a **502 Bad Gateway** with a specific message: "GitHub Automation Failed: Could not initialize repository workflow."
*   **Circuit Breaker**:
    *   Implemented `opossum` circuit breaker in `server/src/utils/circuitBreaker.ts`.
    *   This prevents cascading failures if GitHub API is down or rate-limiting.
    *   If the breaker is open, it returns a "Service Temporarily Unavailable" error immediately.
*   **Authentication Mapping**:
    *   `401` errors from GitHub are now mapped to `401 Unauthorized` in our API, prompting the user to sign in again.

### Prevention
*   **User Action**: Ensure your Personal Access Token (PAT) has `repo` and `workflow` scopes selected.
*   **Developer Action**: Check server logs for `correlationId` to trace specific requests.

## 2. Socket Hang Up (Connection Reset)

### Symptoms
*   Client console shows `Error: socket hang up` or `ECONNRESET`.
*   Next.js Proxy logs `Failed to proxy ...`.

### Root Causes
*   **Server Crash**: The backend Node.js process crashed due to an uncaught exception.
*   **Port Conflict**: Multiple instances of the server running on port 5000.

### Resolution
*   **Consolidated Terminals**: Ensured only one instance of the server is running.
*   **Global Error Handler**: The `errorHandler` middleware now catches synchronous and asynchronous errors from controllers, preventing process crashes.
*   **Health Check**: Added `/health` endpoint to verify server status.

## 3. Debugging Tools

### Health Check
Verify the server is running:
```bash
curl http://localhost:5000/health
# Response: {"status":"ok","timestamp":"..."}
```

### Logs
Server logs are now structured JSON with `correlationId`. Look for `level: "error"`:
```json
{
  "level": "error",
  "message": "Automation Error",
  "correlationId": "12345...",
  "error": "Failed to create workflow..."
}
```

## 4. Unit Tests
Run the test suite to verify fixes:
```bash
cd server
npx vitest run src/tests/generateController.test.ts
```
The suite covers:
*   Successful generation
*   Usage limits (403)
*   Circuit breaker failure
*   Bad credentials handling
