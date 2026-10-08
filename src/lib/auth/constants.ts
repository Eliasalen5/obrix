export const ROLES = {
  ADMIN: "ADMIN",
  COMERCIO: "COMERCIO",
  CLIENTE: "CLIENTE",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
