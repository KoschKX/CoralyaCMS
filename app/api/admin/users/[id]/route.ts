import { type NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser, deleteUser } from "@/lib/users-db";
import { UpdateUserSchema } from "@/lib/api-schemas";

function requireAdmin(req: NextRequest): NextResponse | null {
  const role = req.headers.get("x-user-role");
  if (role !== "administrator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;
  const user = getUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { passwordHash: _ph, ...publicUser } = user;
  return NextResponse.json(publicUser);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = UpdateUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Prevent removing the last administrator role via update
  if (result.data.role) {
    const currentUser = getUserById(id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  try {
    const updated = await updateUser(id, {
      displayName: result.data.displayName,
      email: result.data.email,
      password: result.data.password || undefined,
      role: result.data.role,
    });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update user";
    const status = msg === "User not found" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = requireAdmin(req);
  if (deny) return deny;

  const { id } = await params;

  // Prevent self-deletion
  const currentUserId = req.headers.get("x-user-id");
  if (currentUserId === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  try {
    await deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete user";
    const status = msg === "User not found" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
