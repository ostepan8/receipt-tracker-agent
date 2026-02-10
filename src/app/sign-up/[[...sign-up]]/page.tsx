"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      // Small delay to ensure cookie is fully processed before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          setError("An account with this email already exists");
        } else if (err.message.includes("weak-password")) {
          setError("Password is too weak");
        } else if (err.message.includes("invalid-email")) {
          setError("Invalid email address");
        } else {
          setError("Failed to create account. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      // Small delay to ensure cookie is fully processed before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error && !err.message.includes("popup-closed")) {
        setError("Failed to sign up with Google");
      }
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--brand-cream)]">
        <div className="h-8 w-8 border-4 border-[var(--brand-orange)]/20 border-t-[var(--brand-orange)] rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render form if already signed in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[var(--brand-cream)] relative overflow-hidden">
      {/* Left side - Background screen mockup */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-[var(--brand-black)] relative items-center justify-center p-12">
        {/* Large semi-transparent logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Image
            src="/Subconscious_Logo_Graphic.png"
            alt=""
            width={600}
            height={600}
            className="object-contain"
          />
        </div>
        {/* Content */}
        <div className="relative z-10 max-w-lg text-center">
          <Image
            src="/Subconscious_Logo.png"
            alt="Subconscious"
            width={200}
            height={50}
            className="mx-auto mb-8"
          />
          <h2 className="text-3xl font-bold text-white mb-4">
            Start Tracking Smarter
          </h2>
          <p className="text-white/60 text-lg">
            Join thousands using AI to automate their expense management workflow.
          </p>
          {/* Decorative receipt preview */}
          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--brand-orange)]/20 flex items-center justify-center">
                <div className="w-5 h-5 rounded bg-[var(--brand-orange)]/50" />
              </div>
              <div className="flex-1 text-left">
                <div className="h-3 bg-white/20 rounded w-24 mb-1" />
                <div className="h-2 bg-white/10 rounded w-16" />
              </div>
              <div className="h-4 bg-[var(--brand-teal)]/30 rounded w-16" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-2 bg-white/10 rounded w-20" />
                <div className="h-2 bg-white/10 rounded w-12" />
              </div>
              <div className="flex justify-between">
                <div className="h-2 bg-white/10 rounded w-24" />
                <div className="h-2 bg-white/10 rounded w-10" />
              </div>
              <div className="flex justify-between">
                <div className="h-2 bg-white/10 rounded w-16" />
                <div className="h-2 bg-white/10 rounded w-14" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between">
              <div className="h-3 bg-white/20 rounded w-12" />
              <div className="h-3 bg-[var(--brand-green)]/40 rounded w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sign up form */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand-teal)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--brand-orange)]/10 rounded-full blur-3xl" />

        <div className="w-full max-w-sm relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-[var(--brand-black)]/5">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/Subconscious_Logo_Graphic.png"
                alt="Subconscious"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <span className="font-bold text-lg text-[var(--brand-black)]">Receipt Agent</span>
            </Link>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--brand-black)]">Create account</h1>
            <p className="text-[var(--brand-gray)] mt-1">Start tracking your expenses</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[var(--brand-black)]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="mt-1 border-[var(--brand-black)]/10 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[var(--brand-black)]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                autoComplete="new-password"
                className="mt-1 border-[var(--brand-black)]/10 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-[var(--brand-black)]">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                className="mt-1 border-[var(--brand-black)]/10 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--brand-black)]/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[var(--brand-gray)]">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-[var(--brand-black)]/10 hover:bg-[var(--brand-cream)]"
            onClick={handleGoogleSignUp}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <p className="mt-6 text-center text-sm text-[var(--brand-gray)]">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-[var(--brand-orange)] font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-[var(--brand-gray)]">
            <Link href="/" className="text-[var(--brand-teal)] font-medium hover:underline">
              Back to Home
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
