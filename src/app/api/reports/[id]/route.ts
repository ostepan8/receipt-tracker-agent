import { getServerAuth } from "@/lib/firebase/server-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getExpenseReport,
  updateExpenseReport,
  deleteExpenseReport,
  getReceipts,
} from "@/lib/supabase/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const report = await getExpenseReport(id, userId);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Fetch the actual receipts for this report
    const allReceipts = await getReceipts(userId);
    const reportReceipts = allReceipts.filter((r) =>
      report.receipt_ids.includes(r.id)
    );

    return NextResponse.json({ report, receipts: reportReceipts });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Only allow updating certain fields
    const allowedFields = ["title", "description", "status"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const report = await updateExpenseReport(id, userId, updates);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteExpenseReport(id, userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
