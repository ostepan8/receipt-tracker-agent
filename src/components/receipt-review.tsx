"use client";

import { useState } from "react";
import { ZoomableImage } from "@/components/zoomable-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Receipt as ReceiptIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  ITEM_CATEGORY_COLORS,
  PRICE_RATINGS,
  type Receipt,
  type ExtractedReceiptData,
  type ExpenseCategory,
  type ItemCategory,
  type PriceRating,
  type ReviewableField,
  type LineItem,
} from "@/lib/types";

interface ReceiptReviewProps {
  receipt: Partial<Receipt>;
  extractedData?: ExtractedReceiptData;
  imageUrl?: string | null;
  reviewFlags: ReviewableField[];
  /** Called when receipt data changes, for parent to track current state */
  onDataChange?: (updatedReceipt: Partial<Receipt>) => void;
}

export function ReceiptReview({
  receipt,
  extractedData,
  imageUrl,
  reviewFlags,
  onDataChange,
}: ReceiptReviewProps) {
  const [editedReceipt, setEditedReceipt] = useState<Partial<Receipt>>({
    merchant_name: receipt.merchant_name || extractedData?.merchant_name || "",
    merchant_address: receipt.merchant_address || extractedData?.merchant_address || "",
    transaction_date: receipt.transaction_date || extractedData?.transaction_date || "",
    subtotal: receipt.subtotal ?? extractedData?.subtotal ?? null,
    tax: receipt.tax ?? extractedData?.tax ?? null,
    tip: receipt.tip ?? extractedData?.tip ?? null,
    total: receipt.total ?? extractedData?.total ?? null,
    category: receipt.category || null,
    line_items: receipt.line_items || extractedData?.line_items || [],
  });
  const [showAllItems, setShowAllItems] = useState(false);

  const updateField = (field: keyof Receipt, value: unknown) => {
    setEditedReceipt((prev) => {
      const updated = { ...prev, [field]: value };
      onDataChange?.(updated);
      return updated;
    });
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: unknown) => {
    setEditedReceipt((prev) => {
      const items = [...(prev.line_items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, line_items: items };
    });
  };

  const needsReviewBadge = (field: ReviewableField) => reviewFlags.includes(field);

  const lineItems = editedReceipt.line_items || [];
  const visibleItems = showAllItems ? lineItems : lineItems.slice(0, 3);
  const hasMoreItems = lineItems.length > 3;

  return (
    <div className="flex flex-col md:flex-row h-full md:h-auto">
      {/* Left - Image (full width on mobile, fixed width on desktop) */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-slate-100 md:border-r border-slate-200">
        <div className="h-64 md:h-[calc(90vh-60px)]">
          {imageUrl ? (
            <ZoomableImage
              src={imageUrl}
              alt="Receipt"
              aspectRatio="h-full w-full"
              className="rounded-none"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ReceiptIcon className="h-10 w-10 mb-2" />
              <p className="text-sm">No image</p>
            </div>
          )}
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 md:p-6 space-y-5">
          {/* Review Banner */}
          {reviewFlags.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                Review flagged: <span className="font-medium">{reviewFlags.map((f) => f.replace(/_/g, " ")).join(", ")}</span>
              </p>
            </div>
          )}

          {/* Merchant & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-slate-500 mb-2 block">Merchant</Label>
              <Input
                value={editedReceipt.merchant_name || ""}
                onChange={(e) => updateField("merchant_name", e.target.value)}
                placeholder="Merchant name"
                className={cn(
                  "h-10",
                  needsReviewBadge("merchant_name") && "border-amber-400 bg-amber-50"
                )}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-500 mb-2 block">Date</Label>
              <Input
                type="date"
                value={editedReceipt.transaction_date || ""}
                onChange={(e) => updateField("transaction_date", e.target.value)}
                className={cn(
                  "h-10",
                  needsReviewBadge("transaction_date") && "border-amber-400 bg-amber-50"
                )}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs font-medium text-slate-500 mb-2 block">Category</Label>
            <Select
              value={editedReceipt.category || ""}
              onValueChange={(value) => updateField("category", value)}
            >
              <SelectTrigger className={cn("h-10", needsReviewBadge("category") && "border-amber-400 bg-amber-50")}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {/* Include current category if it's not in the predefined list */}
                {editedReceipt.category && !EXPENSE_CATEGORIES[editedReceipt.category] && (
                  <SelectItem key={editedReceipt.category} value={editedReceipt.category}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[editedReceipt.category as ExpenseCategory] }}
                      />
                      {editedReceipt.category}
                    </div>
                  </SelectItem>
                )}
                {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[key as ExpenseCategory] }}
                      />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-medium text-slate-500 mb-2 block">Subtotal</Label>
              <Input
                type="number"
                step="0.01"
                value={editedReceipt.subtotal ?? ""}
                onChange={(e) => updateField("subtotal", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
                className={cn("h-10", needsReviewBadge("subtotal") && "border-amber-400 bg-amber-50")}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-500 mb-2 block">Tax</Label>
              <Input
                type="number"
                step="0.01"
                value={editedReceipt.tax ?? ""}
                onChange={(e) => updateField("tax", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
                className={cn("h-10", needsReviewBadge("tax") && "border-amber-400 bg-amber-50")}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-500 mb-2 block">Total</Label>
              <Input
                type="number"
                step="0.01"
                value={editedReceipt.total ?? ""}
                onChange={(e) => updateField("total", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
                className={cn("h-10 font-semibold", needsReviewBadge("total") && "border-amber-400 bg-amber-50")}
              />
            </div>
          </div>

          {/* Line Items */}
          {lineItems.length > 0 && (
            <div>
              <Label className="text-xs font-medium text-slate-500 mb-3 block">
                Items ({lineItems.length})
              </Label>
              <div className="space-y-2">
                {visibleItems.map((item, index) => (
                  <LineItemRow
                    key={index}
                    item={item}
                    onUpdate={(field, value) => updateLineItem(index, field, value)}
                  />
                ))}

                {hasMoreItems && (
                  <button
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    {showAllItems ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show {lineItems.length - 3} more items
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* AI Notes */}
          {receipt.agent_notes && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700 leading-relaxed">{receipt.agent_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LineItemRow({
  item,
  onUpdate,
}: {
  item: LineItem;
  onUpdate: (field: keyof LineItem, value: unknown) => void;
}) {
  const priceRating = item.price_rating as PriceRating | undefined;
  const ratingInfo = priceRating ? PRICE_RATINGS[priceRating] : null;
  const categoryColor = item.category ? ITEM_CATEGORY_COLORS[item.category as ItemCategory] : "#6b7280";

  return (
    <div className="group p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-3">
        {/* Category dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: categoryColor }}
        />

        {/* Name - takes most space */}
        <input
          value={item.name || ""}
          onChange={(e) => onUpdate("name", e.target.value)}
          placeholder="Item name"
          className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none min-w-0"
        />

        {/* Price */}
        <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
          {formatCurrency(item.total || 0)}
        </span>
      </div>

      {/* Description & Rating */}
      {(item.description || ratingInfo) && (
        <div className="mt-1.5 ml-5 flex items-center gap-2 text-xs text-slate-500">
          {ratingInfo && (
            <span className="flex items-center gap-1" style={{ color: ratingInfo.color }}>
              {ratingInfo.emoji} {ratingInfo.label}
            </span>
          )}
          {ratingInfo && item.price_note && <span className="text-slate-300">·</span>}
          {item.price_note && <span className="text-slate-400">{item.price_note}</span>}
        </div>
      )}
      {item.description && !item.price_note && (
        <p className="mt-1 ml-5 text-xs text-slate-400">{item.description}</p>
      )}
    </div>
  );
}
