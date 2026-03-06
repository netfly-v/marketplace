import type { QueryClient } from '@tanstack/react-query';

const PROTECTED_QUERY_PREFIXES = [
  '/api/auth/me',
  '/api/cart',
  '/api/orders',
  '/api/users/profile',
] as const;

export function clearProtectedQueries(queryClient: QueryClient): void {
  for (const prefix of PROTECTED_QUERY_PREFIXES) {
    queryClient.removeQueries({
      predicate: (query) => {
        const [firstKeyPart] = query.queryKey;
        return typeof firstKeyPart === 'string' && firstKeyPart.startsWith(prefix);
      },
    });
  }
}
