import fs from "node:fs";
import crypto from "node:crypto";
import { getDb } from "./lib/db";
import { dataDir, uploadsDir } from "./lib/paths";

function run() {
  fs.mkdirSync(dataDir(), { recursive: true });
  fs.mkdirSync(uploadsDir(), { recursive: true });

  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      company TEXT,
      title TEXT,
      role TEXT NOT NULL CHECK (role IN ('ENGINEER', 'RESIDENT')),
      password_salt_hex TEXT NOT NULL,
      password_hash_hex TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS specialties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE CHECK (key IN ('QUALITY', 'SAFETY', 'PRODUCTION')),
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      specialty_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      root_cause TEXT NOT NULL,
      solution TEXT NOT NULL,
      event_date TEXT,
      impact_type TEXT NOT NULL CHECK (impact_type IN ('TIME', 'COST')),
      impact_value REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('RECEIVED', 'IN_PROGRESS', 'VALIDATED', 'DISCARDED')) DEFAULT 'RECEIVED',
      reviewer_comment TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      validated_at TEXT,
      views_count INTEGER NOT NULL DEFAULT 0,
      rating_count INTEGER NOT NULL DEFAULT 0,
      rating_avg REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (specialty_id) REFERENCES specialties(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('IMAGE')),
      url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (lesson_id, user_id),
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
    CREATE INDEX IF NOT EXISTS idx_lessons_specialty ON lessons(specialty_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_lesson ON evidence(lesson_id);
  `);

  const insertSpecialty = db.prepare(
    "INSERT INTO specialties (key, name) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET name = excluded.name",
  );
  insertSpecialty.run("QUALITY", "Calidad");
  insertSpecialty.run("SAFETY", "Seguridad");
  insertSpecialty.run("PRODUCTION", "Producción");

  // Convenience seed: create one resident if not exists
  // Email: resident@saveit.local  Password: Resident123!
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get("resident@saveit.local") as { id: number } | undefined;
  if (!existing) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync("Resident123!", salt, 64);
    db.prepare(
      `
        INSERT INTO users (name, email, role, password_salt_hex, password_hash_hex, phone, company, title)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      "Ingeniero Residente",
      "resident@saveit.local",
      "RESIDENT",
      salt.toString("hex"),
      hash.toString("hex"),
      null,
      "SAVE IT",
      "Residente",
    );
    console.log("Seeded resident user: resident@saveit.local / Resident123!");
  }

  console.log("Database initialized at ./data/saveit.sqlite3");
}

run();

