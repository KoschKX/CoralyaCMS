/**
 * Write-queue factory
 * ───────────────────
 * Creates a serialisation mutex for concurrent read-modify-write operations
 * on a shared resource (e.g. a JSON file).
 *
 * Concurrent calls are queued and executed in order. The queue advances even
 * if the wrapped function throws, so a single failure never stalls subsequent
 * operations.
 *
 * Usage:
 *   const serialise = createWriteQueue();
 *
 *   function updateRecord(data) {
 *     return serialise(() => {
 *       const all = readFile();
 *       writeFile({ ...all, ...data });
 *       return data;
 *     });
 *   }
 */
export function createWriteQueue() {
  let queue: Promise<unknown> = Promise.resolve();

  return function serialise<T>(fn: () => T | Promise<T>): Promise<T> {
    const p = queue.then(fn);
    // Advance the queue even if fn throws — prevents a permanently stuck queue.
    queue = p.then(() => undefined, () => undefined);
    return p as Promise<T>;
  };
}
