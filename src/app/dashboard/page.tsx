"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceiptCard } from "@/components/receipt-card";
import { ExpenseChart } from "@/components/expense-chart";
import { ReportBuilder } from "@/components/report-builder";
import { UploadZone } from "@/components/upload-zone";
import { CameraCapture } from "@/components/camera-capture";
import { ProcessingStatus } from "@/components/processing-status";
import { ReceiptReview } from "@/components/receipt-review";
import {
  Plus,
  Receipt,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
  Download,
  X,
  Upload,
  Camera,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type {
  Receipt as ReceiptType,
  ExpenseCategory,
  ExpenseReport,
  ProcessingState,
  ReviewableField,
} from "@/lib/types";
import { toast } from "sonner";

type StatsPeriod = "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  week: "Week",
  month: "Month",
  year: "Year",
  all: "All",
};

interface DashboardData {
  receipts: ReceiptType[];
  stats: {
    totalSpent: number;
    receiptCount: number;
    categoryBreakdown: Record<string, number>;
    userCategories: string[];
    allTime: {
      totalSpent: number;
      receiptCount: number;
      categoryBreakdown: Record<string, number>;
    };
  } | null;
}

interface ReportsData {
  reports: ExpenseReport[];
  loading: boolean;
}

interface ProcessedReceipt {
  receiptId: string;
  receipt: Partial<ReceiptType>;
  imageUrl?: string;
  reviewFlags: ReviewableField[];
  needsReview: boolean;
}

