import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await dbConnect();

    // Use findById for robustness as we are passing the ID from the admin panel
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        accessRequested: false,
        $inc: { credits: 1 } 
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Credit granted" });
  } catch (error) {
    console.error("Admin Approve Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
