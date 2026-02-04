# 403 Forbidden & Authentication Error Investigation Report

## Executive Summary
A comprehensive investigation was conducted to resolve persistent 403 Forbidden errors and 500 Internal Server Errors during the pattern generation process. The analysis revealed two distinct issues: a legitimate application-level limit (403) and an unhandled upstream authentication failure (500) masquerading as a generic server error. Both issues have been resolved, tested, and documented.

## Root Cause Analysis

### 1. 403 Forbidden (Permission Denied)
*   **Cause**: The application enforces a strict limit of **3 patterns per user**. When a user exceeds this limit, the server correctly returns a `403 Forbidden` status with the message "Limit reached: Request approval from admin to run again".
*   **Observation**: The client-side error handling was not sufficiently distinct, potentially leading users to believe it was a generic permission error rather than a specific usage limit.
*   **Code Reference**: `server/src/controllers/generateController.ts` (Logic: `if (patterns.length >= 3) ...`)

### 2. 500 Internal Server Error (Bad Credentials)
*   **Cause**: When an invalid or expired GitHub token was passed to the server, the `octokit` library threw a `401 Bad credentials` error.
*   **Failure**: The centralized error handler (`server/src/middleware/errorHandler.ts`) treated this as an unhandled exception, returning a generic `500 Internal Server Error` instead of a meaningful 401 status.
*   **Impact**: Users with expired sessions received "Server Error" notifications instead of being prompted to re-authenticate.

### 3. Username Inconsistency
*   **Cause**: The client-side `handleGenerate` function relied on `session.user.username` which was occasionally undefined depending on the login provider mapping.
*   **Impact**: This could lead to `400 Validation Error` (Username required) which confused the troubleshooting process.

## Implemented Fixes

### Server-Side
1.  **Enhanced Error Handling**:
    *   Updated `server/src/middleware/errorHandler.ts` to detect GitHub API errors.
    *   Specifically maps `401 Bad credentials` to HTTP 401 with a clear message: "GitHub Authentication Failed: Invalid or expired token."
    *   Maps `403 Rate Limit` to HTTP 403 with "GitHub API Rate Limit Exceeded".
2.  **Refactoring & Testing**:
    *   Moved generation logic to `server/src/controllers/generateController.ts`.
    *   Created comprehensive unit tests (`server/src/tests/generateController.test.ts`) using `vitest`.

### Client-Side
1.  **Detailed Error Feedback**:
    *   Updated `client/components/Dashboard.tsx` to parse error responses.
    *   Specific toast notifications for:
        *   **403**: "Permission Denied: Limit Reached"
        *   **401**: "GitHub Authentication Failed..." (Prompting re-login)
        *   **400**: "Validation Error"
2.  **Robust Username Retrieval**:
    *   Implemented `getUsername()` helper in `Dashboard.tsx` to fallback to `name` or `email` if `username` is missing.

## Verification & Testing

### Unit Tests
A new test suite `server/src/tests/generateController.test.ts` was created to verify all scenarios:

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| `should generate art successfully for new user` | Success (200) | ✅ Passed |
| `should return 403 if user reached limit` | Forbidden (403) | ✅ Passed |
| `should allow generation if limit reached but approved` | Success (200) | ✅ Passed |
| `should pass error... if Bad Credentials` | Unauthorized (401)* | ✅ Passed |

*Note: The test confirms the error is passed to middleware; middleware logic was verified via code review and manual reproduction.

### Manual Verification
*   **Scenario A (Limit Reached)**: User with 3 patterns receives "Permission Denied: Limit Reached" toast.
*   **Scenario B (Invalid Token)**: User with invalid token receives "GitHub Authentication Failed" toast.

## Conclusion
The persistent errors have been resolved. The system now provides clear, actionable feedback for usage limits and authentication failures. The codebase is more robust with added unit tests and centralized error handling.
