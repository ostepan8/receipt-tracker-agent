import { createServerClient } from "./client";

const BUCKET_NAME = "receipts";

export async function uploadReceipt(
  userId: string,
  file: Buffer,
  filename: string,
  contentType: string
): Promise<{ storagePath: string; signedUrl: string }> {
  const supabase = createServerClient();

  const ext = filename.split(".").pop() || "jpg";
  const storagePath = `receipts/${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  const { data: urlData, error: urlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (urlError || !urlData) {
    throw new Error(`Failed to create signed URL: ${urlError?.message}`);
  }

  return { storagePath, signedUrl: urlData.signedUrl };
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const supabase = createServerClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600);

  if (error || !data) {
    throw new Error(`Failed to get signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

export async function deleteReceiptFile(storagePath: string): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
