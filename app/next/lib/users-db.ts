/**
 * User database operations.
 * Server-only — uses Node.js 'fs' and 'crypto'. Do NOT import in client components.
 *
 * Passwords are hashed with scrypt (N=32768, r=8, p=1, dkLen=64).
 * User data is stored in data/users.json using the same write-queue pattern
 * as pages-db and settings-db to prevent concurrent write races.
 */

import fs from "fs";
import path from "path";
import {
  randomUUID,
  scrypt,
  randomBytes,
  timingSafeEqual as nodeTimingSafeEqual,
} from "crypto";
import { promisify } from "util";
import type { User, UserRole, PublicUser } from "@/lib/users-types";
import { createWriteQueue } from "@/lib/utils/write-queue";
import { createJsonStore } from "@/lib/utils/json-store";

const scryptAsync = promisify(scrypt);
const USERS_FILE = path.join(process.cwd(), "data", "users.json");

// ── Cache + write-queue ───────────────────────────────────────────────────────

const { readAll: readUsers, writeAll: writeUsers } = createJsonStore<User>(USERS_FILE);
const serialise = createWriteQueue();

// ── Password hashing (scrypt) ─────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  try {
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashBuf = Buffer.from(hash, "hex");
    return nodeTimingSafeEqual(derived, hashBuf);
  } catch {
    return false;
  }
}

// ── Public read API ───────────────────────────────────────────────────────────

export function getUsers(): PublicUser[] {
  return readUsers().map(({ passwordHash: _ph, ...u }) => u);
}

export function getUserById(id: string): User | undefined {
  return readUsers().find((u) => u.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return readUsers().find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
}

// ── Write API ─────────────────────────────────────────────────────────────────

export async function createUser(data: {
  username: string;
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<PublicUser> {
  return serialise(async () => {
    const users = readUsers();

    if (
      users.find(
        (u) => u.username.toLowerCase() === data.username.toLowerCase(),
      )
    ) {
      throw new Error("Username already exists");
    }

    if (
      data.email &&
      users.find(
        (u) => u.email && u.email.toLowerCase() === data.email.toLowerCase(),
      )
    ) {
      throw new Error("Email already in use");
    }

    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      username: data.username,
      displayName: data.displayName || data.username,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      createdAt: now,
      updatedAt: now,
    };

    writeUsers([...users, user]);
    const { passwordHash: _ph, ...publicUser } = user;
    return publicUser;
  });
}

export async function updateUser(
  id: string,
  data: {
    displayName?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  },
): Promise<PublicUser> {
  return serialise(async () => {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error("User not found");

    if (data.email) {
      const conflict = users.find(
        (u) =>
          u.id !== id &&
          u.email &&
          u.email.toLowerCase() === data.email!.toLowerCase(),
      );
      if (conflict) throw new Error("Email already in use");
    }

    const user = { ...users[idx] };
    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.email !== undefined) user.email = data.email;
    if (data.role !== undefined) user.role = data.role;
    if (data.password) user.passwordHash = await hashPassword(data.password);
    user.updatedAt = new Date().toISOString();

    users[idx] = user;
    writeUsers(users);
    const { passwordHash: _ph, ...publicUser } = user;
    return publicUser;
  });
}

export async function deleteUser(id: string): Promise<void> {
  await serialise(() => {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error("User not found");

    const user = users[idx];
    if (user.role === "administrator") {
      const adminCount = users.filter((u) => u.role === "administrator").length;
      if (adminCount <= 1) {
        throw new Error("Cannot delete the last administrator");
      }
    }

    writeUsers(users.filter((u) => u.id !== id));
  });
}

/**
 * Create a default admin user from env vars if the users list is empty.
 * Called on the first login attempt so existing deployments migrate seamlessly.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  const users = readUsers();
  if (users.length > 0) return;

  const password = process.env.ADMIN_PASSWORD ?? "admin";
  await createUser({
    username: "admin",
    displayName: "Administrator",
    email: "",
    password,
    role: "administrator",
  });
}
