import Reducto from "reductoai";
import type { ExtractedReceiptData } from "../types";

// Check if mock mode is enabled
function isMockMode(): boolean {
  return process.env.MOCK === "true" || process.env.MOCK === "1";
}

// Lazy initialization to avoid build-time errors when env vars aren't set
let _reducto: Reducto | null = null;

function getReducto(): Reducto {
  if (!_reducto) {
    if (!process.env.REDUCTO_API_KEY) {
      throw new Error("REDUCTO_API_KEY is not set");
    }
    _reducto = new Reducto({
      apiKey: process.env.REDUCTO_API_KEY,
    });
  }
  return _reducto;
}

// Generate mock receipt for development testing
function generateMockReceipt(): ExtractedReceiptData {
  const merchants = [
    "Starbucks Coffee",
    "Uber",
    "Whole Foods Market",
    "Shell Gas Station",
    "The Cheesecake Factory",
    "Office Depot",
  ];
  const dayOffset = Math.floor(Math.random() * 7);
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);

  const total = Math.round((Math.random() * 150 + 10) * 100) / 100;
  const tax = Math.round(total * 0.0875 * 100) / 100;
  const subtotal = Math.round((total - tax) * 100) / 100;

  return {
    merchant_name: merchants[Math.floor(Math.random() * merchants.length)],
    transaction_date: date.toISOString().split("T")[0],
    subtotal,
    tax,
    total,
    currency: "USD",
    payment_method: "credit_card",
    line_items: [{ name: "Item", quantity: 1, total: subtotal }],
  };
}

const RECEIPT_SCHEMA = {
  type: "object",
  properties: {
    merchant_name: {
      type: "string",
      description:
        "The name of the business or merchant as shown on the receipt header or logo.",
    },
    merchant_address: {
      type: "string",
      description:
        "The full address of the merchant including street, city, state, and ZIP if present.",
    },
    transaction_date: {
      type: "string",
      description:
        "The date of the transaction in ISO 8601 format (YYYY-MM-DD). Look for date near the top or bottom of the receipt.",
    },
    subtotal: {
      type: "number",
      description:
        "The subtotal amount before tax and tip. This is the sum of all line items.",
    },
    tax: {
      type: "number",
      description:
        "The tax amount charged. May be labeled as 'Tax', 'Sales Tax', 'VAT', etc.",
    },
    tip: {
      type: "number",
      description:
        "The tip or gratuity amount, if present. May be handwritten.",
    },
    total: {
      type: "number",
      description:
        "The final total amount charged. This is the bottom-line number on the receipt.",
    },
    currency: {
      type: "string",
      description:
        "The currency code (e.g., 'USD', 'EUR', 'GBP'). Infer from currency symbols or merchant location.",
    },
    payment_method: {
      type: "string",
      description:
        "The payment method used: 'credit_card', 'debit_card', 'cash', 'apple_pay', 'google_pay', or 'other'.",
    },
    card_last_four: {
      type: "string",
      description:
        "The last four digits of the card used for payment, if visible on the receipt.",
    },
    line_items: {
      type: "array",
      description: "Individual items purchased, listed on the receipt.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name or description of the item.",
          },
          quantity: {
            type: "number",
            description:
              "The quantity purchased. Default to 1 if not specified.",
          },
          unit_price: {
            type: "number",
            description: "The price per unit of the item.",
          },
          total: {
            type: "number",
            description:
              "The total price for this line item (quantity × unit_price).",
          },
        },
        required: ["name", "total"],
      },
    },
  },
  required: ["merchant_name", "total"],
};

export async function extractReceiptData(
  documentUrl: string
): Promise<ExtractedReceiptData> {
  // Use mock data if MOCK mode is enabled
  if (isMockMode()) {
    // Simulate a small delay like a real API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    return generateMockReceipt();
  }

  try {
    const response = await getReducto().extract.run({
      input: documentUrl,
      instructions: {
        schema: RECEIPT_SCHEMA,
        system_prompt:
          "Extract receipt data with high precision. For handwritten amounts (like tips), use your best interpretation. If a field is not visible on the receipt, omit it rather than guessing. Dates should be in YYYY-MM-DD format.",
      },
    });

    // The result contains the extracted data
    // V3ExtractResponse has { result: unknown | Array<unknown>, usage: ..., job_id?: ... }
    // Handle both sync and async response types
    let extractedData: unknown;
    if ("result" in response) {
      // V3ExtractResponse - result is the extracted data
      const result = response.result;
      // If result is an array, take the first item (for non-chunked extraction)
      extractedData = Array.isArray(result) ? result[0] : result;
    } else if ("job_id" in response) {
      // AsyncExtractResponse - we got a job_id, need to poll for result
      throw new Error("Async extraction not supported - received job_id instead of result");
    } else {
      extractedData = response;
    }

    return extractedData as ExtractedReceiptData;
  } catch (error) {
    throw new Error(
      `Failed to extract receipt data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
