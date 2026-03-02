import type { Role } from '@prisma/client';
import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
  cookies: Record<string, string | undefined>;
};
