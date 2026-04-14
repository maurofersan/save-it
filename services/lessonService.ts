import { getDb } from "@/lib/db";
import type { LessonStatus } from "@/types/domain";
import type { Lesson, LessonWithSpecialty } from "@/types/models";

type LessonRow = {
  id: number;
  title: string;
  specialty_id: number;
  description: string;
  root_cause: string;
  solution: string;
  impact_type: Lesson["impactType"];
  impact_value: number;
  status: LessonStatus;
  reviewer_comment: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  validated_at: string | null;
  views_count: number;
  rating_count: number;
  rating_avg: number;
};

function mapLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    title: row.title,
    specialtyId: row.specialty_id,
    description: row.description,
    rootCause: row.root_cause,
    solution: row.solution,
    impactType: row.impact_type,
    impactValue: row.impact_value,
    status: row.status,
    reviewerComment: row.reviewer_comment,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    validatedAt: row.validated_at,
    viewsCount: row.views_count,
    ratingCount: row.rating_count,
    ratingAvg: row.rating_avg,
  };
}

export function createLesson(input: {
  title: string;
  specialtyId: number;
  description: string;
  rootCause: string;
  solution: string;
  impactType: Lesson["impactType"];
  impactValue: number;
  createdBy: number;
}): Lesson {
  const db = getDb();
  const res = db
    .prepare(
      `
      INSERT INTO lessons (
        title, specialty_id, description, root_cause, solution,
        impact_type, impact_value, status, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?)
    `,
    )
    .run(
      input.title,
      input.specialtyId,
      input.description,
      input.rootCause,
      input.solution,
      input.impactType,
      input.impactValue,
      input.createdBy,
    );

  const lesson = getLessonById(Number(res.lastInsertRowid));
  if (!lesson) throw new Error("Failed to create lesson");
  return lesson;
}

export function getLessonById(id: number): Lesson | null {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT id, title, specialty_id, description, root_cause, solution,
             impact_type, impact_value, status, reviewer_comment, created_by,
             created_at, updated_at, validated_at, views_count, rating_count, rating_avg
      FROM lessons
      WHERE id = ?
    `,
    )
    .get(id) as LessonRow | undefined;
  return row ? mapLesson(row) : null;
}

export function getValidatedLessonWithSpecialtyById(id: number): LessonWithSpecialty | null {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT
        l.id,
        l.title,
        l.specialty_id,
        l.description,
        l.root_cause,
        l.solution,
        l.impact_type,
        l.impact_value,
        l.status,
        l.reviewer_comment,
        l.created_by,
        l.created_at,
        l.updated_at,
        l.validated_at,
        l.views_count,
        l.rating_count,
        l.rating_avg,
        s.key as specialty_key,
        s.name as specialty_name,
        u.name as created_by_name,
        u.email as created_by_email
      FROM lessons l
      JOIN specialties s ON s.id = l.specialty_id
      JOIN users u ON u.id = l.created_by
      WHERE l.id = ? AND l.status = 'VALIDATED'
    `,
    )
    .get(id) as
    | (LessonRow & {
        specialty_key: LessonWithSpecialty["specialtyKey"];
        specialty_name: string;
        created_by_name: string;
        created_by_email: string;
      })
    | undefined;

  if (!row) return null;
  return {
    ...mapLesson(row),
    specialtyKey: row.specialty_key,
    specialtyName: row.specialty_name,
    createdByName: row.created_by_name,
    createdByEmail: row.created_by_email,
  };
}

export function setLessonStatus(input: {
  lessonId: number;
  status: LessonStatus;
  reviewerComment: string | null;
}): Lesson {
  const db = getDb();
  const validatedAt =
    input.status === "VALIDATED" ? new Date().toISOString() : null;

  db.prepare(
    `
      UPDATE lessons
      SET status = ?,
          reviewer_comment = ?,
          validated_at = COALESCE(?, validated_at),
          updated_at = datetime('now')
      WHERE id = ?
    `,
  ).run(input.status, input.reviewerComment, validatedAt, input.lessonId);

  const lesson = getLessonById(input.lessonId);
  if (!lesson) throw new Error("Lesson not found after update");
  return lesson;
}

export function incrementLessonViews(lessonId: number): number {
  const db = getDb();
  db.prepare("UPDATE lessons SET views_count = views_count + 1 WHERE id = ?").run(
    lessonId,
  );
  const row = db
    .prepare("SELECT views_count FROM lessons WHERE id = ?")
    .get(lessonId) as { views_count: number } | undefined;
  if (!row) throw new Error("Lesson not found");
  return row.views_count;
}

