import Database from "better-sqlite3";
import fs from "node:fs";
import { sqliteDbPath, dataDir } from "./paths";

declare global {
  var __saveitDb: Database.Database | undefined;
}

function ensureDataDir() {
  fs.mkdirSync(dataDir(), { recursive: true });
}

function ensureSchema(db: Database.Database) {
  // Lightweight, forward-only migration for local SQLite.
  // (No external migration system in this repo yet.)
  const lessonCols = db
    .prepare("PRAGMA table_info(lessons)")
    .all() as Array<{ name: string }>;

  const hasEventDate = lessonCols.some((c) => c.name === "event_date");
  if (!hasEventDate) {
    db.exec("ALTER TABLE lessons ADD COLUMN event_date TEXT");
  }
}

export function getDb(): Database.Database {
  if (globalThis.__saveitDb) return globalThis.__saveitDb;
  ensureDataDir();
  const db = new Database(sqliteDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  ensureSchema(db);
  globalThis.__saveitDb = db;
  return db;
}

