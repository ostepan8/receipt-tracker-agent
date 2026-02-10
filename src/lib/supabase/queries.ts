import { createServerClient } from "./client";
import type {
  Receipt,
  ExpenseReport,
  User,
  ExpenseCategory,
  ItemCategory,
  AnalyticsData,
  CategorySpending,
  ItemCategorySpending,
  MerchantSpending,
  DailySpending,
  LineItem,
} from "../types";

// User queries
export async function upsertUser(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<User> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert user: ${error.message}`);
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) throw new Error(`Failed to delete user: ${error.message}`);
}

export async function ensureUserExists(userId: string, email: string, name?: string | null): Promise<void> {
  const supabase = createServerClient();

  // Check if user exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  // If user doesn't exist, create them
  if (!existingUser) {
    await upsertUser({ id: userId, email, name });
  }
}

// Receipt queries
export async function createReceipt(
  userId: string,
  data: Partial<Receipt>
): Promise<Receipt> {
  const supabase = createServerClient();

  const { data: receipt, error } = await supabase
    .from("receipts")
    .insert({
      user_id: userId,
      status: "pending",
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create receipt: ${error.message}`);
  return receipt;
}

export async function updateReceipt(
  receiptId: string,
  data: Partial<Receipt>
): Promise<Receipt> {
  const supabase = createServerClient();

  const { data: receipt, error } = await supabase
    .from("receipts")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", receiptId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update receipt: ${error.message}`);
  return receipt;
}

export async function getReceipt(
  receiptId: string,
  userId: string
): Promise<Receipt | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("receipts")
    .select()
    .eq("id", receiptId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get receipt: ${error.message}`);
  }
  return data;
}

export async function getReceipts(
  userId: string,
  options?: {
    status?: Receipt["status"];
    category?: ExpenseCategory;
    limit?: number;
    offset?: number;
  }
): Promise<Receipt[]> {
  const supabase = createServerClient();

  let query = supabase
    .from("receipts")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get receipts: ${error.message}`);
  return data || [];
}

export async function getRecentReceipts(
  userId: string,
  days: number = 30
): Promise<
  Array<{
    id: string;
    merchant_name: string;
    total: number;
    transaction_date: string;
    category: string;
    line_items?: LineItem[];
  }>
> {
  const supabase = createServerClient();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const { data, error } = await supabase
    .from("receipts")
    .select("id, merchant_name, total, transaction_date, category, line_items")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("transaction_date", dateFrom.toISOString().split("T")[0])
    .order("transaction_date", { ascending: false });

  if (error) throw new Error(`Failed to get recent receipts: ${error.message}`);
  return (data || []) as Array<{
    id: string;
    merchant_name: string;
    total: number;
    transaction_date: string;
    category: string;
    line_items?: LineItem[];
  }>;
}

