import { getServerAuth } from "@/lib/firebase/server-auth";
import { NextRequest, NextResponse } from "next/server";
import { getReceipt, updateReceipt, deleteReceipt } from "@/lib/supabase/queries";
import { deleteReceiptFile, getSignedUrl } from "@/lib/supabase/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const receipt = await getReceipt(id, userId);

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Generate a fresh signed URL for the image (skip for mock paths)
    let imageUrl: string | null = null;
    if (receipt.storage_path && !receipt.storage_path.startsWith("mock/")) {
      try {
        imageUrl = await getSignedUrl(receipt.storage_path);
      } catch {
        // Signed URL generation failed - continue without image
      }
    }

    return NextResponse.json({ receipt, imageUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify receipt exists and belongs to user
    const existingReceipt = await getReceipt(id, userId);
    if (!existingReceipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const body = await req.json();

    // Only allow updating certain fields
    const allowedFields = [
      "merchant_name",
      "merchant_address",
      "transaction_date",
      "subtotal",
      "tax",
      "tip",
      "total",
      "currency",
      "payment_method",
      "card_last_four",
      "category",
      "subcategory",
      "status",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const receipt = await updateReceipt(id, updates);
    return NextResponse.json({ receipt });
  } catch {
    return NextResponse.json(
      { error: "Failed to update receipt" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get receipt to find storage path
    const receipt = await getReceipt(id, userId);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Delete file from storage (skip for mock paths)
    if (receipt.storage_path && !receipt.storage_path.startsWith("mock/")) {
      try {
        await deleteReceiptFile(receipt.storage_path);
      } catch {
        // Continue with database deletion even if storage delete fails
      }
    }

    // Delete receipt from database
    await deleteReceipt(id, userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete receipt" },
      { status: 500 }
    );
  }
}
