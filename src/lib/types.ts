// Shared TypeScript types for the Receipt Agent application

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

// Item categories are now flexible - AI can use any tag
export type ItemCategory = string;

// Default item categories (AI uses Title Case)
export const DEFAULT_ITEM_CATEGORIES: Record<string, string> = {
  "Coffee": "Coffee",
  "Food": "Food",
  "Alcohol": "Alcohol",
  "Groceries": "Groceries",
  "Electronics": "Electronics",
  "Clothing": "Clothing",
  "Transportation": "Transportation",
  "Entertainment": "Entertainment",
  "Health": "Health",
  "Home": "Home",
  "Office": "Office",
  "Software": "Software",
  "Services": "Services",
  "Tools": "Tools",
  "Beverage": "Beverage",
  "Other": "Other",
};

// Alias for backwards compatibility
export const ITEM_CATEGORIES = DEFAULT_ITEM_CATEGORIES;

// Colors for known categories (Title Case keys)
const KNOWN_ITEM_CATEGORY_COLORS: Record<string, string> = {
  "Coffee": "#92400e",
  "Food": "#f97316",
  "Alcohol": "#7c3aed",
  "Groceries": "#22c55e",
  "Electronics": "#3b82f6",
  "Clothing": "#ec4899",
  "Transportation": "#0ea5e9",
  "Entertainment": "#f59e0b",
  "Health": "#ef4444",
  "Home": "#6366f1",
  "Office": "#10b981",
  "Software": "#8b5cf6",
  "Services": "#14b8a6",
  "Tools": "#059669",
  "Beverage": "#dc2626",
  "Other": "#6b7280",
};

