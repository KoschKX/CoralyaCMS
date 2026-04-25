import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import "@/plugins/index";
import { installedPlugins, disabledPlugins } from "@/lib/plugin-registry";

const STATES_FILE = path.join(process.cwd(), "data", "plugin-settings", "plugin-states.json");

function readStates(): Record<string, boolean> {
  try {
    return JSON.parse(fs.readFileSync(STATES_FILE, "utf-8")) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeStates(states: Record<string, boolean>) {
  fs.mkdirSync(path.dirname(STATES_FILE), { recursive: true });
  const tmp = STATES_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(states, null, 2));
  fs.renameSync(tmp, STATES_FILE);
}

export function GET() {
  const saved = readStates();
  const result: Record<string, boolean> = {};
  for (const p of installedPlugins) {
    result[p.name] = saved[p.name] !== false; // absent = enabled
  }
  return NextResponse.json(result);
}

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { name, enabled } = body as { name?: unknown; enabled?: unknown };
  if (typeof name !== "string" || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "name (string) and enabled (boolean) required" }, { status: 400 });
  }
  const states = readStates();
  states[name] = enabled;
  writeStates(states);
  // Update in-memory state so subsequent requests in this process see it immediately.
  if (enabled) disabledPlugins.delete(name);
  else disabledPlugins.add(name);
  return NextResponse.json({ name, enabled });
}
