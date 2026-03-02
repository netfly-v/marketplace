"use client";

import Link from "next/link";
import { ShoppingBag, LogIn, UserPlus, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <ShoppingBag className="h-16 w-16 text-primary" />
      <h1 className="text-4xl font-bold">Marketplace</h1>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : isAuthenticated && user ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">
            Welcome, <span className="font-medium text-foreground">{user.name}</span>!
          </p>
          <p className="text-sm text-muted-foreground">
            Role: <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs">{user.role}</span>
          </p>
          <Button variant="outline" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
