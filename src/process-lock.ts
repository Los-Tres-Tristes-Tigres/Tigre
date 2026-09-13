import { promises as fs } from "node:fs";
import path from "node:path";

function processIsAlive(pid: number) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
}

export async function acquireProcessLock(name: string) {
  const lockPath = path.resolve(process.cwd(), `.${name}.lock`);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await fs.writeFile(lockPath, String(process.pid), {
        flag: "wx",
        mode: 0o600,
      });
      let released = false;
      return async () => {
        if (released) return;
        released = true;
        const owner = await fs.readFile(lockPath, "utf8").catch(() => "");
        if (owner === String(process.pid)) await fs.unlink(lockPath).catch(() => {});
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const owner = Number(await fs.readFile(lockPath, "utf8").catch(() => ""));
      if (processIsAlive(owner))
        throw new Error(`Another ${name} process is already running (PID ${owner}).`);
      await fs.unlink(lockPath).catch((unlinkError) => {
        if ((unlinkError as NodeJS.ErrnoException).code !== "ENOENT")
          throw unlinkError;
      });
    }
  }
  throw new Error(`Could not acquire ${name} process lock.`);
}
