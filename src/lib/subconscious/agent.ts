import { Subconscious, zodToJsonSchema } from "subconscious";
import { z } from "zod";
import type {
  ReceiptAnalysisResult,
  ExpenseCategory,
  LineItem,
  ItemCategory,
  PriceRating,
  ReviewableField,
} from "../types";

let _client: Subconscious | null = null;

function getClient(): Subconscious {
  if (!_client) {
    if (!process.env.SUBCONSCIOUS_API_KEY) {
      throw new Error("SUBCONSCIOUS_API_KEY is not set");
    }
    _client = new Subconscious({
      apiKey: process.env.SUBCONSCIOUS_API_KEY,
    });
  }
  return _client;
}

// Flexible schema - AI can use any category tags
const LineItemAnalysis = z.object({
  name: z.string(),
  category: z.string().describe("Item category in Title Case (e.g., Coffee, Food, Tools, Hardware)"),
  description: z.string(),
  price_rating: z.enum(["great_deal", "good_deal", "fair_price", "overpriced", "ripoff"]),
  price_note: z.string(),
});

const ReceiptAnalysisSchema = z.object({
  category: z.string().describe("Expense category in Title Case with spaces (e.g., Meals & Entertainment, Office Supplies, Home Improvement)"),
  subcategory: z.string(),
  confidence_score: z.number(),
  notes: z.string(),
  line_items: z.array(LineItemAnalysis),
  insights: z.array(z.string()),
  overall_value: z.enum(["excellent", "good", "fair", "poor"]),
  overall_value_note: z.string(),
});

// Default expense categories in Title Case format
const DEFAULT_EXPENSE_CATEGORIES = [
  "Meals & Entertainment", "Travel & Transportation", "Office Supplies",
  "Software & Subscriptions", "Utilities", "Professional Services",
  "Equipment", "Marketing", "Healthcare", "Hardware", "Tools",
  "Home Improvement", "Other",
];

// Default item categories in Title Case format
const DEFAULT_ITEM_CATEGORIES = [
  "Coffee", "Food", "Alcohol", "Groceries", "Electronics",
  "Clothing", "Transportation", "Entertainment", "Health",
  "Home", "Office", "Software", "Services", "Tools",
  "Hardware", "Beverage", "Other",
];

// Map price ratings to valid values
const PRICE_RATING_MAP: Record<string, PriceRating> = {
  "great_deal": "great_deal",
  "good_deal": "good_deal",
  "fair_price": "fair_price",
  "overpriced": "overpriced",
  "ripoff": "ripoff",
  // Common variations
  "great": "great_deal",
  "excellent": "great_deal",
  "good": "good_deal",
  "fair": "fair_price",
  "average": "fair_price",
  "normal": "fair_price",
  "expensive": "overpriced",
  "pricey": "overpriced",
  "high": "overpriced",
  "bad": "ripoff",
  "terrible": "ripoff",
};

// Convert to Title Case format (e.g., "home_improvement" -> "Home Improvement")
function toTitleCase(str: string): string {
  return str
    // Replace underscores and hyphens with spaces
    .replace(/[_-]/g, " ")
    // Capitalize first letter of each word
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function normalizeCategory(raw: string | undefined | null): ExpenseCategory {
  if (!raw) return "Other";
  // If already looks like Title Case (has spaces or starts with uppercase), keep it
  if (/^[A-Z]/.test(raw) && /\s/.test(raw)) return raw;
  return toTitleCase(raw);
}

function normalizeItemCategory(raw: string | undefined | null): ItemCategory {
  if (!raw) return "Other";
  // If already looks like Title Case, keep it
  if (/^[A-Z]/.test(raw)) return raw;
  return toTitleCase(raw);
}

function normalizePriceRating(raw: string | undefined | null): PriceRating {
  if (!raw) return "fair_price";
  const key = raw.toLowerCase().replace(/[^a-z_]/g, "");
  return PRICE_RATING_MAP[key] || "fair_price";
}

interface RawLineItem {
  name: string;
  category: string;
  description: string;
  price_rating: string;
  price_note: string;
}

function parseLineItems(raw: unknown): RawLineItem[] {
  // If it's already an array, return it
  if (Array.isArray(raw)) return raw;
  // If it's a JSON string, parse it
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Failed to parse line_items string
    }
  }
  return [];
}