export function upsertLessonRating(input: {
  lessonId: number;
  userId: number;
  rating: number;
}): { ratingAvg: number; ratingCount: number } {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(
      `
      INSERT INTO lesson_ratings (lesson_id, user_id, rating)
      VALUES (?, ?, ?)
      ON CONFLICT(lesson_id, user_id) DO UPDATE SET rating = excluded.rating
    `,
    ).run(input.lessonId, input.userId, input.rating);

    const agg = db
      .prepare(
        `
        SELECT AVG(rating) as avg_rating, COUNT(*) as cnt
        FROM lesson_ratings
        WHERE lesson_id = ?
      `,
      )
      .get(input.lessonId) as { avg_rating: number; cnt: number };

    db.prepare(
      `
      UPDATE lessons
      SET rating_avg = ?, rating_count = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
    ).run(agg.avg_rating ?? 0, agg.cnt ?? 0, input.lessonId);

    return { ratingAvg: agg.avg_rating ?? 0, ratingCount: agg.cnt ?? 0 };
  });
  return tx();
}

export function listLessonsForValidation(filters: {
  q?: string;
  status?: LessonStatus;
}): LessonWithSpecialty[] {
  const db = getDb();
  const q = (filters.q ?? "").trim();
  const status = filters.status ?? undefined;

  const where: string[] = [];
  const params: Array<string | number> = [];

  if (q) {
    where.push("(l.title LIKE ? OR l.description LIKE ? OR u.name LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (status) {
    where.push("l.status = ?");
    params.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `
      SELECT
        l.id,
        l.title,
        l.specialty_id,
        l.description,
        l.root_cause,
        l.solution,
        l.impact_type,
        l.impact_value,
        l.status,
        l.reviewer_comment,
        l.created_by,
        l.created_at,
        l.updated_at,
        l.validated_at,
        l.views_count,
        l.rating_count,
        l.rating_avg,
        s.key as specialty_key,
        s.name as specialty_name,
        u.name as created_by_name,
        u.email as created_by_email
      FROM lessons l
      JOIN specialties s ON s.id = l.specialty_id
      JOIN users u ON u.id = l.created_by
      ${whereSql}
      ORDER BY l.created_at DESC
    `,
    )
    .all(...params) as Array<
    LessonRow & {
      specialty_key: LessonWithSpecialty["specialtyKey"];
      specialty_name: string;
      created_by_name: string;
      created_by_email: string;
    }
  >;

  return rows.map((r) => ({
    ...mapLesson(r),
    specialtyKey: r.specialty_key,
    specialtyName: r.specialty_name,
    createdByName: r.created_by_name,
    createdByEmail: r.created_by_email,
  }));
}

export function searchValidatedLessons(filters: {
  q?: string;
  specialtyKey?: LessonWithSpecialty["specialtyKey"];
}): LessonWithSpecialty[] {
  const db = getDb();
  const q = (filters.q ?? "").trim();
  const where: string[] = ["l.status = 'VALIDATED'"];
  const params: Array<string> = [];

  if (q) {
    where.push("(l.title LIKE ? OR l.description LIKE ? OR l.root_cause LIKE ? OR l.solution LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (filters.specialtyKey) {
    where.push("s.key = ?");
    params.push(filters.specialtyKey);
  }

  const rows = db
    .prepare(
      `
      SELECT
        l.id,
        l.title,
        l.specialty_id,
        l.description,
        l.root_cause,
        l.solution,
        l.impact_type,
        l.impact_value,
        l.status,
        l.reviewer_comment,
        l.created_by,
        l.created_at,
        l.updated_at,
        l.validated_at,
        l.views_count,
        l.rating_count,
        l.rating_avg,
        s.key as specialty_key,
        s.name as specialty_name,
        u.name as created_by_name,
        u.email as created_by_email
      FROM lessons l
      JOIN specialties s ON s.id = l.specialty_id
      JOIN users u ON u.id = l.created_by
      WHERE ${where.join(" AND ")}
      ORDER BY l.rating_avg DESC, l.views_count DESC, l.created_at DESC
      LIMIT 100
    `,
    )
    .all(...params) as Array<
    LessonRow & {
      specialty_key: LessonWithSpecialty["specialtyKey"];
      specialty_name: string;
      created_by_name: string;
      created_by_email: string;
    }
  >;

  return rows.map((r) => ({
    ...mapLesson(r),
    specialtyKey: r.specialty_key,
    specialtyName: r.specialty_name,
    createdByName: r.created_by_name,
    createdByEmail: r.created_by_email,
  }));
}

