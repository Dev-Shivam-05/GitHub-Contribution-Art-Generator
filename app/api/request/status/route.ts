import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const user = await User.findOne({ username });
    
    // If user doesn't exist yet (e.g. first login), return defaults
    if (!user) {
      return NextResponse.json({ 
        success: true, 
        credits: 0, 
        accessRequested: false 
      });
    }

    return NextResponse.json({
      success: true,
      credits: user.credits ?? 0,
      accessRequested: user.accessRequested ?? false,
    });
  } catch (error) {
    console.error("Status check failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
