# 🎨 GitHub Contribution Art Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Built%20With-Next.js-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)

**The ultimate tool to customize your GitHub Profile.**  
Stop having a boring contribution graph. Draw logos, patterns, or text instantly using automation.

🔗 **Live Demo:** [https://View-Live.app](https://git-hub-contribution-art-generator.vercel.app/admin)  
👤 **Author:** [Shivam Bhadoriya](https://www.linkedin.com/in/shivam-bhadoriya-dev/)

## 🚀 Features

- **Pixel Art Editor:** Draw anything on a grid.
- **Auto-Alignment:** Automatically aligns your art to Sunday (no timezone bugs!).
- **One-Click Deploy:** Uses GitHub Actions to paint your graph in background.
- **Analytics:** Track your generations.
- **Credit System:** Fair usage limits to prevent spam.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TailwindCSS, Lucide Icons.
- **Backend:** NextAuth.js, MongoDB (Mongoose), GitHub API (Octokit).
- **Infrastructure:** Vercel, GitHub Actions.

## 🤝 Contributing

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---
*Created with ❤️ by Dev-Shivam-05*  

### 🎯 **System Architecture & Tech Stack**

This system automates the entire workflow from user input to a visible GitHub contribution graph pattern.

| **Layer** | **Technology** | **Purpose** | **Why It's Free** |
| :--- | :--- | :--- | :--- |
| **Frontend (UI/UX)** | Next.js (React), Tailwind CSS, shadcn/ui | User dashboard for input & visualization | Open-source frameworks & component libraries. |
| **Authentication** | Auth.js (NextAuth.js) | Secure "Login with GitHub" & token management. | Open-source library; uses GitHub's free OAuth. |
| **Backend Server** | Node.js with Express | Orchestrates logic & communicates with GitHub API. | Open-source runtime and framework. |
| **Database** | MongoDB Atlas | Stores user profiles, pattern jobs, and schedules. | Free tier (512MB to 5GB storage). |
| **GitHub Automation** | GitHub REST API & Octokit.js | Creates repos, commits, and triggers workflows. | Part of free GitHub accounts. |
| **Admin Panel** | AdminJS | Central dashboard to view all users and their data. | Open-source admin framework. |

---

### ⚙️ **Core Implementation: The Automation Engine**

The system's intelligence lies in these three automated processes.

#### **1. Pattern-to-Grid Logic Processor**
This engine translates a word (e.g., "NURUL") into a pixel art map on GitHub's 7x53 grid and schedules the commits.
```javascript
// Example Logic for the 'N' in "NURUL"
function generateLetterMap(letter, startWeekIndex) {
    // Define letter as a 7x5 pixel matrix (simplified)
    const letterMaps = {
        'N': [
            [1, 0, 0, 0, 1],
            [1, 1, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 1, 1],
            [1, 0, 0, 0, 1]
        ]
    };
    const map = letterMaps[letter];
    const commitSchedule = [];

    // Convert matrix to grid coordinates and dates
    for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
            if (map[row][col] === 1) {
                // Calculate the exact date
                const daysFromStart = (startWeekIndex * 7) + col;
                const commitDate = new Date(userStartDate);
                commitDate.setDate(commitDate.getDate() + daysFromStart);

                // Add commits based on user's chosen intensity
                for (let c = 0; c < userCommitIntensity; c++) {
                    commitSchedule.push({
                        date: commitDate.toISOString().split('T')[0],
                        message: `Artistic commit for ${letter}`
                    });
                }
            }
        }
    }
    return commitSchedule;
}
```

#### **2. GitHub API Automator (Backend)**
This Node.js module uses the user's GitHub token to perform all actions on their behalf.
```javascript
const { Octokit } = require("@octokit/rest");

async function automateGitHubProcess(userToken, patternSchedule) {
    const octokit = new Octokit({ auth: userToken });

    // 1. Create a new private repository
    const repo = await octokit.repos.createForAuthenticatedUser({
        name: `github-art-${Date.now()}`,
        private: true,
        auto_init: true // Creates a README
    });

    // 2. Create the GitHub Actions workflow file
    const workflowContent = generateWorkflowYAML(patternSchedule);
    await octokit.repos.createOrUpdateFileContents({
        owner: userLogin,
        repo: repo.data.name,
        path: '.github/workflows/generate_art.yml',
        message: 'Add art generation workflow',
        content: Buffer.from(workflowContent).toString('base64')
    });

    // 3. Manually trigger the workflow
    await octokit.actions.createWorkflowDispatch({
        owner: userLogin,
        repo: repo.data.name,
        workflow_id: 'generate_art.yml',
        ref: 'main'
    });
}
```

#### **3. Dynamic GitHub Actions Workflow Generator**
This creates the YAML file that the automation engine commits to the new repo. The workflow uses backdated commits to paint the pattern.
```yaml
name: Generate Contribution Art
on:
  workflow_dispatch: # Triggered by the API call above

jobs:
  paint-art:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Configure Git
        run: |
          git config user.name "GitHub Art Bot"
          git config user.email "bot@noreply.github.com"

      - name: Create pattern commits
        run: |
          # Loop through the pre-calculated commit schedule
          # This would be dynamically generated by your backend
          COMMIT_SCHEDULE='[{"date":"2026-03-01","message":"N commit 1"},{"date":"2026-03-01","message":"N commit 2"}]'
          echo $COMMIT_SCHEDULE | jq -c '.[]' | while read commit; do
            DATE=$(echo $commit | jq -r '.date')
            MSG=$(echo $commit | jq -r '.message')
            # Set the commit date in the past/future
            GIT_AUTHOR_DATE="$DATE 12:00:00" GIT_COMMITTER_DATE="$DATE 12:00:00" \
            git commit --allow-empty -m "$MSG"
          done

      - name: Push all commits
        run: |
          git push origin main
```

### 👤 **End-to-End User Journey**
Here is the seamless experience a user will have, powered by the automation above:
1.  **Login**: Clicks **"Sign in with GitHub"** on your site, granting your app the necessary `repo` and `workflow` permissions.
2.  **Design**: On the dashboard, inputs:
    *   **Text**: `NURUL`
    *   **Start Date**: `2026-03-01` (via a calendar picker)
    *   **Intensity**: `3 commits/day` (via a slider)
3.  **Create**: Clicks **"Create My Art"**. A loading animation shows progress.
4.  **Result**: Within 2 minutes, receives a success message with a link to their **new GitHub repository** and can immediately see the pattern forming on their profile's 2026 contribution graph.

### 📊 **Admin Data Panel (For HR Insights)**
Using **AdminJS**, you can build a powerful dashboard to view all users and their data.
*   **Setup**: Integrate AdminJS with your Express backend and MongoDB.
*   **Data Captured**: For each user, store their GitHub username, profile link, pattern history (showing creativity/consistency), and technical preferences (commit intensity, project count).
*   **HR Value**: This dataset allows you to identify developers who are proactive about their profiles, understand aesthetic design (from pattern choices), and engage with new tools—valuable signals for recruitment.

### 🚀 **Getting Started: Implementation Roadmap**
To build this, follow these steps in order:

1.  **Scaffold the Project**: `npx create-next-app@latest github-art-generator` and choose the options with TypeScript and Tailwind CSS.
2.  **Implement Authentication**: Set up Auth.js with the GitHub provider as shown in the search results. This is the gateway to getting user permissions.
3.  **Build the Core Engine**: Create the backend module (`patternLogic.js` and `githubAutomator.js`) containing the code logic outlined above.
4.  **Develop the UI**: Using a component library like **shadcn/ui**, build the input form and user dashboard.
5.  **Deploy**: Host the full-stack application for free on **Vercel** (Next.js/Serverless) and **Railway** (Node.js Backend/MongoDB).
6.  **Monitor**: Use **Vercel Analytics** and **Railway Monitoring** to track user activity and performance.
7.  **Optimize**: Based on analytics, fine-tune the user experience and backend logic.
8.  **Scale**: As user demand grows, monitor resource usage and scale your services accordingly.
9.  **Maintain**: Regularly update dependencies, fix bugs, and ensure the security of your application.
10. **Launch**: Once you're satisfied with the performance and features, announce the launch to the community.
11. **Grow**: Encourage users to share their patterns, suggest improvements, and contribute to the project.
12. **Monitor**: Continuously monitor user feedback and adjust the platform as needed.
13. **Scale**: If user numbers double, ensure your services can handle the increased load.
14. **Optimize**: Continuously monitor and optimize the performance of your application.
15. **Monitor**: Regularly check for security vulnerabilities and keep your dependencies up-to-date.`
16. **Stay Updated**: Keep abreast of new features in Next.js, Auth.js, and other libraries to ensure your application is always secure and performant.
