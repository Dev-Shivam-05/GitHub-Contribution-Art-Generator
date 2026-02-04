# GitHub Contribution Art Generator

This tool generates a GitHub Actions workflow (`committer.yml`) that paints a specific contribution pattern onto your GitHub profile graph.

## Overview

The tool takes a high-level pattern (e.g., "Every Sunday and Wednesday") and a start date, calculates the specific dates for the next year, and embeds them into a self-contained GitHub Actions workflow. This workflow, when triggered, will backdate commits to those specific dates.

## Usage

Run the generator using Node.js:

```bash
node workflow_generator.js --pattern "0,3,7" --start-date "2024-06-01" --intensity 5 --repo-root "./my-repo"
```

### Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `--pattern` | Comma-separated day offsets (0=Sunday, 1=Monday... 6=Saturday). | `0,3` (Sun, Wed) |
| `--start-date` | The start date for the 365-day cycle (ISO-8601). | `2024-06-01` |
| `--intensity` | Number of commits to generate per active day. | `5` |
| `--repo-root` | The target repository directory where `.github/` will be created. | `./out` |
| `--dry-run` | (Optional) Print the output to console without writing files. | |
| `--test` | (Optional) Run internal unit tests. | |

## How It Works

1.  **Pattern Parsing**: The tool interprets the `--pattern` argument (e.g., `0,3,7`) as days of the week.
    *   `0` or `7`: Sunday
    *   `1`: Monday
    *   ...
    *   `6`: Saturday
2.  **Date Expansion**: Starting from `start-date`, it iterates through the next 365 days. If a day matches the pattern, it is added to the schedule.
3.  **Workflow Generation**:
    *   It creates a list of commit objects `{"date": "YYYY-MM-DD", "message": "..."}`.
    *   This list is Base64 encoded and injected into the `committer.yml` template.
    *   The workflow uses `jq` to decode this list and execute `git commit` with `GIT_AUTHOR_DATE` set to the calculated dates.

## Outputs

*   `.github/workflows/committer.yml`: The GitHub Action file ready to be pushed.
*   `commit-plan.json`: A manifest listing all scheduled dates and commit counts for verification.

## Example

To generate a pattern for Mondays and Fridays starting Jan 1st, 2025 with 3 commits per day:

```bash
node workflow_generator.js --pattern "1,5" --start-date "2025-01-01" --intensity 3 --repo-root "."
```