export async function deleteReceipt(
  receiptId: string,
  userId: string
): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("receipts")
    .delete()
    .eq("id", receiptId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete receipt: ${error.message}`);
}

export type StatsPeriod = "week" | "month" | "year" | "all";

export async function getReceiptStats(
  userId: string,
  period: StatsPeriod = "all"
): Promise<{
  totalSpent: number;
  receiptCount: number;
  categoryBreakdown: Record<string, number>;
  itemCategoryBreakdown: Record<string, number>;
  userCategories: string[];
  allTime: {
    totalSpent: number;
    receiptCount: number;
    categoryBreakdown: Record<string, number>;
    itemCategoryBreakdown: Record<string, number>;
  };
}> {
  const supabase = createServerClient();

  // First get ALL completed receipts for all-time stats (include line_items for item category breakdown)
  const { data: allReceipts, error: allError } = await supabase
    .from("receipts")
    .select("total, category, line_items, transaction_date")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (allError) throw new Error(`Failed to get stats: ${allError.message}`);

  const allData = allReceipts || [];
  const allTimeTotalSpent = allData.reduce((sum, r) => sum + (r.total || 0), 0);
  const allTimeCategoryBreakdown: Record<string, number> = {};
  const allTimeItemCategoryBreakdown: Record<string, number> = {};

  for (const receipt of allData) {
    const category = receipt.category || "Other";
    allTimeCategoryBreakdown[category] = (allTimeCategoryBreakdown[category] || 0) + (receipt.total || 0);

    // Calculate item category breakdown
    const lineItems = (receipt.line_items as LineItem[]) || [];
    for (const item of lineItems) {
      const itemCategory = item.category || "Other";
      allTimeItemCategoryBreakdown[itemCategory] = (allTimeItemCategoryBreakdown[itemCategory] || 0) + (item.total || 0);
    }
  }

  // Now get period-filtered stats
  let periodReceipts = allData;

  if (period !== "all") {
    const now = new Date();
    let fromDate: Date;

    switch (period) {
      case "week":
        fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case "month":
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        fromDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Filter from already fetched data
    const fromDateStr = fromDate.toISOString().split("T")[0];
    periodReceipts = allData.filter(r => r.transaction_date && r.transaction_date >= fromDateStr);
  }

  const totalSpent = periodReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const categoryBreakdown: Record<string, number> = {};
  const itemCategoryBreakdown: Record<string, number> = {};

  for (const receipt of periodReceipts) {
    const category = receipt.category || "Other";
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (receipt.total || 0);

    // Calculate item category breakdown for period
    const lineItems = (receipt.line_items as LineItem[]) || [];
    for (const item of lineItems) {
      const itemCategory = item.category || "Other";
      itemCategoryBreakdown[itemCategory] = (itemCategoryBreakdown[itemCategory] || 0) + (item.total || 0);
    }
  }

  // Also fetch all-time categories for the dropdown
  const userCategories = await getUserCategories(userId);

  return {
    totalSpent,
    receiptCount: periodReceipts.length,
    categoryBreakdown,
    itemCategoryBreakdown,
    userCategories,
    allTime: {
      totalSpent: allTimeTotalSpent,
      receiptCount: allData.length,
      categoryBreakdown: allTimeCategoryBreakdown,
      itemCategoryBreakdown: allTimeItemCategoryBreakdown,
    },
  };
}

// Expense Report queries
export async function createExpenseReport(
  userId: string,
  data: {
    title: string;
    description?: string;
    date_from: string;
    date_to: string;
    receipt_ids: string[];
  }
): Promise<ExpenseReport> {
  const supabase = createServerClient();

  // Calculate totals from receipts
  const { data: receipts, error: receiptsError } = await supabase
    .from("receipts")
    .select("total, category")
    .eq("user_id", userId)
    .in("id", data.receipt_ids);

  if (receiptsError) {
    throw new Error(`Failed to fetch receipts: ${receiptsError.message}`);
  }

  const total = receipts?.reduce((sum, r) => sum + (r.total || 0), 0) || 0;
  const categoryBreakdown: Record<string, number> = {};

  for (const receipt of receipts || []) {
    const category = receipt.category || "other";
    categoryBreakdown[category] =
      (categoryBreakdown[category] || 0) + (receipt.total || 0);
  }

  const { data: report, error } = await supabase
    .from("expense_reports")
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      date_from: data.date_from,
      date_to: data.date_to,
      total,
      category_breakdown: categoryBreakdown,
      receipt_ids: data.receipt_ids,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create report: ${error.message}`);
  return report;
}

export async function getExpenseReports(userId: string): Promise<ExpenseReport[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("expense_reports")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to get reports: ${error.message}`);
  return data || [];
}

export async function getExpenseReport(
  reportId: string,
  userId: string
): Promise<ExpenseReport | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("expense_reports")
    .select()
    .eq("id", reportId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get report: ${error.message}`);
  }
  return data;
}

export async function updateExpenseReport(
  reportId: string,
  userId: string,
  data: Partial<ExpenseReport>
): Promise<ExpenseReport> {
  const supabase = createServerClient();

  const { data: report, error } = await supabase
    .from("expense_reports")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update report: ${error.message}`);
  return report;
}

export async function deleteExpenseReport(
  reportId: string,
  userId: string
): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("expense_reports")
    .delete()
    .eq("id", reportId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete report: ${error.message}`);
}

export async function getUserCategories(userId: string): Promise<string[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("receipts")
    .select("category")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("category", "is", null);

  if (error) throw new Error(`Failed to get categories: ${error.message}`);

  // Get unique categories
  const categories = [...new Set(data?.map((r) => r.category).filter(Boolean) as string[])];
  return categories.sort();
}

