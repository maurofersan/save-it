import { getDb } from "@/lib/db";
import type { Evidence } from "@/types/models";

type EvidenceRow = {
  id: number;
  lesson_id: number;
  type: Evidence["type"];
  url: string;
  created_at: string;
};

function mapEvidence(row: EvidenceRow): Evidence {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    type: row.type,
    url: row.url,
    createdAt: row.created_at,
  };
}

export function addEvidence(input: {
  lessonId: number;
  type: Evidence["type"];
  url: string;
}): Evidence {
  const db = getDb();
  const res = db
    .prepare(
      `
      INSERT INTO evidence (lesson_id, type, url)
      VALUES (?, ?, ?)
    `,
    )
    .run(input.lessonId, input.type, input.url);

  const row = db
    .prepare(
      `
      SELECT id, lesson_id, type, url, created_at
      FROM evidence
      WHERE id = ?
    `,
    )
    .get(Number(res.lastInsertRowid)) as EvidenceRow | undefined;
  if (!row) throw new Error("Failed to create evidence");
  return mapEvidence(row);
}

export function listEvidenceForLesson(lessonId: number): Evidence[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id, lesson_id, type, url, created_at
      FROM evidence
      WHERE lesson_id = ?
      ORDER BY id ASC
    `,
    )
    .all(lessonId) as EvidenceRow[];
  return rows.map(mapEvidence);
}

