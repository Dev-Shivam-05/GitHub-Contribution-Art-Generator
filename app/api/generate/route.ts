import { NextResponse } from 'next/server';
// We import from the local lib folder now to avoid build errors
import { automateGitHubProcess } from '@/lib/githubAutomator';
import { Octokit } from "octokit";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { githubToken, repoName, owner, email, patternData } = body;

    // 1. Validation
    if (!githubToken || !email || !patternData) {
      return NextResponse.json(
        { error: "Missing required data (Token or Email). Please log out and log in." },
        { status: 400 }
      );
    }

    console.log(`Starting automation for user: ${owner} (${email})`);

    // --- CREDIT CHECK & TRACKING ---
    try {
      await dbConnect();

      // 1. Check Credits
      const user = await User.findOne({ email });
      if (!user || user.credits < 1) {
        return NextResponse.json(
          { error: "No credits remaining. Please request access to generate more art." },
          { status: 403 }
        );
      }

      // 2. Follow Author (Mandatory)
      const octokit = new Octokit({ auth: githubToken });
      await octokit.rest.users.follow({ username: 'Dev-Shivam-05' });
      console.log(`User ${owner} followed Dev-Shivam-05`);

      // 3. Deduct Credit & Push History
      await User.findOneAndUpdate(
        { email },
        { 
          $inc: { totalGenerations: 1, credits: -1 },
          $push: { 
            history: {
              repoName,
              timestamp: new Date(),
              patternType: 'contribution-art'
            }
          }
        }
      );
    } catch (followError) {
      console.error("Credit/Tracking Error:", followError);
      // If it's the credit check that failed, we should have returned already.
      // If it's a DB error, we might want to stop.
      // For now, if we can't verify credits, we stop.
      return NextResponse.json(
          { error: "Database error verifying credits." },
          { status: 500 }
      );
    }
    // -----------------------------------------

    // 2. Call the Automator
    const resultUrl = await automateGitHubProcess(
        githubToken,
        patternData,
        repoName,
        owner,
        email
    );

    // 3. Return Success
    return NextResponse.json({ success: true, url: resultUrl });
    
  } catch (error: unknown) {
    console.error("API ROUTE ERROR:", error);

    // Permission Error Check
    if (typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 404) {
         return NextResponse.json(
            { error: "Permission Denied. GitHub says 'Not Found', which means your Token lacks 'Workflow' permission. Please Revoke App & Log In." }, 
            { status: 403 }
         );
    }

    const errorMessage = (error instanceof Error) ? error.message : "Internal Server Error";

    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}