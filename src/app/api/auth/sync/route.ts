import { NextResponse } from "next/server";
import { getAuthFromHeader } from "@/lib/firebase/server-auth";
import { upsertUser } from "@/lib/supabase/queries";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const { userId, email, name } = await getAuthFromHeader(authHeader);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email not found in token" }, { status: 400 });
    }

    // Sync to Supabase database
    await upsertUser({
      id: userId,
      email: email,
      name: name || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
