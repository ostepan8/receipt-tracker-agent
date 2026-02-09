import { getServerAuth } from "@/lib/firebase/server-auth";
import { NextRequest } from "next/server";
import { createReceipt, updateReceipt, getRecentReceipts, ensureUserExists } from "@/lib/supabase/queries";
import { uploadReceipt } from "@/lib/supabase/storage";
import { extractReceiptData } from "@/lib/reducto/extract";
import { analyzeReceipt } from "@/lib/subconscious/agent";
import type { ExtractedReceiptData, ReviewableField } from "@/lib/types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Check if mock mode is enabled
function isMockMode(): boolean {
  return process.env.MOCK === "true" || process.env.MOCK === "1";
}

// Helper to send SSE event
function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: {
    step: string;
    message: string;
    progress: number;
    extractedData?: ExtractedReceiptData;
    receiptId?: string;
    error?: string;
    complete?: boolean;
    category?: string;
    confidence_score?: number;
    review_flags?: ReviewableField[];
    needs_review?: boolean;
  }
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Auth check
        sendEvent(controller, encoder, {
          step: "uploading",
          message: "Verifying your account...",
          progress: 5,
        });

        const { userId, email, name } = await getServerAuth();
        if (!userId) {
          sendEvent(controller, encoder, {
            step: "error",
            message: "Please sign in to upload receipts",
            progress: 0,
            error: "Unauthorized",
          });
          controller.close();
          return;
        }

        // Ensure user exists in database
        if (email) {
          await ensureUserExists(userId, email, name || null);
        }

        // 2. Parse form data
        sendEvent(controller, encoder, {
          step: "uploading",
          message: "Processing your file...",
          progress: 10,
        });

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
          sendEvent(controller, encoder, {
            step: "error",
            message: "No file was provided",
            progress: 0,
            error: "No file provided",
          });
          controller.close();
          return;
        }

        // 3. Validate file
        if (!ALLOWED_TYPES.includes(file.type)) {
          sendEvent(controller, encoder, {
            step: "error",
            message: "Unsupported file type. Please upload JPEG, PNG, WebP, or PDF.",
            progress: 0,
            error: "Invalid file type",
          });
          controller.close();
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          sendEvent(controller, encoder, {
            step: "error",
            message: "File too large. Maximum size is 10MB.",
            progress: 0,
            error: "File too large",
          });
          controller.close();
          return;
        }

        sendEvent(controller, encoder, {
          step: "uploading",
          message: "Creating receipt record...",
          progress: 15,
        });

        // 4. Create pending receipt
        const receipt = await createReceipt(userId, {
          status: "processing",
          file_type: file.type,
          original_filename: file.name,
          storage_path: "",
        });

        sendEvent(controller, encoder, {
          step: "uploading",
          message: "Uploading to secure storage...",
          progress: 20,
          receiptId: receipt.id,
        });

        // 5. Upload to storage (or mock)
        let storagePath: string;
        let extraction: ExtractedReceiptData;

        if (isMockMode()) {
          storagePath = `mock/receipts/${userId}/${crypto.randomUUID()}.mock`;
          await updateReceipt(receipt.id, { storage_path: storagePath });

          sendEvent(controller, encoder, {
            step: "extracting",
            message: "Scanning receipt...",
            progress: 30,
            receiptId: receipt.id,
          });

          extraction = await extractReceiptData("");
        } else {
          const buffer = Buffer.from(await file.arrayBuffer());
          const { storagePath: realPath, signedUrl } = await uploadReceipt(
            userId,
            buffer,
            file.name,
            file.type
          );
          storagePath = realPath;
          await updateReceipt(receipt.id, { storage_path: storagePath });

          // Extraction with progress updates
          sendEvent(controller, encoder, {
            step: "extracting",
            message: "AI is reading your receipt...",
            progress: 30,
            receiptId: receipt.id,
          });

          extraction = await extractReceiptData(signedUrl);
        }

        // 6. Show extracted data
        sendEvent(controller, encoder, {
          step: "extracting",
          message: `Found ${extraction.line_items?.length || 0} items from ${extraction.merchant_name || "Unknown Merchant"}`,
          progress: 60,
          receiptId: receipt.id,
          extractedData: extraction,
        });

        // 7. Analyze with agent
        sendEvent(controller, encoder, {
          step: "analyzing",
          message: "AI is categorizing your expense...",
          progress: 70,
          receiptId: receipt.id,
          extractedData: extraction,
        });

        const recentReceipts = await getRecentReceipts(userId, 30);

        sendEvent(controller, encoder, {
          step: "analyzing",
          message: "Categorizing items...",
          progress: 75,
          receiptId: receipt.id,
          extractedData: extraction,
        });

        const analysis = await analyzeReceipt(
          extraction as unknown as Record<string, unknown>,
          recentReceipts
        );

        sendEvent(controller, encoder, {
          step: "analyzing",
          message: `Categorized as ${analysis.category.replace(/_/g, " ")}`,
          progress: 85,
          receiptId: receipt.id,
          extractedData: extraction,
          category: analysis.category,
        });

        // 8. Save to database
        sendEvent(controller, encoder, {
          step: "saving",
          message: "Saving your receipt...",
          progress: 90,
          receiptId: receipt.id,
          extractedData: extraction,
          category: analysis.category,
        });

        // Determine if needs review - only for serious issues
        // Critical fields that must be present: merchant_name, total
        const criticalFieldsMissing = analysis.fields_needing_review.some(
          f => f === "merchant_name" || f === "total"
        );
        const needsReview = criticalFieldsMissing || analysis.confidence_score < 0.5;

        await updateReceipt(receipt.id, {
          merchant_name: extraction.merchant_name,
          merchant_address: extraction.merchant_address,
          transaction_date: extraction.transaction_date,
          subtotal: extraction.subtotal,
          tax: extraction.tax,
          tip: extraction.tip,
          total: extraction.total,
          currency: extraction.currency || "USD",
          payment_method: extraction.payment_method,
          card_last_four: extraction.card_last_four,
          line_items: analysis.line_items, // Use categorized line items from AI
          category: analysis.category,
          subcategory: analysis.subcategory,
          confidence_score: analysis.confidence_score,
          review_flags: analysis.fields_needing_review,
          is_duplicate: false,
          duplicate_of: null,
          agent_notes: analysis.notes,
          raw_extraction: extraction as Record<string, unknown>,
          status: needsReview ? "needs_review" : "completed",
        });

        // 9. Complete!
        sendEvent(controller, encoder, {
          step: "complete",
          message: needsReview ? "Receipt needs review" : "Receipt processed successfully!",
          progress: 100,
          receiptId: receipt.id,
          extractedData: extraction,
          category: analysis.category,
          confidence_score: analysis.confidence_score,
          review_flags: analysis.fields_needing_review,
          needs_review: needsReview,
          complete: true,
        });

        controller.close();
      } catch (error) {
        sendEvent(controller, encoder, {
          step: "error",
          message: error instanceof Error ? error.message : "Processing failed",
          progress: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
