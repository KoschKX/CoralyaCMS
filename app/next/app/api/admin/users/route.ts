import { type NextRequest, NextResponse } from "next/server";
import { getUsers, createUser } from "@/lib/users-db";
import { CreateUserSchema } from "@/lib/api-schemas";

function requireAdmin(req: NextRequest): NextResponse | null {
  const role = req.headers.get("x-user-role");
  if (role !== "administrator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;

  return NextResponse.json(getUsers());
}

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = CreateUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const user = await createUser({
      username: result.data.username,
      displayName: result.data.displayName ?? result.data.username,
      email: result.data.email ?? "",
      password: result.data.password,
      role: result.data.role,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
