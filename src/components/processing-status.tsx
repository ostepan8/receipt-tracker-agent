"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileSearch,
  Sparkles,
  Save,
  CheckCircle,
  XCircle,
  Store,
  Receipt,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessingState } from "@/lib/types";

interface ProcessingStatusProps {
  state: ProcessingState;
}

const STEPS = [
  { key: "uploading", label: "Upload", icon: Upload },
  { key: "extracting", label: "Read", icon: FileSearch },
  { key: "analyzing", label: "Analyze", icon: Sparkles },
  { key: "saving", label: "Save", icon: Save },
  { key: "complete", label: "Done", icon: CheckCircle },
];

export function ProcessingStatus({ state }: ProcessingStatusProps) {
  const currentStepIndex = STEPS.findIndex((s) => s.key === state.step);
  const isError = state.step === "error";
  const hasExtractedData = state.extractedData && state.extractedData.merchant_name;

  return (
    <div className="space-y-6">
      <Card className="border-[var(--brand-black)]/5 shadow-none">
        <CardContent className="pt-6 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--brand-black)] font-medium">{state.message}</span>
              <span className="text-[var(--brand-gray)] tabular-nums">{state.progress}%</span>
            </div>
            <div className="h-3 bg-[var(--brand-cream)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--brand-orange)] to-[var(--brand-teal)] rounded-full transition-all duration-500"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between px-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                      isComplete && "bg-[var(--brand-teal)]/10 text-[var(--brand-teal)] scale-100",
                      isActive && "bg-[var(--brand-orange)]/10 text-[var(--brand-orange)] scale-110 ring-2 ring-[var(--brand-orange)]/20",
                      isPending && "bg-[var(--brand-cream)] text-[var(--brand-gray)]",
                      isError && index === currentStepIndex && "bg-red-100 text-red-600"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isComplete && "text-[var(--brand-teal)]",
                      isActive && "text-[var(--brand-orange)]",
                      isPending && "text-[var(--brand-gray)]",
                      isError && index === currentStepIndex && "text-red-600"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Error State */}
          {isError && (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-red-600">
              <XCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{state.message}</span>
            </div>
          )}

          {/* Loading Animation */}
          {!isError && state.step !== "complete" && !hasExtractedData && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-[var(--brand-orange)] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-sm text-[var(--brand-gray)]">This usually takes 10-30 seconds</p>
            </div>
          )}

          {/* Success Animation */}
          {state.step === "complete" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-16 h-16 bg-[var(--brand-teal)]/10 rounded-2xl flex items-center justify-center animate-scale-in">
                <CheckCircle className="h-8 w-8 text-[var(--brand-teal)]" />
              </div>
              <p className="text-[var(--brand-teal)] font-semibold">Receipt processed!</p>
              <p className="text-sm text-[var(--brand-gray)]">Redirecting to your receipt...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Data Preview */}
      {hasExtractedData && state.step !== "complete" && (
        <Card className="overflow-hidden animate-slide-up border-[var(--brand-black)]/5 shadow-lg">
          <div className="bg-[var(--brand-black)] px-4 py-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[var(--brand-green)]" />
              Found Receipt Data
            </h3>
          </div>
          <CardContent className="pt-4 space-y-4">
            {/* Merchant */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[var(--brand-cream)] rounded-xl flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-[var(--brand-black)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--brand-black)]">
                  {state.extractedData?.merchant_name}
                </p>
                {state.extractedData?.merchant_address && (
                  <p className="text-sm text-[var(--brand-gray)] mt-0.5">
                    {state.extractedData.merchant_address}
                  </p>
                )}
              </div>
            </div>

            {/* Total */}
            {state.extractedData?.total && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--brand-teal)]/10 rounded-xl flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-[var(--brand-teal)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--brand-black)]">
                    ${state.extractedData.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-[var(--brand-gray)]">
                    {state.extractedData.transaction_date && (
                      <>on {new Date(state.extractedData.transaction_date).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Line Items Preview */}
            {state.extractedData?.line_items && state.extractedData.line_items.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[var(--brand-orange)]/10 rounded-xl flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-5 w-5 text-[var(--brand-orange)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--brand-black)]">
                    {state.extractedData.line_items.length} items
                  </p>
                  <div className="mt-1 space-y-1">
                    {state.extractedData.line_items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-[var(--brand-gray)] truncate mr-2">{item.name}</span>
                        <span className="text-[var(--brand-black)] tabular-nums shrink-0 font-medium">
                          ${item.total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {state.extractedData.line_items.length > 3 && (
                      <p className="text-xs text-[var(--brand-gray)]">
                        +{state.extractedData.line_items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Processing indicator */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--brand-black)]/5">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-[var(--brand-orange)] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--brand-orange)] font-medium">
                {state.step === "analyzing" ? "AI is categorizing..." : "Finishing up..."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes slide-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
