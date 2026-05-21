import { type NextRequest, NextResponse } from "next/server";

/** Returns the currently logged-in user's info from headers set by middleware. */
export async function GET(req: NextRequest) {
  const id = req.headers.get("x-user-id");
  const username = req.headers.get("x-user-name");
  const role = req.headers.get("x-user-role");

  if (!id || !username || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ id, username, role });
}