type UploadStep = "idle" | "upload" | "processing" | "review";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportsData, setReportsData] = useState<ReportsData>({ reports: [], loading: true });
  const [showBuilder, setShowBuilder] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("month");

  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: "uploading",
    message: "Starting...",
    progress: 0,
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processedReceipt, setProcessedReceipt] = useState<ProcessedReceipt | null>(null);
  const [editedReceiptData, setEditedReceiptData] = useState<Partial<ReceiptType> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async (retryCount = 0) => {
    try {
      const response = await fetch(`/api/receipts?includeStats=true&limit=10&statsPeriod=${statsPeriod}`);
      if (!response.ok) {
        // On first failure, wait and retry once (handles auth cookie race condition)
        if (retryCount === 0 && response.status === 500) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchData(1);
        }
        throw new Error("Failed to fetch receipts");
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [statsPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch("/api/reports");
        if (!response.ok) throw new Error("Failed to fetch reports");
        const result = await response.json();
        setReportsData({ reports: result.reports, loading: false });
      } catch {
        setReportsData((prev) => ({ ...prev, loading: false }));
      }
    }
    fetchReports();
  }, []);

  const handleReportCreated = (report: ExpenseReport) => {
    setReportsData((prev) => ({ ...prev, reports: [report, ...prev.reports] }));
    setShowBuilder(false);
    toast.success("Report created");
  };

  const openUploadModal = () => {
    setUploadStep("upload");
    setUploadError(null);
    setProcessedReceipt(null);
  };

  const closeUploadModal = () => {
    setUploadStep("idle");
    setUploadError(null);
    setProcessedReceipt(null);
    setEditedReceiptData(null);
    setProcessingState({ step: "uploading", message: "Starting...", progress: 0 });
  };

  const handleFileSelect = async (file: File) => {
    setUploadStep("processing");
    setUploadError(null);
    setProcessedReceipt(null);
    setProcessingState({ step: "uploading", message: "Preparing upload...", progress: 5 });

    // Set up 8-minute timeout
    const TIMEOUT_MS = 8 * 60 * 1000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/process-stream", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Failed to start processing");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream available");

      const decoder = new TextDecoder();
      let receiptId: string | undefined;
      let finalData: Record<string, unknown> | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              setProcessingState({
                step: data.step,
                message: data.message,
                progress: data.progress,
                extractedData: data.extractedData,
                receiptId: data.receiptId,
                category: data.category,
                confidence_score: data.confidence_score,
                review_flags: data.review_flags,
                needs_review: data.needs_review,
              });

              if (data.receiptId) receiptId = data.receiptId;
              if (data.error) {
                setUploadError(data.message || "An error occurred");
                setUploadStep("upload");
                clearTimeout(timeoutId);
                return;
              }
              if (data.complete) finalData = data;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      clearTimeout(timeoutId);

      if (receiptId && finalData) {
        const receiptResponse = await fetch(`/api/receipts/${receiptId}`);
        if (receiptResponse.ok) {
          const receiptData = await receiptResponse.json();
          setProcessedReceipt({
            receiptId,
            receipt: receiptData.receipt,
            imageUrl: receiptData.imageUrl,
            reviewFlags: (finalData.review_flags as ReviewableField[]) || [],
            needsReview: (finalData.needs_review as boolean) || false,
          });
          setUploadStep("review");
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const isAborted = err instanceof Error && err.name === "AbortError";
      const message = isAborted
        ? "Processing took too long. Please try again with a clearer image."
        : err instanceof Error
          ? err.message
          : "An error occurred";

      setProcessingState({
        step: "error",
        message,
        progress: 0,
      });
      setUploadError(message);
      setUploadStep("upload");
    }
  };

  const handleConfirm = async (updatedReceipt: Partial<ReceiptType>) => {
    if (!processedReceipt) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/receipts/${processedReceipt.receiptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedReceipt, status: "completed", review_flags: [] }),
      });
      if (!response.ok) throw new Error("Failed to save receipt");
      toast.success("Receipt saved");
      closeUploadModal();
      fetchData();
    } catch {
      toast.error("Failed to save receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-4">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <p className="text-[var(--brand-black)] font-medium mb-2">Something went wrong</p>
        <p className="text-[var(--brand-gray)] mb-6 text-sm">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="border-[var(--brand-black)]/10">Try Again</Button>
      </div>
    );
  }

  const { receipts, stats } = data || { receipts: [], stats: null };
  const pendingReceipts = receipts.filter((r) => r.status === "needs_review");
  const hasData = receipts.length > 0;

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[var(--brand-black)]">Expenses</h1>
          <div className="flex items-center gap-3">
            <Button onClick={openUploadModal} className="gap-2 bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white">
              <Plus className="h-4 w-4" />
              Upload
            </Button>
            <UserMenu />
          </div>
        </header>

        {/* Empty State */}
        {!hasData && (
          <div className="border-2 border-dashed border-[var(--brand-black)]/10 rounded-2xl p-12 text-center bg-white">
            <div className="w-14 h-14 bg-[var(--brand-orange)]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-7 w-7 text-[var(--brand-orange)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--brand-black)] mb-2">No receipts yet</h2>
            <p className="text-[var(--brand-gray)] mb-6 max-w-sm mx-auto">
              Upload your first receipt to start tracking expenses. We&apos;ll extract all the details automatically.
            </p>
            <Button onClick={openUploadModal} className="gap-2 bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white">
              <Upload className="h-4 w-4" />
              Upload Receipt
            </Button>
          </div>
        )}

        {hasData && (
          <>
            {/* Review Alert */}
            {pendingReceipts.length > 0 && (
              <div className="flex items-center justify-between bg-[var(--brand-orange)]/5 border border-[var(--brand-orange)]/20 rounded-xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--brand-orange)]/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-[var(--brand-orange)]" />
                  </div>
                  <span className="text-sm text-[var(--brand-black)]">
                    <strong>{pendingReceipts.length}</strong> receipt{pendingReceipts.length > 1 ? "s" : ""} need review
                  </span>
                </div>
                <Button asChild size="sm" className="bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white">
                  <Link href={`/dashboard/receipts/${pendingReceipts[0].id}`}>
                    Review <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-[var(--brand-black)]/5 rounded-xl px-5 py-4 hover:shadow-md transition-shadow">
                <p className="text-xs text-[var(--brand-gray)] uppercase tracking-wide font-medium">Total Receipts</p>
                <p className="text-2xl font-semibold text-[var(--brand-black)] tabular-nums mt-1">{stats?.allTime?.receiptCount || 0}</p>
              </div>
              <div className="bg-white border border-[var(--brand-black)]/5 rounded-xl px-5 py-4 hover:shadow-md transition-shadow">
                <p className="text-xs text-[var(--brand-gray)] uppercase tracking-wide font-medium">All-Time Spent</p>
                <p className="text-2xl font-semibold text-[var(--brand-black)] tabular-nums mt-1">{formatCurrency(stats?.allTime?.totalSpent || 0)}</p>
              </div>
              <div className="bg-white border border-[var(--brand-black)]/5 rounded-xl px-5 py-4 hover:shadow-md transition-shadow">
                <p className="text-xs text-[var(--brand-gray)] uppercase tracking-wide font-medium">Categories</p>
                <p className="text-2xl font-semibold text-[var(--brand-black)] tabular-nums mt-1">{Object.keys(stats?.allTime?.categoryBreakdown || {}).length}</p>
              </div>
              <div className="bg-white border border-[var(--brand-black)]/5 rounded-xl px-5 py-4 hover:shadow-md transition-shadow">
                <p className="text-xs text-[var(--brand-gray)] uppercase tracking-wide font-medium">Reports</p>
                <p className="text-2xl font-semibold text-[var(--brand-black)] tabular-nums mt-1">{reportsData.reports.length}</p>
              </div>
            </div>

            {/* Period Stats Row */}
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[var(--brand-black)] tabular-nums">
                    {formatCurrency(stats?.totalSpent || 0)}
                  </span>
                  <span className="text-[var(--brand-gray)] text-sm">spent</span>
                </div>
                <p className="text-[var(--brand-gray)] text-sm mt-1">
                  {stats?.receiptCount || 0} receipt{(stats?.receiptCount || 0) !== 1 ? "s" : ""} this {statsPeriod === "all" ? "period" : statsPeriod}
                </p>
              </div>
              <div className="flex gap-1 bg-[var(--brand-black)]/5 p-1 rounded-lg">
                {(["week", "month", "year", "all"] as StatsPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setStatsPeriod(p)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      statsPeriod === p ? "bg-[var(--brand-black)] text-white" : "text-[var(--brand-gray)] hover:text-[var(--brand-black)]"
                    )}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Chart - respects period filter */}
              <div className="lg:col-span-2 bg-white border border-[var(--brand-black)]/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-sm font-semibold text-[var(--brand-black)] mb-4">By Category</h3>
                {stats?.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 ? (
                  <ExpenseChart data={stats.categoryBreakdown as Record<ExpenseCategory, number>} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-[var(--brand-gray)]">
                    <Receipt className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No data for this {statsPeriod === "all" ? "period" : statsPeriod}</p>
                  </div>
                )}
              </div>

              {/* Recent Receipts */}
              <div className="lg:col-span-3 bg-white border border-[var(--brand-black)]/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[var(--brand-black)]">Recent</h3>
                  <Link href="/dashboard/receipts" className="text-sm text-[var(--brand-orange)] hover:underline font-medium">
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {receipts.slice(0, 5).map((receipt) => (
                    <ReceiptCard key={receipt.id} receipt={receipt} compact />
                  ))}
                </div>
              </div>
            </div>

            {/* Reports */}
            <div className="bg-white border border-[var(--brand-black)]/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--brand-black)]">Reports</h3>
                <Button size="sm" variant="outline" onClick={() => setShowBuilder(!showBuilder)} className="border-[var(--brand-black)]/10 hover:bg-[var(--brand-cream)]">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>

              {showBuilder && (
                <div className="mb-4 p-4 bg-[var(--brand-cream)] rounded-xl border border-[var(--brand-black)]/5">
                  <ReportBuilder
                    onReportCreated={handleReportCreated}
                    onCancel={() => setShowBuilder(false)}
                    userCategories={stats?.userCategories || []}
                  />
                </div>
              )}

              {reportsData.loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
                </div>
              ) : reportsData.reports.length > 0 ? (
                <div className="space-y-2">
                  {reportsData.reports.slice(0, 3).map((report) => (
                    <ReportRow key={report.id} report={report} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--brand-gray)] py-4 text-center">No reports yet</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      {uploadStep !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[var(--brand-black)]/60 backdrop-blur-sm" onClick={uploadStep === "upload" ? closeUploadModal : undefined} />
          <div className={cn(
            "relative z-10 bg-white shadow-2xl flex flex-col",
            uploadStep === "review"
              ? "w-full h-full md:w-auto md:h-auto md:max-w-4xl md:max-h-[90vh] md:mx-4 md:rounded-2xl"
              : "w-full max-w-xl max-h-[90vh] mx-4 rounded-2xl"
          )}>
            {/* Upload/Processing Header */}
            {uploadStep !== "review" && (
              <div className="sticky top-0 bg-white border-b border-[var(--brand-black)]/5 px-5 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--brand-orange)] rounded-xl flex items-center justify-center">
                    {uploadStep === "processing" ? (
                      <Sparkles className="h-5 w-5 text-white animate-pulse" />
                    ) : (
                      <Upload className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-[var(--brand-black)]">
                      {uploadStep === "processing" ? "Processing" : "Upload Receipt"}
                    </h2>
                    <p className="text-xs text-[var(--brand-gray)]">
                      {uploadStep === "processing" ? "AI is extracting data..." : "Add a new receipt"}
                    </p>
                  </div>
                </div>
                {uploadStep !== "processing" && (
                  <button onClick={closeUploadModal} className="p-2 hover:bg-[var(--brand-cream)] rounded-lg transition-colors">
                    <X className="h-5 w-5 text-[var(--brand-gray)]" />
                  </button>
                )}
              </div>
            )}

            {/* Review Header - X on left, Continue on right */}
            {uploadStep === "review" && (
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[var(--brand-black)]/5 px-4 py-3 flex items-center justify-between md:rounded-t-2xl">
                <button
                  onClick={closeUploadModal}
                  className="p-2 -ml-2 hover:bg-[var(--brand-cream)] rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5 text-[var(--brand-gray)]" />
                </button>
                <h2 className="font-semibold text-[var(--brand-black)]">Review Receipt</h2>
                <Button
                  onClick={() => processedReceipt && handleConfirm(editedReceiptData || processedReceipt.receipt)}
                  disabled={isSubmitting}
                  size="sm"
                  className="px-5 bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white"
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                </Button>
              </div>
            )}

            <div className={cn(
              "overflow-y-auto flex-1",
              uploadStep === "review" ? "p-0" : "p-5"
            )}>
              {uploadStep === "upload" && (
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="h-4 w-4" /> File
                    </TabsTrigger>
                    <TabsTrigger value="camera" className="gap-2">
                      <Camera className="h-4 w-4" /> Camera
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload">
                    <UploadZone onFileSelect={handleFileSelect} error={uploadError} />
                  </TabsContent>
                  <TabsContent value="camera">
                    <CameraCapture onCapture={handleFileSelect} />
                  </TabsContent>
                </Tabs>
              )}
              {uploadStep === "processing" && <ProcessingStatus state={processingState} />}
              {uploadStep === "review" && processedReceipt && (
                <ReceiptReview
                  receipt={processedReceipt.receipt}
                  imageUrl={processedReceipt.imageUrl}
                  reviewFlags={processedReceipt.reviewFlags}
                  onDataChange={setEditedReceiptData}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReportRow({ report }: { report: ExpenseReport }) {
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/reports/${report.id}/export?format=csv`);
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.replace(/[^a-z0-9]/gi, "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export");
    }
  };

  return (
    <div className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-[var(--brand-cream)] group transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[var(--brand-teal)]/10 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-[var(--brand-teal)]" />
        </div>
        <div className="min-w-0">
          <Link href={`/dashboard/reports/${report.id}`} className="text-sm font-medium text-[var(--brand-black)] hover:text-[var(--brand-orange)] truncate block transition-colors">
            {report.title}
          </Link>
          <p className="text-xs text-[var(--brand-gray)]">
            {formatDate(report.date_from)} – {formatDate(report.date_to)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-[var(--brand-black)] tabular-nums">{formatCurrency(report.total)}</span>
        <button onClick={handleExport} className="p-1.5 text-[var(--brand-gray)] hover:text-[var(--brand-orange)] opacity-0 group-hover:opacity-100 transition-all">
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
        <Skeleton className="lg:col-span-3 h-64 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
