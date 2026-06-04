"use client";

import { useState, useEffect, useCallback } from "react";
import {
  USER_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type UserRole,
  type PublicUser,
} from "@/lib/users-types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  username: string;
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
}

const EMPTY_FORM: FormState = {
  username: "",
  displayName: "",
  email: "",
  password: "",
  role: "author",
};

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<UserRole, string> = {
  administrator:
    "bg-violet-100 text-violet-700 border border-violet-200",
  editor: "bg-blue-100 text-blue-700 border border-blue-200",
  author: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

// ── Form component ────────────────────────────────────────────────────────────

function UserForm({
  initial,
  isEdit,
  onSave,
  onCancel,
  isSelf,
}: {
  initial: FormState;
  isEdit: boolean;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
  isSelf: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-300 bg-zinc-50 p-5 space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        {!isEdit && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              required
              autoFocus
              placeholder="john_doe"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
            />
          </div>
        )}
        <div className={isEdit ? "col-span-2" : ""}>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Display Name
          </label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder="John Doe"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="john@example.com"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          {isEdit ? "New Password" : "Password"}{" "}
          {!isEdit && <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          required={!isEdit}
          placeholder={isEdit ? "Leave blank to keep current" : "Min. 6 characters"}
          minLength={form.password ? 6 : undefined}
          autoComplete="new-password"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          value={form.role}
          onChange={(e) => set("role", e.target.value as UserRole)}
          disabled={isSelf}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none disabled:opacity-50"
        >
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]} — {ROLE_DESCRIPTIONS[r]}
            </option>
          ))}
        </select>
        {isSelf && (
          <p className="mt-1 text-xs text-zinc-400">
            You cannot change your own role.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create user"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setFetchError(null);
    try {
      const [usersRes, meRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/users/me"),
      ]);
      if (!usersRes.ok) throw new Error("Failed to load users");
      const [usersData, meData] = await Promise.all([
        usersRes.json() as Promise<PublicUser[]>,
        meRes.ok ? (meRes.json() as Promise<{ id: string }>) : Promise.resolve(null),
      ]);
      setUsers(usersData);
      if (meData) setCurrentUserId(meData.id);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreate(data: FormState) {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: unknown };
      const msg =
        typeof body.error === "string"
          ? body.error
          : "Failed to create user";
      throw new Error(msg);
    }
    setShowAdd(false);
    await fetchUsers();
  }

  async function handleUpdate(id: string, data: FormState) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: data.displayName,
        email: data.email,
        password: data.password || undefined,
        role: data.role,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: unknown };
      const msg =
        typeof body.error === "string"
          ? body.error
          : "Failed to update user";
      throw new Error(msg);
    }
    setEditingId(null);
    await fetchUsers();
  }

  async function handleDelete(id: string) {
    setActionError(null);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setActionError(body.error ?? "Failed to delete user");
      setDeleteConfirmId(null);
      return;
    }
    setDeleteConfirmId(null);
    await fetchUsers();
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Users</h1>
          <p className="text-sm text-zinc-500">
            Manage who has access to this CMS and what they can do.
          </p>
        </div>
        {!showAdd && (
          <button
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
            }}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            + Add user
          </button>
        )}
      </div>

      {/* Role legend */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {USER_ROLES.map((r) => (
          <div key={r} className="rounded-lg border border-zinc-300 bg-white p-3">
            <RoleBadge role={r} />
            <p className="mt-1.5 text-xs text-zinc-500">{ROLE_DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">New user</h2>
          <UserForm
            initial={EMPTY_FORM}
            isEdit={false}
            onSave={handleCreate}
            onCancel={() => setShowAdd(false)}
            isSelf={false}
          />
        </div>
      )}

      {actionError && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-200">
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="rounded-lg border border-zinc-300 bg-white p-6 text-sm text-zinc-400">
          Loading users…
        </div>
      ) : fetchError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {fetchError}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white">
          {users.length === 0 ? (
            <p className="p-6 text-sm text-zinc-400">No users found.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const isEditing = editingId === user.id;
                const isConfirmingDelete = deleteConfirmId === user.id;

                return (
                  <li key={user.id}>
                    {isEditing ? (
                      <div className="p-4">
                        <p className="mb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Editing {user.username}
                        </p>
                        <UserForm
                          initial={{
                            username: user.username,
                            displayName: user.displayName,
                            email: user.email,
                            password: "",
                            role: user.role,
                          }}
                          isEdit
                          onSave={(data) => handleUpdate(user.id, data)}
                          onCancel={() => setEditingId(null)}
                          isSelf={isSelf}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 px-4 py-3">
                        {/* Avatar placeholder */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-500 select-none">
                          {(user.displayName || user.username)
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-900">
                              {user.displayName || user.username}
                            </span>
                            {isSelf && (
                              <span className="text-xs text-zinc-400">(you)</span>
                            )}
                            <RoleBadge role={user.role} />
                          </div>
                          <p className="text-xs text-zinc-400">
                            @{user.username}
                            {user.email ? ` — ${user.email}` : ""}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {isConfirmingDelete ? (
                            <>
                              <span className="text-xs text-zinc-500">Delete?</span>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                              >
                                Yes, delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(user.id);
                                  setShowAdd(false);
                                  setDeleteConfirmId(null);
                                }}
                                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                              >
                                Edit
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => {
                                    setDeleteConfirmId(user.id);
                                    setEditingId(null);
                                  }}
                                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

