"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileImage, AlertCircle } from "lucide-react";
import { cn, isValidReceiptFile, MAX_FILE_SIZE } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  error?: string | null;
}

export function UploadZone({ onFileSelect, error }: UploadZoneProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setValidationError(null);

      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];

      // Validate file type
      if (!isValidReceiptFile(file)) {
        setValidationError(
          "Please upload a JPEG, PNG, WebP image or PDF file"
        );
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setValidationError("File size must be less than 10MB");
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const displayError = validationError || error;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/5 scale-[1.02]"
            : "border-[var(--brand-black)]/10 hover:border-[var(--brand-orange)]/50 hover:bg-[var(--brand-cream)]",
          displayError && "border-red-300 bg-red-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {isDragActive ? (
            <>
              <div className="w-16 h-16 bg-[var(--brand-orange)]/10 rounded-2xl flex items-center justify-center">
                <FileImage className="h-8 w-8 text-[var(--brand-orange)]" />
              </div>
              <p className="text-[var(--brand-orange)] font-semibold">Drop your receipt here</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-[var(--brand-black)]/5 rounded-2xl flex items-center justify-center">
                <Upload className="h-8 w-8 text-[var(--brand-gray)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--brand-black)]">
                  Drag and drop your receipt here
                </p>
                <p className="text-sm text-[var(--brand-gray)] mt-1">
                  or click to browse files
                </p>
              </div>
              <p className="text-xs text-[var(--brand-gray)]">
                Supports JPEG, PNG, WebP, and PDF up to 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
