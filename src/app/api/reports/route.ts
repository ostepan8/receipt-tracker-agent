import { getServerAuth } from "@/lib/firebase/server-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getExpenseReports,
  createExpenseReport,
  getReceiptsInDateRange,
} from "@/lib/supabase/queries";
import { z } from "zod";

const VALID_CATEGORIES = [
  "food_dining", "transportation", "shopping", "entertainment",
  "utilities", "healthcare", "travel", "office_supplies", "other"
] as const;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createReportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  date_from: z.string().regex(dateRegex, "Must be YYYY-MM-DD format"),
  date_to: z.string().regex(dateRegex, "Must be YYYY-MM-DD format"),
  category: z.enum(VALID_CATEGORIES).optional(),
}).refine(
  (data) => new Date(data.date_from) <= new Date(data.date_to),
  { message: "Start date must be before or equal to end date", path: ["date_from"] }
);

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await getExpenseReports(userId);
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = createReportSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, date_from, date_to, category } = parseResult.data;

    // Get receipts in the date range
    const receipts = await getReceiptsInDateRange(
      userId,
      date_from,
      date_to,
      category
    );

    if (receipts.length === 0) {
      return NextResponse.json(
        { error: "No receipts found in the specified date range" },
        { status: 400 }
      );
    }

    const receiptIds = receipts.map((r) => r.id);

    const report = await createExpenseReport(userId, {
      title,
      description,
      date_from,
      date_to,
      receipt_ids: receiptIds,
    });

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
