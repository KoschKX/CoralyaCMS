import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "plugin-settings", "alert-on-load.json");

function read(): { message: string } {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
  } catch {
    return { message: "" };
  }
}

export function GET() {
  return NextResponse.json(read());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const message = typeof (body as { message?: unknown }).message === "string"
    ? (body as { message: string }).message
    : "";
  const settings = { message };
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  const tmp = SETTINGS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(settings, null, 2));
  fs.renameSync(tmp, SETTINGS_FILE);
  return NextResponse.json(settings);
}