function parseInsights(raw: unknown): string[] {
  // If it's already an array, return it
  if (Array.isArray(raw)) return raw.map(i => String(i));
  // If it's a string (single insight or JSON array)
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(i => String(i));
    } catch {
      // Not JSON, return as single insight
      return [raw];
    }
  }
  return [];
}

function parseConfidenceScore(raw: unknown): number {
  if (typeof raw === "number") return Math.min(1, Math.max(0, raw));
  if (typeof raw === "string") {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) return Math.min(1, Math.max(0, parsed));
  }
  return 0.8;
}

export async function analyzeReceipt(
  extractedData: Record<string, unknown>,
  recentReceipts: Array<{
    id: string;
    merchant_name: string;
    total: number;
    transaction_date: string;
    category: string;
    line_items?: LineItem[];
  }>
): Promise<ReceiptAnalysisResult> {
  const originalLineItems = (extractedData.line_items as LineItem[]) || [];

  // Collect existing categories from user's receipts
  const existingExpenseCategories = new Set<string>();
  const existingItemCategories = new Set<string>();

  recentReceipts.forEach(r => {
    if (r.category) existingExpenseCategories.add(r.category);
    r.line_items?.forEach(item => {
      if (item.category) existingItemCategories.add(item.category);
    });
  });

  // Combine with defaults
  const allExpenseCategories = [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...existingExpenseCategories])];
  const allItemCategories = [...new Set([...DEFAULT_ITEM_CATEGORIES, ...existingItemCategories])];

  try {

    const itemsList = originalLineItems
      .map((item, i) => `${i + 1}. "${item.name}" - $${item.total}`)
      .join("\n");

    const run = await getClient().run({
      engine: "tim-gpt",
      input: {
        instructions: `Analyze this receipt and categorize it.

RECEIPT DATA:
- Merchant: ${extractedData.merchant_name || "Unknown"}
- Date: ${extractedData.transaction_date || "Unknown"}
- Subtotal: $${extractedData.subtotal || 0}
- Tax: $${extractedData.tax || 0}
- Tip: $${extractedData.tip || 0}
- Total: $${extractedData.total || 0}

LINE ITEMS TO ANALYZE:
${itemsList || "No items"}

EXISTING CATEGORIES USED BY THIS USER:
- Expense categories: ${allExpenseCategories.join(", ")}
- Item categories: ${allItemCategories.join(", ")}

CATEGORY INSTRUCTIONS:
- Use Title Case with spaces for categories (e.g., "Home Improvement", "Office Supplies", "Meals & Entertainment")
- You can use any of the existing categories above OR create new ones if needed
- Be specific - if something is clearly "Hardware" or "Tools", use that instead of "Other"
- For expense category, think about what type of business expense this is
- For item categories, think about what type of product/service each line item is
- NEVER use snake_case or camelCase - always use proper Title Case with spaces

REQUIRED OUTPUT FORMAT:
{
  "category": "string - expense category (use existing or create new)",
  "subcategory": "string describing subcategory",
  "confidence_score": 0.0-1.0,
  "notes": "string with analysis notes",
  "line_items": [
    {
      "name": "EXACT item name from input",
      "category": "string - item category (use existing or create new)",
      "description": "brief description of item",
      "price_rating": "great_deal" | "good_deal" | "fair_price" | "overpriced" | "ripoff",
      "price_note": "reason for rating"
    }
  ],
  "insights": ["insight 1", "insight 2"],
  "overall_value": "excellent" | "good" | "fair" | "poor",
  "overall_value_note": "explanation"
}

CRITICAL RULES:
1. line_items MUST be a JSON array, NOT a string
2. Each line item MUST have field "name" (not "item")
3. Return one line_items entry for EACH input item, in the SAME order
4. confidence_score MUST be a decimal number (e.g., 0.95), not a string
5. insights MUST be a JSON array of strings, not a single string
6. Be opinionated about prices - assess if they're good deals or overpriced
7. Use Title Case with spaces for ALL category values (e.g., "Office Supplies", "Home Improvement", "Coffee")`,
        answerFormat: zodToJsonSchema(ReceiptAnalysisSchema, "ReceiptAnalysis"),
        tools: [],
      },
      options: { awaitCompletion: true },
    });

    if (run.status !== "succeeded") {
      throw new Error(`Run failed: ${run.status}`);
    }

    // With answerFormat, result.answer is already a parsed object
    // But we need to handle potential edge cases in the response
    const rawResponse = run.result?.answer as unknown as Record<string, unknown>;

    if (!rawResponse) {
      throw new Error("No result from agent");
    }

    // Parse line_items - might be an array or a JSON string
    const aiLineItems = parseLineItems(rawResponse.line_items);

    // Build enhanced line items by matching with original items by index
    // The AI returns items in the same order as provided in the prompt
    const enhancedLineItems: LineItem[] = originalLineItems.map((original, index) => {
      const aiItem = aiLineItems[index];

      return {
        ...original,
        category: normalizeItemCategory(aiItem?.category),
        description: aiItem?.description || undefined,
        price_rating: normalizePriceRating(aiItem?.price_rating),
        price_note: aiItem?.price_note || undefined,
      };
    });

    // Parse and normalize the response
    const result: ReceiptAnalysisResult = {
      category: normalizeCategory(rawResponse.category as string),
      subcategory: (rawResponse.subcategory as string) || "general",
      confidence_score: parseConfidenceScore(rawResponse.confidence_score),
      notes: `${rawResponse.notes || ""}\n\nOverall Value: ${rawResponse.overall_value_note || ""}`.trim(),
      line_items: enhancedLineItems,
      insights: parseInsights(rawResponse.insights),
      fields_needing_review: [],
    };

    return result;
  } catch {
    return createFallbackAnalysis(extractedData, originalLineItems);
  }
}

