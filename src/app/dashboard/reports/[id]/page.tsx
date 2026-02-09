"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExpenseChart } from "@/components/expense-chart";
import { ArrowLeft, Download, Trash2, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  type ExpenseReport,
  type Receipt,
  type ExpenseCategory,
} from "@/lib/types";
import { toast } from "sonner";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/reports/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/dashboard");
            return;
          }
          throw new Error("Failed to fetch report");
        }
        const data = await response.json();
        setReport(data.report);
        setReceipts(data.receipts);
      } catch {
        toast.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id, router]);

  const handleFinalize = async () => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finalized" }),
      });

      if (!response.ok) throw new Error("Failed to finalize report");

      const data = await response.json();
      setReport(data.report);
      toast.success("Report finalized");
    } catch {
      toast.error("Failed to finalize report");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete report");

      toast.success("Report deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete report");
      setDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/reports/${id}/export?format=csv`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report?.title.replace(/[^a-z0-9]/gi, "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export report");
    }
  };

  if (loading) {
    return <ReportDetailSkeleton />;
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {report.title}
              </h1>
              <Badge
                variant={report.status === "finalized" ? "default" : "outline"}
              >
                {report.status}
              </Badge>
            </div>
            <p className="text-slate-600">
              {formatDate(report.date_from)} - {formatDate(report.date_to)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          {report.status === "draft" && (
            <Button onClick={handleFinalize}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalize
            </Button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Report</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this report? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600">Total Amount</div>
            <div className="text-2xl font-bold">
              {formatCurrency(report.total)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600">Receipts</div>
            <div className="text-2xl font-bold">
              {report.receipt_ids.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-600">Categories</div>
            <div className="text-2xl font-bold">
              {Object.keys(report.category_breakdown).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseChart data={report.category_breakdown as Record<ExpenseCategory, number>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(report.category_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span>
                      {EXPENSE_CATEGORIES[category as ExpenseCategory] ||
                        category}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    {formatDate(receipt.transaction_date)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/receipts/${receipt.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {receipt.merchant_name || "Unknown"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {receipt.category
                      ? EXPENSE_CATEGORIES[receipt.category as ExpenseCategory] ||
                        receipt.category
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(receipt.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
