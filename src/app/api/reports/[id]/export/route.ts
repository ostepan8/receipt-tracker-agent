import { getServerAuth } from "@/lib/firebase/server-auth";
import { NextRequest, NextResponse } from "next/server";
import { getExpenseReport, getReceipts } from "@/lib/supabase/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    const report = await getExpenseReport(id, userId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Fetch receipts for this report
    const allReceipts = await getReceipts(userId);
    const receipts = allReceipts.filter((r) =>
      report.receipt_ids.includes(r.id)
    );

    if (format === "csv") {
      // Generate CSV with line items
      const headers = [
        "Date",
        "Merchant",
        "Address",
        "Item",
        "Item Category",
        "Quantity",
        "Unit Price",
        "Item Total",
        "Receipt Category",
        "Subtotal",
        "Tax",
        "Tip",
        "Total",
        "Payment Method",
      ];

      const rows: string[][] = [];

      for (const r of receipts) {
        const baseData = {
          date: r.transaction_date || "",
          merchant: r.merchant_name || "",
          address: r.merchant_address || "",
          receiptCategory: r.category
            ? EXPENSE_CATEGORIES[r.category as ExpenseCategory] || r.category
            : "",
          subtotal: r.subtotal?.toString() || "",
          tax: r.tax?.toString() || "",
          tip: r.tip?.toString() || "",
          total: r.total?.toString() || "",
          paymentMethod: r.payment_method || "",
        };

        if (r.line_items && r.line_items.length > 0) {
          // Add a row for each line item
          for (let i = 0; i < r.line_items.length; i++) {
            const item = r.line_items[i];
            rows.push([
              i === 0 ? baseData.date : "",
              i === 0 ? baseData.merchant : "",
              i === 0 ? baseData.address : "",
              item.name || "",
              item.category || "",
              item.quantity?.toString() || "1",
              item.unit_price?.toString() || "",
              item.total?.toString() || "",
              i === 0 ? baseData.receiptCategory : "",
              i === 0 ? baseData.subtotal : "",
              i === 0 ? baseData.tax : "",
              i === 0 ? baseData.tip : "",
              i === 0 ? baseData.total : "",
              i === 0 ? baseData.paymentMethod : "",
            ]);
          }
        } else {
          // No line items, add a single row for the receipt
          rows.push([
            baseData.date,
            baseData.merchant,
            baseData.address,
            "",
            "",
            "",
            "",
            "",
            baseData.receiptCategory,
            baseData.subtotal,
            baseData.tax,
            baseData.tip,
            baseData.total,
            baseData.paymentMethod,
          ]);
        }
      }

      // Add summary rows
      rows.push([]);
      rows.push(["", "", "", "", "", "", "", "", "", "", "", "Report Total:", report.total.toString(), ""]);
      rows.push([]);
      rows.push(["Category Breakdown"]);

      for (const [cat, amount] of Object.entries(report.category_breakdown)) {
        const categoryName =
          EXPENSE_CATEGORIES[cat as ExpenseCategory] || cat;
        rows.push([categoryName, "", "", "", "", "", "", amount.toString()]);
      }

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, "_")}_${report.date_from}_${report.date_to}.csv"`,
        },
      });
    }

    // For PDF, we'll return the data in a format the client can use
    // A more sophisticated implementation would use @react-pdf/renderer
    // For now, return structured data for client-side PDF generation
    return NextResponse.json({
      report: {
        ...report,
        receipts: receipts.map((r) => ({
          ...r,
          formatted_date: formatDate(r.transaction_date),
          formatted_total: formatCurrency(r.total, r.currency),
          category_name: r.category
            ? EXPENSE_CATEGORIES[r.category as ExpenseCategory] || r.category
            : "Uncategorized",
        })),
        formatted_total: formatCurrency(report.total),
        formatted_date_range: `${formatDate(report.date_from)} - ${formatDate(report.date_to)}`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}
