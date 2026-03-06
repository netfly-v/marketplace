'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  LogIn,
  LogOut,
  Search,
  Plus,
  User as UserIcon,
  Loader2,
  Menu,
  Package,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useCartControllerGetCart } from '@/generated/api/cart/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/auth.store';

function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebounce(searchValue);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = debouncedSearch.trim();
    if (trimmed) {
      params.set('search', trimmed);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    const target = pathname === '/products' ? `/products?${params.toString()}` : `/products?${params.toString()}`;
    router.push(target);
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps -- only trigger on debounced value change

  return (
    <div className="ml-auto flex max-w-sm flex-1 items-center gap-2">
      <div className="relative w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          className="pl-8"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
        />
      </div>
    </div>
  );
}

function MiniCart() {
  const { data: cart } = useCartControllerGetCart();
  const count = cart?.itemsCount ?? 0;

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  const isSeller = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const NavLinks = useMemo(
    () => (
      <>
        <Link
          href="/products"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Catalog
        </Link>
        {isSeller && (
          <Link
            href="/products/new"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              New Product
            </span>
          </Link>
        )}
      </>
    ),
    [isSeller]
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <nav className="flex flex-col gap-4 pt-8">{NavLinks}</nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">Marketplace</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">{NavLinks}</nav>

        {/* Search */}
        <Suspense fallback={<div className="ml-auto max-w-sm flex-1" />}>
          <SearchBar />
        </Suspense>

        {/* Cart + Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated && <MiniCart />}
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                  <Badge variant="secondary" className="hidden text-[10px] sm:inline-flex">
                    {user.role}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="font-medium">{user.email}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <Package className="mr-2 h-4 w-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                {isSeller && (
                  <DropdownMenuItem asChild>
                    <Link href="/products/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Product
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
