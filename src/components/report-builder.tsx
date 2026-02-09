"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { EXPENSE_CATEGORIES, getCategoryLabel, type ExpenseReport } from "@/lib/types";

interface ReportBuilderProps {
  onReportCreated: (report: ExpenseReport) => void;
  onCancel: () => void;
  userCategories?: string[];
}

export function ReportBuilder({ onReportCreated, onCancel, userCategories = [] }: ReportBuilderProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default dates to current month
  useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateFrom(firstDay.toISOString().split("T")[0]);
    setDateTo(lastDay.toISOString().split("T")[0]);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          date_from: dateFrom,
          date_to: dateTo,
          category: category !== "all" ? category : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Extract specific validation errors if available
        let errorMessage = data.error || "Failed to create report";
        if (data.details?.fieldErrors) {
          const allErrors = Object.values(data.details.fieldErrors)
            .filter((errors): errors is string[] => Array.isArray(errors) && errors.length > 0)
            .flat();
          if (allErrors.length > 0) {
            errorMessage = allErrors.join(". ");
          }
        } else if (data.details?.formErrors?.length > 0) {
          errorMessage = data.details.formErrors.join(". ");
        }
        throw new Error(errorMessage);
      }

      onReportCreated(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Report Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., January 2024 Expenses"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any notes about this report"
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateFrom">Start Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo">End Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Category Filter</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {/* User's categories first */}
            {userCategories.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Your Categories</div>
                {userCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-t mt-1 pt-2">Default Categories</div>
              </>
            )}
            {/* Default categories (excluding ones already in userCategories) */}
            {Object.entries(EXPENSE_CATEGORIES)
              .filter(([key]) => !userCategories.includes(key))
              .map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Report"}
        </Button>
      </div>
    </form>
  );
}
