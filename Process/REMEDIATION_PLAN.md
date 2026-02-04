# Remediation Plan

## Phase 1: Immediate Stabilization (Completed)
- [x] **Restore Server Core**: Recreate missing `src` files and fix build scripts (`tsx`).
- [x] **Fix Critical Rendering**: Resolve Next.js hydration mismatch in `RootLayout`.
- [x] **Secure Admin Access**: Audit and flag hardcoded credentials; implement UI redesign for accessibility.
- [x] **Enhance UX**: Enable Undo/Redo and Live Previews in Dashboard.

## Phase 2: Reliability & Monitoring (In Progress)
- [x] **Error Handling**: Deploy centralized `errorHandler` middleware and structured `logger`.
- [ ] **Sentry Integration**: Configure Sentry DSN for real-time crash reporting (Requires API Key).
- [ ] **Circuit Breakers**: Implement `opossum` or similar for GitHub API calls to prevent cascading failures.

## Phase 3: Testing & QA (Next Steps)
- [ ] **Unit Tests**: Complete coverage for `patternLogic.ts` (Started).
- [ ] **Integration Tests**: Test `/api/generate` with mock DB.
- [ ] **E2E Tests**: Cypress flow for "Login -> Generate -> Admin Approve".

## Phase 4: Security & Compliance
- [ ] **RBAC**: Implement true Role-Based Access Control in DB (User roles: 'user', 'admin').
- [ ] **WCAG Audit**: Run Axe DevTools on new Admin UI to ensure 100% compliance.
- [ ] **Rate Limiting**: Add Redis-based rate limiting to API endpoints.
