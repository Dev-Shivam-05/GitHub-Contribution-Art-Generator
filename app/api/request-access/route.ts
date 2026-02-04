import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const session = await getServerSession(authOptions);

    console.log("Request Access - Email from body:", email);
    console.log("Request Access - Session user:", session?.user);

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await dbConnect();

    // Case insensitive search
    const emailRegex = new RegExp(`^${email}$`, 'i');
    let user = await User.findOne({ email: { $regex: emailRegex } });

    // Auto-Fix: Upsert if not found but we have session data
    if (!user && session?.user?.email && session.user.email.toLowerCase() === email.toLowerCase()) {
      console.log("User not found. Attempting Auto-Fix Upsert...");
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const username = (session.user as any).username || session.user.name || email.split('@')[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accessToken = (session as any).accessToken;

      if (accessToken) {
        user = await User.findOneAndUpdate(
          { email: { $regex: emailRegex } },
          {
            email: session.user.email, // Ensure correct casing from session
            username,
            accessToken,
            accessRequested: true
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log("Auto-Fix Success: User created/updated.");
      } else {
        console.warn("Auto-Fix Failed: No access token in session.");
      }
    } else if (user) {
        // Normal update if user exists
        user.accessRequested = true;
        await user.save();
    }

    if (!user) {
      return NextResponse.json({ error: "User not found and auto-fix failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Request submitted" });
  } catch (error) {
    console.error("Request Access Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
