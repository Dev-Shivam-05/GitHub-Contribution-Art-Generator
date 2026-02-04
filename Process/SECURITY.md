# Security & Ethics: Project Blacksmith

## 1. Ethical Mandate
Automating GitHub contributions is a controversial practice. Critics argue it devalues "real" work.
**Blacksmith's Stance:**
*   **Art, not Deception:** When used to create visual patterns (pixel art) on the contribution graph, it is a form of digital expression.
*   **Tooling, not Cheating:** When used to backfill legitimate work that was done off-platform (e.g., local development, private servers), it restores historical accuracy.
*   **Vanity (The Gray Area):** Using it solely to appear "active" without underlying work is discouraged but technically possible.

## 2. GitHub Terms of Service (ToS) Compliance
*   **Platform Abuse:** GitHub's ToS prohibits "excessive" API usage that degrades service. Blacksmith mitigates this by working primarily with **local Git history** and pushing in compressed batches, minimizing API API load.
*   **Content Policy:** Commits generated are "empty" or contain benign text. No malicious content is generated.
*   **False Representation:** Users assume liability for how they represent their activity. Blacksmith is a neutral tool.

## 3. Security Architecture
*   **No Credential Storage:** Blacksmith does **not** store GitHub passwords. It relies on the user's existing SSH agent or properly configured local `.gitconfig`.
*   **Token Safety:** If a Personal Access Token (PAT) is used for API verification, it is accepted only via environment variable (`GITHUB_TOKEN`) and never written to disk.
*   **Execution Safety:**
    *   **Dry Run Mode:** All destructive actions (commits, pushes) can be simulated first.
    *   **Repo Isolation:** Blacksmith checks if the current directory is a Git repository and requires explicit confirmation before modifying history.
