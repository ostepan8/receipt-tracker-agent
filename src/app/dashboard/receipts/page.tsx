"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Receipt,
  Search,
  ArrowUpDown,
  Calendar,
  Store,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  getCategoryLabel,
  type Receipt as ReceiptType,
  type ExpenseCategory,
} from "@/lib/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "merchant_asc";
type ViewMode = "grid" | "list";

const STATUS_CONFIG = {
  all: { label: "All", icon: Receipt, color: "text-slate-600", bg: "bg-slate-100" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  needs_review: { label: "Needs Review", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  processing: { label: "Processing", icon: Loader2, color: "text-blue-600", bg: "bg-blue-50" },
  pending: { label: "Pending", icon: Clock, color: "text-slate-500", bg: "bg-slate-50" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const response = await fetch("/api/receipts");
        if (!response.ok) throw new Error("Failed to fetch receipts");
        const data = await response.json();
        setReceipts(data.receipts);
      } catch {
        toast.error("Failed to load receipts");
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, []);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: receipts.length };
    receipts.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [receipts]);

  // Filter and sort receipts
  const filteredReceipts = useMemo(() => {
    let result = [...receipts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((receipt) => {
        const matchesMerchant = receipt.merchant_name?.toLowerCase().includes(query);
        const matchesCategory = receipt.category?.toLowerCase().includes(query);
        return matchesMerchant || matchesCategory;
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((r) => r.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return new Date(b.transaction_date || b.created_at).getTime() -
                 new Date(a.transaction_date || a.created_at).getTime();
        case "date_asc":
          return new Date(a.transaction_date || a.created_at).getTime() -
                 new Date(b.transaction_date || b.created_at).getTime();
        case "amount_desc":
          return (b.total || 0) - (a.total || 0);
        case "amount_asc":
          return (a.total || 0) - (b.total || 0);
        case "merchant_asc":
          return (a.merchant_name || "").localeCompare(b.merchant_name || "");
        default:
          return 0;
      }
    });

    return result;
  }, [receipts, searchQuery, categoryFilter, statusFilter, sortBy]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = filteredReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
    const avgAmount = filteredReceipts.length > 0 ? total / filteredReceipts.length : 0;
    return { total, avgAmount, count: filteredReceipts.length };
  }, [filteredReceipts]);

  // Get unique categories from receipts (including custom ones not in EXPENSE_CATEGORIES)
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    receipts.forEach((r) => {
      if (r.category) categories.add(r.category);
    });
    return Array.from(categories).filter((cat) => !EXPENSE_CATEGORIES[cat]);
  }, [receipts]);

  if (loading) {
    return <ReceiptsPageSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Receipts</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {receipts.length} receipt{receipts.length !== 1 ? "s" : ""} in your collection
              </p>
            </div>
            <Button asChild className="shadow-sm">
              <Link href="/dashboard">
                <Plus className="h-4 w-4 mr-2" />
                Add Receipt
              </Link>
            </Button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="px-6 flex gap-1 overflow-x-auto pb-px">
          {(["all", "completed", "needs_review", "processing", "failed"] as const).map((status) => {
            const config = STATUS_CONFIG[status];
            const count = statusCounts[status] || 0;
            const isActive = statusFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap",
                  "border-b-2 -mb-px",
                  isActive
                    ? "border-slate-900 text-slate-900 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <config.icon className={cn("h-4 w-4", isActive ? config.color : "")} />
                {config.label}
                {count > 0 && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    isActive ? `${config.bg} ${config.color}` : "bg-slate-100 text-slate-500"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-200/60">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Showing</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{summaryStats.count}</p>
            <p className="text-sm text-slate-500">receipt{summaryStats.count !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-200/60">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Total Value</p>
            <p className="text-2xl font-semibold text-emerald-900 mt-1">{formatCurrency(summaryStats.total)}</p>
            <p className="text-sm text-emerald-600">combined amount</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200/60">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Average</p>
            <p className="text-2xl font-semibold text-blue-900 mt-1">{formatCurrency(summaryStats.avgAmount)}</p>
            <p className="text-sm text-blue-600">per receipt</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search merchants or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 h-10"
            />
          </div>

          <div className="flex gap-2">
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] bg-white h-10">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[150px] bg-white h-10">
                <ArrowUpDown className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest First</SelectItem>
                <SelectItem value="date_asc">Oldest First</SelectItem>
                <SelectItem value="amount_desc">Highest Amount</SelectItem>
                <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                <SelectItem value="merchant_asc">Merchant A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex bg-white border rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredReceipts.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredReceipts.map((receipt) => (
                <ReceiptGridCard key={receipt.id} receipt={receipt} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {filteredReceipts.map((receipt) => (
                <ReceiptListItem key={receipt.id} receipt={receipt} />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            hasReceipts={receipts.length > 0}
            onClearFilters={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}
          />
        )}
      </div>
    </div>
  );
}

function ReceiptGridCard({ receipt }: { receipt: ReceiptType }) {
  const categoryColor = receipt.category
    ? CATEGORY_COLORS[receipt.category as ExpenseCategory]
    : "#6b7280";
  const needsReview = receipt.status === "needs_review";
  const statusConfig = STATUS_CONFIG[receipt.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;

  return (
    <Link href={`/dashboard/receipts/${receipt.id}`}>
      <Card className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5",
        "border-slate-200/80",
        needsReview && "ring-2 ring-amber-200 ring-offset-1"
      )}>
        {/* Category Indicator */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: categoryColor }}
        />

        <CardContent className="p-5 pt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${categoryColor}15` }}
              >
                <Store className="h-5 w-5" style={{ color: categoryColor }} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {receipt.merchant_name || "Unknown Merchant"}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(receipt.transaction_date)}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              statusConfig.bg, statusConfig.color
            )}>
              <statusConfig.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{statusConfig.label}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-end justify-between">
            <div>
              {receipt.category && (
                <Badge
                  variant="secondary"
                  className="text-xs font-normal mb-2"
                  style={{
                    backgroundColor: `${categoryColor}10`,
                    color: categoryColor,
                    borderColor: `${categoryColor}30`
                  }}
                >
                  {getCategoryLabel(receipt.category)}
                </Badge>
              )}
              {receipt.line_items && receipt.line_items.length > 0 && (
                <p className="text-xs text-slate-400">
                  {receipt.line_items.length} item{receipt.line_items.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(receipt.total)}
              </p>
            </div>
          </div>

          {/* Hover indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform" />
        </CardContent>
      </Card>
    </Link>
  );
}

function ReceiptListItem({ receipt }: { receipt: ReceiptType }) {
  const categoryColor = receipt.category
    ? CATEGORY_COLORS[receipt.category as ExpenseCategory]
    : "#6b7280";
  const statusConfig = STATUS_CONFIG[receipt.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;

  return (
    <Link
      href={`/dashboard/receipts/${receipt.id}`}
      className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors group"
    >
      {/* Category Color Bar */}
      <div
        className="w-1 h-12 rounded-full shrink-0"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${categoryColor}12` }}
      >
        <Store className="h-5 w-5" style={{ color: categoryColor }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-900 truncate">
            {receipt.merchant_name || "Unknown Merchant"}
          </h3>
          <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
            statusConfig.bg, statusConfig.color
          )}>
            <statusConfig.icon className="h-3 w-3" />
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
          <span>{formatDate(receipt.transaction_date)}</span>
          {receipt.category && (
            <>
              <span className="text-slate-300">·</span>
              <span>{getCategoryLabel(receipt.category)}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="text-lg font-semibold text-slate-900 tabular-nums">
          {formatCurrency(receipt.total)}
        </p>
        {receipt.line_items && receipt.line_items.length > 0 && (
          <p className="text-xs text-slate-400">
            {receipt.line_items.length} item{receipt.line_items.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
    </Link>
  );
}

function EmptyState({
  hasReceipts,
  onClearFilters
}: {
  hasReceipts: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Receipt className="h-8 w-8 text-slate-400" />
      </div>

      {hasReceipts ? (
        <>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No matches found</h3>
          <p className="text-slate-500 text-center mb-4 max-w-sm">
            Try adjusting your search terms or filters to find what you&apos;re looking for.
          </p>
          <Button variant="outline" onClick={onClearFilters}>
            Clear all filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No receipts yet</h3>
          <p className="text-slate-500 text-center mb-4 max-w-sm">
            Start tracking your expenses by uploading your first receipt.
          </p>
          <Button asChild>
            <Link href="/dashboard">
              <Plus className="h-4 w-4 mr-2" />
              Upload your first receipt
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}

function ReceiptsPageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Header Skeleton */}
      <div className="border-b bg-white">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="px-6 flex gap-2 pb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-20" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <Skeleton className="w-11 h-11 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="flex items-end justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
