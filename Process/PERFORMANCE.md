# Performance Benchmarks: Project Blacksmith

## 1. Benchmarking Methodology
To validate the "Architecture of a Weapon," we subject Blacksmith to stress tests simulating extreme usage scenarios.

**Test Environment:**
*   **CPU:** Virtualized Single Core
*   **Disk:** SSD (IOPS limited)
*   **Git Version:** 2.x
*   **Python:** 3.9+

## 2. Throughput Targets

| Metric | Target | Rationale |
| :--- | :--- | :--- |
| **Pattern Generation** | < 50ms | Mathematical calculation should be near-instant. |
| **Commit Speed (Local)** | > 100 commits/sec | `subprocess` overhead is the bottleneck. |
| **Push Speed** | Network Dependent | Git protocol efficiency handles bulk refs well. |
| **API Verification** | < 500ms/req | Limited by GitHub API latency. |

## 3. Scalability Test (Simulation)
**Scenario:** "The 10-Year Architect"
*   **Pattern:** Binary `101`
*   **Duration:** 10 Years (3650 days)
*   **Total Commits:** ~1825 commits

**Estimated Performance:**
*   **Generation:** 0.02s
*   **Git Execution:** ~18s (at 100 commits/sec)
*   **Push:** ~5s (single compressed packfile)

## 4. Optimization Techniques
*   **Batching:** Commits are generated in memory and batched to `subprocess` where possible (though `git commit` is atomic).
*   **No-Checkout:** We use `--allow-empty` to avoid touching the working tree (filesystem I/O), which is 10x faster than modifying files.
*   **Environment Injection:** Using `os.environ` for date overrides avoids shell parsing overhead.
