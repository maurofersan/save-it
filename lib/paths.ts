import path from "node:path";

export function projectRoot(): string {
  // Next runs with process.cwd() at the project root in dev/build.
  return process.cwd();
}

export function dataDir(): string {
  return path.join(projectRoot(), "data");
}

export function sqliteDbPath(): string {
  return path.join(dataDir(), "saveit.sqlite3");
}

export function uploadsDir(): string {
  // Served statically by Next (public/)
  return path.join(projectRoot(), "public", "uploads");
}

