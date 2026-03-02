import { ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <ShoppingBag className="h-16 w-16 text-primary" />
      <h1 className="text-4xl font-bold">Marketplace</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
