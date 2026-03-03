"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 py-24">
      <ShoppingBag className="h-20 w-20 text-primary" />
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome to Marketplace
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover amazing products from sellers around the world
        </p>
      </div>

      {isAuthenticated && user && (
        <p className="text-muted-foreground">
          Hello, <span className="font-medium text-foreground">{user.name}</span>!
        </p>
      )}

      <Button size="lg" asChild>
        <Link href="/products">
          Browse Catalog
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
