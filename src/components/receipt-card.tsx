"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, AlertTriangle } from "lucide-react";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  type Receipt as ReceiptType,
  type ExpenseCategory,
} from "@/lib/types";

interface ReceiptCardProps {
  receipt: ReceiptType;
  compact?: boolean;
  showReviewBadge?: boolean;
}

export function ReceiptCard({ receipt, compact = false, showReviewBadge = false }: ReceiptCardProps) {
  const categoryColor = receipt.category
    ? CATEGORY_COLORS[receipt.category as ExpenseCategory]
    : "#6b7280";

  if (compact) {
    return (
      <Link href={`/dashboard/receipts/${receipt.id}`}>
        <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[var(--brand-cream)] transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${categoryColor}15` }}
            >
              <Receipt className="h-4 w-4" style={{ color: categoryColor }} />
            </div>
            <div>
              <p className="font-medium text-sm text-[var(--brand-black)] truncate max-w-[200px] group-hover:text-[var(--brand-orange)] transition-colors">
                {receipt.merchant_name || "Unknown Merchant"}
              </p>
              <p className="text-xs text-[var(--brand-gray)]">
                {formatRelativeDate(receipt.transaction_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {receipt.is_duplicate && (
              <AlertTriangle className="h-4 w-4 text-[var(--brand-orange)]" />
            )}
            <span className="font-semibold text-sm text-[var(--brand-black)] tabular-nums">
              {formatCurrency(receipt.total)}
            </span>
            <StatusBadge status={receipt.status} small />
          </div>
        </div>
      </Link>
    );
  }

  const needsReview = receipt.status === "needs_review" || showReviewBadge;

  return (
    <Link href={`/dashboard/receipts/${receipt.id}`}>
      <Card className={`hover:shadow-lg transition-all cursor-pointer border-[var(--brand-black)]/5 rounded-2xl ${needsReview ? "border-[var(--brand-orange)]/20 bg-[var(--brand-orange)]/5" : ""}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                style={{ backgroundColor: `${categoryColor}15` }}
              >
                <Receipt className="h-6 w-6" style={{ color: categoryColor }} />
                {needsReview && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--brand-orange)] rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-[var(--brand-black)] truncate max-w-[180px]">
                  {receipt.merchant_name || "Unknown Merchant"}
                </p>
                <p className="text-sm text-[var(--brand-gray)]">
                  {formatRelativeDate(receipt.transaction_date)}
                </p>
              </div>
            </div>
            <StatusBadge status={receipt.status} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              {receipt.category && (
                <Badge variant="outline" className="text-xs border-[var(--brand-black)]/10 text-[var(--brand-gray)]">
                  {EXPENSE_CATEGORIES[receipt.category as ExpenseCategory] ||
                    receipt.category}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {receipt.is_duplicate && (
                <Badge variant="destructive" className="text-xs">
                  Duplicate
                </Badge>
              )}
              <span className="font-bold text-xl text-[var(--brand-black)]">
                {formatCurrency(receipt.total)}
              </span>
            </div>
          </div>

          {receipt.agent_notes && (
            <p className="text-xs text-[var(--brand-gray)] mt-3 line-clamp-2">
              {receipt.agent_notes}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function StatusBadge({
  status,
  small = false,
}: {
  status: string;
  small?: boolean;
}) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    completed: "default",
    processing: "secondary",
    pending: "outline",
    needs_review: "secondary",
    failed: "destructive",
  };

  const labels: Record<string, string> = {
    completed: "Done",
    processing: "Processing",
    pending: "Pending",
    needs_review: "Review",
    failed: "Failed",
  };

  return (
    <Badge
      variant={variants[status] || "outline"}
      className={small ? "text-xs px-1.5 py-0" : ""}
    >
      {labels[status] || status}
    </Badge>
  );
}
