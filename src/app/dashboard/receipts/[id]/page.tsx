"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  AlertTriangle,
  Trash2,
  Pencil,
  X,
  Check,
  Store,
  Calendar,
  Tag,
  Receipt as ReceiptIcon,
  Sparkles,
  Copy,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  ITEM_CATEGORIES,
  ITEM_CATEGORY_COLORS,
  PRICE_RATINGS,
  type Receipt,
  type ExpenseCategory,
  type ItemCategory,
  type PriceRating,
  type ReviewableField,
} from "@/lib/types";
import { toast } from "sonner";
import { ReceiptReview } from "@/components/receipt-review";
import { ZoomableImage } from "@/components/zoomable-image";

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReceipt, setEditedReceipt] = useState<Partial<Receipt>>({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewEditedData, setReviewEditedData] = useState<Partial<Receipt> | null>(null);

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const response = await fetch(`/api/receipts/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/dashboard");
            return;
          }
          throw new Error("Failed to fetch receipt");
        }
        const data = await response.json();
        setReceipt(data.receipt);
        setImageUrl(data.imageUrl);
        setEditedReceipt(data.receipt);
        // Auto-enter review mode if receipt needs review
        if (data.receipt.status === "needs_review") {
          setIsReviewMode(true);
        }
      } catch {
        toast.error("Failed to load receipt");
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [id, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/receipts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedReceipt),
      });

      if (!response.ok) throw new Error("Failed to update receipt");

      const data = await response.json();
      setReceipt(data.receipt);
      setEditedReceipt(data.receipt);
      setIsEditing(false);
      toast.success("Receipt updated");
    } catch {
      toast.error("Failed to update receipt");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/receipts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete receipt");

      toast.success("Receipt deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete receipt");
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    setEditedReceipt(receipt || {});
    setIsEditing(false);
  };

  const updateField = (field: keyof Receipt, value: unknown) => {
    setEditedReceipt((prev) => ({ ...prev, [field]: value }));
  };

  const handleReviewConfirm = async () => {
    const dataToSave = reviewEditedData || receipt;
    if (!dataToSave) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/receipts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dataToSave,
          status: "completed",
          review_flags: [],
        }),
      });

      if (!response.ok) throw new Error("Failed to save receipt");

      const data = await response.json();
      setReceipt(data.receipt);
      setEditedReceipt(data.receipt);
      setReviewEditedData(null);
      setIsReviewMode(false);
      toast.success("Receipt confirmed and saved!");
    } catch {
      toast.error("Failed to save receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipReview = () => {
    setIsReviewMode(false);
    toast.info("You can review this receipt later by clicking Edit");
  };

  if (loading) {
    return <ReceiptDetailSkeleton />;
  }

  if (!receipt) {
    return null;
  }

  // Show review interface if in review mode
  if (isReviewMode) {
    const reviewFlags = (receipt.review_flags || []) as ReviewableField[];
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header with X on left, Continue on right */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleSkipReview}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
          <h2 className="font-semibold text-slate-900">Review Receipt</h2>
          <Button
            onClick={handleReviewConfirm}
            disabled={isSubmitting}
            size="sm"
            className="px-4"
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ReceiptReview
            receipt={receipt}
            imageUrl={imageUrl}
            reviewFlags={reviewFlags}
            onDataChange={setReviewEditedData}
          />
        </div>
      </div>
    );
  }

  const categoryColor = receipt.category
    ? CATEGORY_COLORS[receipt.category as ExpenseCategory]
    : "#6b7280";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {receipt.status === "needs_review" && (
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setIsReviewMode(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Review Now
            </Button>
          )}
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Check className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Receipt</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this receipt? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete Receipt"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Warnings */}
      {receipt.is_duplicate && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Possible Duplicate</p>
            <p className="text-sm text-amber-700">
              This receipt may be a duplicate of another receipt.
              {receipt.duplicate_of && (
                <Link href={`/dashboard/receipts/${receipt.duplicate_of}`} className="ml-1 underline">
                  View original
                </Link>
              )}
            </p>
          </div>
        </div>
      )}

      {receipt.status === "needs_review" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Review Required</p>
              <p className="text-sm text-amber-700">
                {receipt.review_flags && receipt.review_flags.length > 0
                  ? `The AI flagged ${receipt.review_flags.length} field${receipt.review_flags.length > 1 ? "s" : ""} for review: ${receipt.review_flags.map(f => f.replace(/_/g, " ")).join(", ")}`
                  : "This receipt needs to be reviewed before it appears in your analytics"}
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 shrink-0" onClick={() => setIsReviewMode(true)}>
            Review Now
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column - Image */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden sticky top-6">
            {imageUrl ? (
              <ZoomableImage
                src={imageUrl}
                alt="Receipt"
                aspectRatio="aspect-[3/4]"
              />
            ) : (
              <div className="aspect-[3/4] bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                <ReceiptIcon className="h-12 w-12 mb-2" />
                <p>No image available</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero Card */}
          <Card className="overflow-hidden">
            <div
              className="h-2"
              style={{ backgroundColor: categoryColor }}
            />
            <CardContent className="pt-6">
              {/* Merchant & Total */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${categoryColor}15` }}
                  >
                    <Store className="h-7 w-7" style={{ color: categoryColor }} />
                  </div>
                  <div>
                    {isEditing ? (
                      <Input
                        value={editedReceipt.merchant_name || ""}
                        onChange={(e) => updateField("merchant_name", e.target.value)}
                        className="text-xl font-bold mb-1 h-auto py-1 px-2"
                        placeholder="Merchant name"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-slate-900">
                        {receipt.merchant_name || "Unknown Merchant"}
                      </h1>
                    )}
                    {receipt.merchant_address && (
                      <p className="text-slate-500 text-sm mt-1">{receipt.merchant_address}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editedReceipt.total || ""}
                      onChange={(e) => updateField("total", parseFloat(e.target.value))}
                      className="text-3xl font-bold text-right h-auto py-1 px-2 w-32"
                    />
                  ) : (
                    <p className="text-3xl font-bold text-slate-900">
                      {formatCurrency(receipt.total)}
                    </p>
                  )}
                  <StatusBadge status={receipt.status} />
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-3 gap-4">
                <InfoItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date"
                  value={
                    isEditing ? (
                      <Input
                        type="date"
                        value={editedReceipt.transaction_date || ""}
                        onChange={(e) => updateField("transaction_date", e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      formatDate(receipt.transaction_date)
                    )
                  }
                />
                <InfoItem
                  icon={<Tag className="h-4 w-4" />}
                  label="Category"
                  value={
                    isEditing ? (
                      <Select
                        value={editedReceipt.category || ""}
                        onValueChange={(value) => updateField("category", value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${categoryColor}20`,
                          color: categoryColor
                        }}
                      >
                        {EXPENSE_CATEGORIES[receipt.category as ExpenseCategory] || "Other"}
                      </span>
                    )
                  }
                />
                <InfoItem
                  icon={<Sparkles className="h-4 w-4" />}
                  label="Confidence"
                  value={
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(receipt.confidence_score || 0) * 100}%`,
                            backgroundColor: (receipt.confidence_score || 0) >= 0.7 ? '#22c55e' : '#f59e0b'
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium tabular-nums">
                        {Math.round((receipt.confidence_score || 0) * 100)}%
                      </span>
                    </div>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Amount Breakdown */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">Amount Breakdown</h3>
              <div className="space-y-3">
                <AmountRow
                  label="Subtotal"
                  value={receipt.subtotal}
                  isEditing={isEditing}
                  onChange={(v) => updateField("subtotal", v)}
                  editValue={editedReceipt.subtotal}
                />
                <AmountRow
                  label="Tax"
                  value={receipt.tax}
                  isEditing={isEditing}
                  onChange={(v) => updateField("tax", v)}
                  editValue={editedReceipt.tax}
                />
                {(receipt.tip || isEditing) && (
                  <AmountRow
                    label="Tip"
                    value={receipt.tip}
                    isEditing={isEditing}
                    onChange={(v) => updateField("tip", v)}
                    editValue={editedReceipt.tip}
                  />
                )}
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(receipt.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          {receipt.line_items && receipt.line_items.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Items ({receipt.line_items.length})
                  </h3>
                </div>
                <div className="divide-y">
                  {receipt.line_items.map((item, index) => {
                    const itemCategory = item.category as ItemCategory | undefined;
                    const categoryColor = itemCategory ? ITEM_CATEGORY_COLORS[itemCategory] : "#6b7280";
                    const categoryLabel = itemCategory ? ITEM_CATEGORIES[itemCategory] : null;
                    const priceRating = item.price_rating as PriceRating | undefined;
                    const ratingInfo = priceRating ? PRICE_RATINGS[priceRating] : null;

                    return (
                      <div key={index} className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-xs font-medium shrink-0">
                              {item.quantity || 1}x
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-slate-900">{item.name}</p>
                                {categoryLabel && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{
                                      backgroundColor: `${categoryColor}20`,
                                      color: categoryColor,
                                    }}
                                  >
                                    {categoryLabel}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-slate-500">{item.description}</p>
                              )}
                              {ratingInfo && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">{ratingInfo.emoji}</span>
                                  <span
                                    className="text-xs font-medium"
                                    style={{ color: ratingInfo.color }}
                                  >
                                    {ratingInfo.label}
                                  </span>
                                  {item.price_note && (
                                    <span className="text-xs text-slate-400">
                                      — {item.price_note}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="font-semibold tabular-nums shrink-0">{formatCurrency(item.total)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Notes */}
          {receipt.agent_notes && (
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">AI Analysis</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {receipt.agent_notes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Receipt ID */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Receipt ID: {receipt.id.slice(0, 8)}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(receipt.id);
                toast.success("Copied to clipboard");
              }}
              className="hover:text-slate-600"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  );
}

function AmountRow({
  label,
  value,
  isEditing,
  onChange,
  editValue
}: {
  label: string;
  value: number | null | undefined;
  isEditing: boolean;
  onChange: (value: number) => void;
  editValue: number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      {isEditing ? (
        <Input
          type="number"
          step="0.01"
          value={editValue || ""}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-24 h-8 text-right"
        />
      ) : (
        <span className="tabular-nums">{formatCurrency(value)}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    completed: { color: "text-green-700", bg: "bg-green-100", label: "Completed" },
    processing: { color: "text-blue-700", bg: "bg-blue-100", label: "Processing" },
    pending: { color: "text-slate-700", bg: "bg-slate-100", label: "Pending" },
    needs_review: { color: "text-amber-700", bg: "bg-amber-100", label: "Needs Review" },
    failed: { color: "text-red-700", bg: "bg-red-100", label: "Failed" },
  };

  const { color, bg, label } = config[status] || config.pending;

  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium mt-1 inline-block", color, bg)}>
      {label}
    </span>
  );
}

function ReceiptDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-10 w-32 mb-2" />
                  <Skeleton className="h-6 w-20 ml-auto" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-6 w-40 mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