export async function getReceiptsInDateRange(
  userId: string,
  dateFrom: string,
  dateTo: string,
  category?: ExpenseCategory
): Promise<Receipt[]> {
  const supabase = createServerClient();

  let query = supabase
    .from("receipts")
    .select()
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("transaction_date", dateFrom)
    .lte("transaction_date", dateTo)
    .order("transaction_date", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get receipts: ${error.message}`);
  return data || [];
}

// Analytics queries
export type AnalyticsPeriod = "week" | "month" | "year" | "all";

function getDateRange(period: AnalyticsPeriod): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  let from: Date;

  switch (period) {
    case "week":
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      break;
    case "month":
      from = new Date(now);
      from.setMonth(from.getMonth() - 1);
      break;
    case "year":
      from = new Date(now);
      from.setFullYear(from.getFullYear() - 1);
      break;
    case "all":
    default:
      from = new Date(0); // Beginning of time
      break;
  }

  return { from, to };
}

export async function getAnalytics(
  userId: string,
  period: AnalyticsPeriod = "month"
): Promise<AnalyticsData> {
  const supabase = createServerClient();
  const { from, to } = getDateRange(period);

  // Fetch all completed receipts in date range
  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("id, merchant_name, total, category, transaction_date, line_items, created_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("transaction_date", from.toISOString().split("T")[0])
    .lte("transaction_date", to.toISOString().split("T")[0])
    .order("transaction_date", { ascending: true });

  if (error) throw new Error(`Failed to get analytics: ${error.message}`);

  const data = receipts || [];

  // Calculate summary
  const totalSpent = data.reduce((sum, r) => sum + (r.total || 0), 0);
  const receiptCount = data.length;
  const avgReceipt = receiptCount > 0 ? totalSpent / receiptCount : 0;

  // Calculate spending by expense category
  const categoryTotals: Record<string, { total: number; count: number }> = {};
  for (const receipt of data) {
    const cat = receipt.category || "other";
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { total: 0, count: 0 };
    }
    categoryTotals[cat].total += receipt.total || 0;
    categoryTotals[cat].count += 1;
  }

  const byCategory: CategorySpending[] = Object.entries(categoryTotals)
    .map(([category, { total, count }]) => ({
      category: category as ExpenseCategory,
      total,
      count,
      percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Calculate spending by item category
  const itemCategoryTotals: Record<string, { total: number; count: number }> = {};
  let totalItemSpending = 0;

  for (const receipt of data) {
    const lineItems = (receipt.line_items as LineItem[]) || [];
    for (const item of lineItems) {
      const cat = item.category || "other";
      if (!itemCategoryTotals[cat]) {
        itemCategoryTotals[cat] = { total: 0, count: 0 };
      }
      itemCategoryTotals[cat].total += item.total || 0;
      itemCategoryTotals[cat].count += 1;
      totalItemSpending += item.total || 0;
    }
  }

  const byItemCategory: ItemCategorySpending[] = Object.entries(itemCategoryTotals)
    .map(([category, { total, count }]) => ({
      category: category as ItemCategory,
      total,
      count,
      percentage: totalItemSpending > 0 ? (total / totalItemSpending) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Calculate top merchants
  const merchantTotals: Record<string, { total: number; count: number }> = {};
  for (const receipt of data) {
    const name = receipt.merchant_name || "Unknown";
    if (!merchantTotals[name]) {
      merchantTotals[name] = { total: 0, count: 0 };
    }
    merchantTotals[name].total += receipt.total || 0;
    merchantTotals[name].count += 1;
  }

  const topMerchants: MerchantSpending[] = Object.entries(merchantTotals)
    .map(([name, { total, count }]) => ({ name, total, count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Calculate daily spending
  const dailyTotals: Record<string, { total: number; count: number }> = {};
  for (const receipt of data) {
    const date = receipt.transaction_date || receipt.created_at?.split("T")[0];
    if (date) {
      if (!dailyTotals[date]) {
        dailyTotals[date] = { total: 0, count: 0 };
      }
      dailyTotals[date].total += receipt.total || 0;
      dailyTotals[date].count += 1;
    }
  }

  const dailySpending: DailySpending[] = Object.entries(dailyTotals)
    .map(([date, { total, count }]) => ({ date, total, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Generate insights
  const insights = generateInsights(data, byCategory, byItemCategory, topMerchants, period);

  return {
    summary: {
      total_spent: totalSpent,
      receipt_count: receiptCount,
      avg_receipt: avgReceipt,
    },
    by_category: byCategory,
    by_item_category: byItemCategory,
    top_merchants: topMerchants,
    daily_spending: dailySpending,
    insights,
  };
}

function generateInsights(
  receipts: Array<{ merchant_name: string | null; total: number | null; category: string | null; line_items: unknown }>,
  byCategory: CategorySpending[],
  byItemCategory: ItemCategorySpending[],
  topMerchants: MerchantSpending[],
  period: AnalyticsPeriod
): string[] {
  const insights: string[] = [];
  const periodLabel = period === "week" ? "this week" : period === "month" ? "this month" : period === "year" ? "this year" : "";

  // Top category insight
  if (byCategory.length > 0) {
    const top = byCategory[0];
    insights.push(`${top.category.replace(/_/g, " ")} is your biggest expense category at ${top.percentage.toFixed(0)}% of spending${periodLabel ? ` ${periodLabel}` : ""}`);
  }

  // Top merchant insight
  if (topMerchants.length > 0) {
    const top = topMerchants[0];
    insights.push(`You've visited ${top.name} ${top.count} time${top.count > 1 ? "s" : ""}, spending $${top.total.toFixed(2)} total`);
  }

  // Coffee insight (if applicable)
  const coffeeSpending = byItemCategory.find((c) => c.category === "coffee");
  if (coffeeSpending && coffeeSpending.count > 0) {
    insights.push(`${coffeeSpending.count} coffee purchase${coffeeSpending.count > 1 ? "s" : ""} totaling $${coffeeSpending.total.toFixed(2)}`);
  }

  // High spending day insight
  if (receipts.length > 0) {
    const maxReceipt = receipts.reduce((max, r) => (r.total || 0) > (max.total || 0) ? r : max, receipts[0]);
    if (maxReceipt.total && maxReceipt.total > 100) {
      insights.push(`Largest purchase: $${maxReceipt.total.toFixed(2)} at ${maxReceipt.merchant_name || "Unknown"}`);
    }
  }

  return insights.slice(0, 4); // Limit to 4 insights
}
