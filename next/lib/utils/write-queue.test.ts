import { describe, it, expect } from "vitest";
import { createWriteQueue } from "./write-queue";

describe("createWriteQueue", () => {
  it("resolves in order", async () => {
    const results: number[] = [];
    const q = createWriteQueue();
    await Promise.all([
      q(() => { results.push(1); return 1; }),
      q(() => { results.push(2); return 2; }),
      q(() => { results.push(3); return 3; }),
    ]);
    expect(results).toEqual([1, 2, 3]);
  });

  it("returns the wrapped function's value", async () => {
    const q = createWriteQueue();
    expect(await q(() => 42)).toBe(42);
    expect(await q(() => "hello")).toBe("hello");
  });

  it("continues processing after a rejection", async () => {
    const q = createWriteQueue();
    const p1 = q(() => { throw new Error("fail"); });
    const p2 = q(() => "ok");
    await expect(p1).rejects.toThrow("fail");
    await expect(p2).resolves.toBe("ok");
  });

  it("handles async tasks", async () => {
    const q = createWriteQueue();
    const results: string[] = [];
    await Promise.all([
      q(async () => { await Promise.resolve(); results.push("a"); }),
      q(async () => { await Promise.resolve(); results.push("b"); }),
    ]);
    expect(results).toEqual(["a", "b"]);
  });

  it("handles a rejected async task and continues", async () => {
    const q = createWriteQueue();
    const p1 = q(async () => { throw new Error("async fail"); });
    const p2 = q(async () => 99);
    await expect(p1).rejects.toThrow("async fail");
    await expect(p2).resolves.toBe(99);
  });
});