// Get color for any category (generates consistent color for unknown categories)
export function getItemCategoryColor(category: string): string {
  // Try direct lookup first (Title Case)
  if (KNOWN_ITEM_CATEGORY_COLORS[category]) {
    return KNOWN_ITEM_CATEGORY_COLORS[category];
  }
  // Try Title Case conversion for legacy snake_case
  const titleCase = category
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  if (KNOWN_ITEM_CATEGORY_COLORS[titleCase]) {
    return KNOWN_ITEM_CATEGORY_COLORS[titleCase];
  }
  // Generate a consistent color based on the category name
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

// For backwards compatibility
export const ITEM_CATEGORY_COLORS = new Proxy(KNOWN_ITEM_CATEGORY_COLORS, {
  get(target, prop: string) {
    return target[prop] || getItemCategoryColor(prop);
  },
}) as Record<string, string>;

// Price rating for AI-assessed value
export type PriceRating = "great_deal" | "good_deal" | "fair_price" | "overpriced" | "ripoff";

export const PRICE_RATINGS: Record<PriceRating, { label: string; color: string; emoji: string }> = {
  great_deal: { label: "Great Deal", color: "#22c55e", emoji: "🔥" },
  good_deal: { label: "Good Deal", color: "#84cc16", emoji: "👍" },
  fair_price: { label: "Fair Price", color: "#6b7280", emoji: "👌" },
  overpriced: { label: "Overpriced", color: "#f97316", emoji: "😬" },
  ripoff: { label: "Ripoff", color: "#ef4444", emoji: "💸" },
};

export interface LineItem {
  name: string;
  quantity?: number;
  unit_price?: number;
  total: number;
  category?: ItemCategory;
  // AI-enhanced fields
  description?: string;        // What this item actually is (e.g., "22oz imported Australian lager")
  price_rating?: PriceRating;  // AI assessment of the price
  price_note?: string;         // Why the AI gave this rating (e.g., "Typical price is $5-7")
}

// Fields that can be flagged for review
export type ReviewableField =
  | "merchant_name"
  | "merchant_address"
  | "transaction_date"
  | "subtotal"
  | "tax"
  | "total"
  | "category"
  | "line_items";

export interface Receipt {
  id: string;
  user_id: string;
  storage_path: string;
  original_filename: string | null;
  file_type: string;
  merchant_name: string | null;
  merchant_address: string | null;
  transaction_date: string | null;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number | null;
  currency: string;
  payment_method: string | null;
  card_last_four: string | null;
  line_items: LineItem[];
  category: ExpenseCategory | null;
  subcategory: string | null;
  agent_notes: string | null;
  confidence_score: number | null;
  review_flags: ReviewableField[] | null;
  is_duplicate: boolean;
  duplicate_of: string | null;
  status: ReceiptStatus;
  error_message: string | null;
  raw_extraction: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseReport {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date_from: string;
  date_to: string;
  total: number;
  category_breakdown: Record<string, number>;
  receipt_ids: string[];
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export type ReceiptStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "needs_review";

export type ReportStatus = "draft" | "finalized";

// Expense categories are now flexible - AI can use any tag
export type ExpenseCategory = string;

// Default expense categories (AI uses Title Case)
export const DEFAULT_EXPENSE_CATEGORIES: Record<string, string> = {
  "Meals & Entertainment": "Meals & Entertainment",
  "Travel & Transportation": "Travel & Transportation",
  "Office Supplies": "Office Supplies",
  "Software & Subscriptions": "Software & Subscriptions",
  "Utilities": "Utilities",
  "Professional Services": "Professional Services",
  "Equipment": "Equipment",
  "Marketing": "Marketing",
  "Healthcare": "Healthcare",
  "Hardware": "Hardware",
  "Tools": "Tools",
  "Home Improvement": "Home Improvement",
  "Other": "Other",
};

// Alias for backwards compatibility
export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;

// Colors for known categories (Title Case keys)
const KNOWN_CATEGORY_COLORS: Record<string, string> = {
  "Meals & Entertainment": "#f97316",
  "Travel & Transportation": "#3b82f6",
  "Office Supplies": "#10b981",
  "Software & Subscriptions": "#8b5cf6",
  "Utilities": "#f59e0b",
  "Professional Services": "#ec4899",
  "Equipment": "#6366f1",
  "Marketing": "#14b8a6",
  "Healthcare": "#ef4444",
  "Hardware": "#059669",
  "Tools": "#0891b2",
  "Home Improvement": "#7c3aed",
  "Other": "#6b7280",
};

// Get color for any category (generates consistent color for unknown categories)
export function getCategoryColor(category: string): string {
  // Try direct lookup first (Title Case)
  if (KNOWN_CATEGORY_COLORS[category]) {
    return KNOWN_CATEGORY_COLORS[category];
  }
  // Try Title Case conversion for legacy snake_case
  const titleCase = category
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  if (KNOWN_CATEGORY_COLORS[titleCase]) {
    return KNOWN_CATEGORY_COLORS[titleCase];
  }
  // Generate a consistent color based on the category name
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

// Get display label for any category
export function getCategoryLabel(category: string): string {
  // If it's a known category, return it directly
  if (DEFAULT_EXPENSE_CATEGORIES[category]) {
    return DEFAULT_EXPENSE_CATEGORIES[category];
  }
  // If it looks like snake_case (legacy data), convert to Title Case
  if (category.includes("_")) {
    return category
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  // If it's already in a reasonable format, return as-is
  // but ensure first letter is capitalized
  if (category.length > 0) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
  return category;
}

// For backwards compatibility
export const CATEGORY_COLORS = new Proxy(KNOWN_CATEGORY_COLORS, {
  get(target, prop: string) {
    return target[prop] || getCategoryColor(prop);
  },
}) as Record<string, string>;

export interface ReceiptAnalysisResult {
  category: ExpenseCategory;
  subcategory: string;
  confidence_score: number;
  notes: string | null;
  line_items: LineItem[];
  insights: string[];
  fields_needing_review: ReviewableField[];
}

export interface ExtractedReceiptData {
  merchant_name?: string;
  merchant_address?: string;
  transaction_date?: string;
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
  currency?: string;
  payment_method?: string;
  card_last_four?: string;
  line_items?: LineItem[];
}

export interface ProcessingState {
  step: "uploading" | "extracting" | "analyzing" | "saving" | "complete" | "error";
  message: string;
  progress: number;
  extractedData?: ExtractedReceiptData;
  receiptId?: string;
  category?: string;
  confidence_score?: number;
  review_flags?: ReviewableField[];
  needs_review?: boolean;
}

// Analytics types
export interface AnalyticsSummary {
  total_spent: number;
  receipt_count: number;
  avg_receipt: number;
}

export interface CategorySpending {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
}

export interface ItemCategorySpending {
  category: ItemCategory;
  total: number;
  count: number;
  percentage: number;
}

export interface MerchantSpending {
  name: string;
  total: number;
  count: number;
}

export interface DailySpending {
  date: string;
  total: number;
  count: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  by_category: CategorySpending[];
  by_item_category: ItemCategorySpending[];
  top_merchants: MerchantSpending[];
  daily_spending: DailySpending[];
  insights: string[];
}
