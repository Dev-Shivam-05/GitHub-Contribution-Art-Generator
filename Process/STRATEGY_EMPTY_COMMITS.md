# Strategy: Empty Temporal Commits

This document defines the strategy for using **Empty Temporal Commits**—Git commits that contain no file changes (`--allow-empty`) but carry specific metadata (timestamps, messages).

## 1. Concept & Rationale
An empty commit creates a node in the Git graph without altering the project's file tree. When combined with custom timestamps, this technique becomes a powerful tool for meta-operations.

### The Command Pattern
```bash
GIT_COMMITTER_DATE="<ISO8601>" git commit --allow-empty -m "<MESSAGE>" --date="<ISO8601>"
```

### Key Components
1.  **`--allow-empty`**: Forces Git to create a commit object even though the staging area matches HEAD.
2.  **`--date="..."`**: Sets the `GIT_AUTHOR_DATE` (when the code was "written").
3.  **`GIT_COMMITTER_DATE`**: Environment variable that sets when the commit was "applied".
    *   *Critical:* Both must be set to avoid "historical drift" (e.g., Author Date in 2020, Committer Date in 2024).

## 2. Use Cases

### A. CI/CD Pipeline Triggers
*   **Scenario:** You need to re-run a deployment pipeline without changing code (e.g., to pick up new environment variables or clear a cache).
*   **Strategy:** Push an empty commit.
*   **Message Convention:** `ci: trigger deployment [skip ci]` (or inverse).

### B. Milestone Markers
*   **Scenario:** marking a point in time (e.g., "Phase 1 Complete") without creating a tag or modifying artifacts.
*   **Strategy:** Empty commit with a timestamp aligned to the milestone completion.

### C. Testing Git Hooks
*   **Scenario:** Verifying `pre-commit` or `commit-msg` hooks without dirtying the file tree.
*   **Strategy:** Rapid iteration of empty commits to test regex validation in hooks.

### D. Historical Backfilling (The "Blacksmith" Use Case)
*   **Scenario:** Restoring contribution history for work done outside the current repo.
*   **Strategy:** Generate a sequence of empty commits with backdated timestamps.

## 3. Implementation Requirements

### 3.1 Validation
Before execution, the tool must verify:
*   **Repository State:** Must be inside a valid work tree (`git rev-parse --is-inside-work-tree`).
*   **Clean State (Optional):** While empty commits don't require a clean working tree, it is best practice to warn if uncommitted changes exist.

### 3.2 Timestamp Formatting (ISO 8601)
Git is flexible, but ISO 8601 is strict.
*   **Format:** `YYYY-MM-DDTHH:MM:SS+HH:MM`
*   **Example:** `2024-01-01T10:00:00+00:00`
*   **Recommendation:** Always include timezone offset to prevent ambiguity.

### 3.3 Error Handling
*   **Invalid Date:** Reject malformed strings before calling Git.
*   **Lock Contention:** Handle `.git/index.lock` errors gracefully (retry logic).
*   **Detached HEAD:** Warn the user if committing to a detached HEAD (commits may be lost).

## 4. Compatibility & Limitations

| Git Version | Compatibility | Notes |
| :--- | :--- | :--- |
| < 2.0 | High | Basic flags exist since early versions. |
| 2.x | Full | Improved date parsing and hook support. |
| Windows | Full | PowerShell/CMD require env var setting syntax (Use `set` or `$env:`). |

**Implication of History Modification:**
*   Backdated commits do **not** rewrite existing history; they append to it.
*   They will appear chronologically "in the past" in `git log --sort=date`, but topologically "most recent" in the graph structure.

## 5. Verification Steps

To confirm the commit was created correctly:

1.  **Check the Log (Fuller):**
    ```bash
    git log -1 --format=fuller
    ```
    *Look for `AuthorDate` and `CommitDate`. They should match.*

2.  **Check the Tree:**
    ```bash
    git diff HEAD^ HEAD
    ```
    *Should return no output (empty diff).*

3.  **Check the Raw Object:**
    ```bash
    git cat-file -p HEAD
    ```
    *Verify the timestamp integers in the header.*
