import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken } from "@/lib/firebase/server-auth";

// Set the session cookie
export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Verify the token using public keys
    const decoded = await verifyIdToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set("firebase-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour (tokens expire, will be refreshed)
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}

// Clear the session cookie
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("firebase-token");
  return NextResponse.json({ success: true });
}
