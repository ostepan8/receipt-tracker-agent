import { getServerAuth } from "@/lib/firebase/server-auth";
import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, type AnalyticsPeriod } from "@/lib/supabase/queries";
import { z } from "zod";

const analyticsSchema = z.object({
  period: z.enum(["week", "month", "year", "all"]).default("month"),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const parseResult = analyticsSchema.safeParse({
      period: searchParams.get("period") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid period. Must be week, month, year, or all." },
        { status: 400 }
      );
    }

    const { period } = parseResult.data;
    const analytics = await getAnalytics(userId, period as AnalyticsPeriod);

    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
