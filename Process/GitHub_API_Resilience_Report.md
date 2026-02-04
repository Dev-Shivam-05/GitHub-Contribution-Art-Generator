# GitHub API Resilience & Connectivity Report

## 1. Issue Diagnosis: "Service Temporarily Unavailable"
**Symptoms:**
- Application returns 503 errors during art generation.
- Circuit Breaker enters OPEN state prematurely.
- Users see generic error messages without actionable details.

**Root Cause Analysis:**
1.  **Strict Timeouts:** The initial `Octokit` request timeout (10s) was insufficient for complex operations like repository creation and workflow propagation, leading to client-side timeouts treated as failures.
2.  **Lack of Retry Logic:** Transient network glitches or GitHub API rate limits (403/429) immediately failed the request, counting towards the failure threshold.
3.  **Circuit Breaker Misconfiguration:** A new Circuit Breaker instance was created for *every request*, preventing it from tracking aggregate health state. Effectively, the breaker was stateless and useless for protection, only serving to mask errors via its fallback.
4.  **Error Masking:** The fallback mechanism swallowed original error details, returning a generic "Service Unavailable" message that made debugging impossible.

## 2. Implemented Solutions

### A. robust Retry Mechanism (Exponential Backoff)
We implemented a `withRetry` helper in `server/src/githubAutomator.ts` that:
- **Retries** on network errors, 5xx server errors, 403 (Rate Limit), and 429 (Too Many Requests).
- **Backoff Strategy:** Initial delay of 1000ms, doubling with each attempt (jittered), up to 5 retries.
- **Rate Limit Awareness:** Logs `x-ratelimit-remaining` and `retry-after` headers to console.

### B. Circuit Breaker Architecture
- **Singleton Pattern:** Refactored `server/src/utils/circuitBreaker.ts` to export a singleton `getGitHubBreaker()`. This ensures failure counts are aggregated across all user requests.
- **Tuned Thresholds:**
  - `timeout`: 60s (up from default 10s logic) to accommodate long GitHub operations.
  - `volumeThreshold`: 5 (Breaker only opens if at least 5 requests occur in the window).
  - `resetTimeout`: 30s (Time before attempting a half-open trial).
- **Smart Fallback:** The fallback now distinguishes between:
  - **Circuit Breaker Open:** Returns "Service Temporarily Unavailable (Circuit Breaker Open)".
  - **Execution Failure:** Returns the specific error message (e.g., "Bad Credentials") and the original error object.

### C. Error Handling & Transparency
- **Client-Side:** `Dashboard.tsx` now displays the specific error cause if available (e.g., "Service Unavailable (Circuit Breaker Open)").
- **Server-Side:** Middleware captures and logs the exact error chain.

## 3. Monitoring & Verification

### Logs to Watch
Monitor the server logs for the following patterns:
- `GitHub Rate Limit Remaining: <N>` - Indicates API usage pressure.
- `GitHub Retry-After: <N>s` - Indicates forced throttling.
- `Circuit Breaker OPEN: github-automation` - Indicates the system has paused requests due to high failure rate.
- `Circuit Breaker Blocked Request` - Indicates requests being rejected fast-fail.

### Automated Testing
A new load test suite `server/src/tests/circuitBreakerLoad.test.ts` has been added to verify:
1.  **Failure Threshold:** Simulates 5 failures to confirm the breaker opens.
2.  **Fast Fail:** Confirms subsequent requests fail immediately without hitting GitHub.
3.  **Recovery:** Confirms the breaker allows a request through after `resetTimeout` (Half-Open state).

## 4. Future Recommendations
- **Queue System:** For high-volume generation, implement a persistent job queue (e.g., BullMQ) to decouple user requests from immediate GitHub execution.
- **Multiple Tokens:** If rate limits become a bottleneck, implement round-robin token rotation.
