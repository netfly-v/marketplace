export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: "USER" | "SELLER" | "ADMIN";
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AuthResponse = User;

export interface ApiError {
  message: string;
  statusCode: number;
}
