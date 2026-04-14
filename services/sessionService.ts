import { getDb } from "@/lib/db";
import type { Session } from "@/types/models";

type SessionRow = {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
};

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function createSession(input: {
  userId: number;
  token: string;
  expiresAtIso: string;
}): Session {
  const db = getDb();
  const res = db
    .prepare(
      `
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `,
    )
    .run(input.userId, input.token, input.expiresAtIso);
  const row = db
    .prepare(
      `
      SELECT id, user_id, token, expires_at, created_at
      FROM sessions
      WHERE id = ?
    `,
    )
    .get(Number(res.lastInsertRowid)) as SessionRow | undefined;
  if (!row) throw new Error("Failed to create session");
  return mapSession(row);
}

export function getSessionByToken(token: string): Session | null {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT id, user_id, token, expires_at, created_at
      FROM sessions
      WHERE token = ?
    `,
    )
    .get(token) as SessionRow | undefined;
  return row ? mapSession(row) : null;
}

export function deleteSessionByToken(token: string) {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function deleteExpiredSessions(nowIso: string) {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso);
}

