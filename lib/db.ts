import Database from "better-sqlite3";
import fs from "node:fs";
import { sqliteDbPath, dataDir } from "./paths";

declare global {
  var __saveitDb: Database.Database | undefined;
}

function ensureDataDir() {
  fs.mkdirSync(dataDir(), { recursive: true });
}

export function getDb(): Database.Database {
  if (globalThis.__saveitDb) return globalThis.__saveitDb;
  ensureDataDir();
  const db = new Database(sqliteDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  globalThis.__saveitDb = db;
  return db;
}

