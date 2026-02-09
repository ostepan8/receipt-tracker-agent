"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { LogOut } from "lucide-react";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      // Clear the session cookie
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || "?";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
      >
        {user.photoURL && !imageError ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="h-9 w-9 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {user.photoURL && !imageError ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="h-10 w-10 rounded-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-medium">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                {user.displayName && (
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.displayName}
                  </p>
                )}
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
