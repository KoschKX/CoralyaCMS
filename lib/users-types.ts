/**
 * User types and role definitions for CoralyaCMS.
 * Safe to import in both server and client environments — no runtime code.
 */

export const USER_ROLES = ["administrator", "editor", "author"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  administrator: "Administrator",
  editor: "Editor",
  author: "Author",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  administrator: "Full access to all settings, users, and content.",
  editor: "Can manage all pages and content, but not users or settings.",
  author: "Can create and edit their own pages.",
};

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** User object without the password hash — safe to send to clients. */
export type PublicUser = Omit<User, "passwordHash">;
