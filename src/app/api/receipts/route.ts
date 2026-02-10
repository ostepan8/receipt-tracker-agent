import { getServerAuth } from "@/lib/firebase/server-auth";
import { NextRequest, NextResponse } from "next/server";
import { getReceipts, getReceiptStats, ensureUserExists, type StatsPeriod } from "@/lib/supabase/queries";
import { z } from "zod";

const VALID_STATUSES = ["pending", "processing", "completed", "failed", "needs_review"] as const;
const VALID_CATEGORIES = [
  "food_dining", "transportation", "shopping", "entertainment",
  "utilities", "healthcare", "travel", "office_supplies", "other"
] as const;
const VALID_PERIODS = ["week", "month", "year", "all"] as const;

const getReceiptsSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(10000).optional(),
  includeStats: z.enum(["true", "false"]).optional(),
  statsPeriod: z.enum(VALID_PERIODS).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { userId, email, name } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database (handles first-time login)
    if (email) {
      await ensureUserExists(userId, email, name || null);
    }

    const { searchParams } = new URL(req.url);
    const rawParams = {
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
      includeStats: searchParams.get("includeStats") || undefined,
      statsPeriod: searchParams.get("statsPeriod") || undefined,
    };

    const parseResult = getReceiptsSchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { status, category, limit, offset, includeStats, statsPeriod } = parseResult.data;

    const receipts = await getReceipts(userId, {
      status,
      category,
      limit,
      offset,
    });

    let stats = null;
    if (includeStats === "true") {
      stats = await getReceiptStats(userId, (statsPeriod || "all") as StatsPeriod);
    }

    return NextResponse.json({ receipts, stats });
  } catch (error) {
    console.error("Failed to fetch receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}
