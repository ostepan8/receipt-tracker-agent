"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--brand-cream)] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-[var(--brand-orange)]/20 border-t-[var(--brand-orange)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      {/* Dashboard Header */}
      <header className="bg-[var(--brand-black)] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/Subconscious_Logo_Graphic.png"
              alt="Subconscious"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-white">Receipt Agent</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-white/60">
            <a
              href="https://subconscious.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/ostepan8/receipt-tracker-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
