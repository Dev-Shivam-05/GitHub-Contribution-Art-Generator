import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