function createFallbackAnalysis(
  extractedData: Record<string, unknown>,
  lineItems: LineItem[]
): ReceiptAnalysisResult {
  const merchantName = ((extractedData.merchant_name as string) || "").toLowerCase();

  let category: ExpenseCategory = "Other";
  let subcategory = "General";
  let defaultCategory: ItemCategory = "Other";

  if (/starbucks|coffee|cafe|peet/.test(merchantName)) {
    category = "Meals & Entertainment";
    subcategory = "Coffee Shop";
    defaultCategory = "Coffee";
  } else if (/restaurant|mcdonald|subway|pizza|bar|grill|steakhouse|outback|walmart|target/.test(merchantName)) {
    category = "Meals & Entertainment";
    subcategory = "Dining";
    defaultCategory = "Food";
  } else if (/uber|lyft|taxi|airline|hotel|gas|shell|chevron/.test(merchantName)) {
    category = "Travel & Transportation";
    subcategory = "Transportation";
    defaultCategory = "Transportation";
  }

  const enhancedItems: LineItem[] = lineItems.map((item) => ({
    ...item,
    category: guessItemCategory(item.name) || defaultCategory,
    price_rating: "fair_price" as PriceRating,
    price_note: "Unable to assess - AI unavailable",
  }));

  const fieldsNeedingReview: ReviewableField[] = [];
  if (!extractedData.merchant_name) fieldsNeedingReview.push("merchant_name");
  if (!extractedData.total) fieldsNeedingReview.push("total");

  return {
    category,
    subcategory,
    confidence_score: 0.5,
    notes: "Fallback analysis - AI agent was unavailable",
    line_items: enhancedItems,
    insights: [],
    fields_needing_review: fieldsNeedingReview,
  };
}

function guessItemCategory(itemName: string): ItemCategory | null {
  const name = itemName.toLowerCase();
  if (/coffee|latte|espresso|cappuccino|mocha/.test(name)) return "Coffee";
  if (/beer|wine|cocktail|margarita|whiskey|lager|ale/.test(name)) return "Alcohol";
  if (/sandwich|burger|salad|soup|chicken|pizza|steak|fillet|ribeye/.test(name)) return "Food";
  if (/cheesecake|cake|dessert|pie|brownie/.test(name)) return "Food";
  if (/shirt|pants|dress|shoes|jacket|hoodie|socks|crew/.test(name)) return "Clothing";
  return null;
}

export async function generateReportSummary(
  receipts: Array<{
    merchant_name: string;
    total: number;
    category: string;
    transaction_date: string;
  }>,
  categoryBreakdown: Record<string, number>
): Promise<string> {
  try {
    const run = await getClient().run({
      engine: "tim-gpt",
      input: {
        instructions: `Generate a brief expense report summary. No markdown.

RECEIPTS: ${JSON.stringify(receipts)}
CATEGORY TOTALS: ${JSON.stringify(categoryBreakdown)}

Write 2-3 sentences about total spending, top categories, and patterns.`,
        tools: [],
      },
      options: { awaitCompletion: true },
    });

    return (run.result?.answer as string) || "No summary available.";
  } catch {
    return "Unable to generate summary at this time.";
  }
}
