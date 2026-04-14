import { getDb } from "@/lib/db";
import type { DashboardMetrics } from "@/types/models";

export function getDashboardMetrics(): DashboardMetrics {
  const db = getDb();

  const totals = db
    .prepare(
      `
      SELECT
        COUNT(*) as lessons_total,
        SUM(CASE WHEN status = 'VALIDATED' THEN 1 ELSE 0 END) as lessons_validated,
        SUM(CASE WHEN status = 'IN_PROGRESS' OR status = 'RECEIVED' THEN 1 ELSE 0 END) as lessons_in_progress,
        SUM(CASE WHEN status = 'DISCARDED' THEN 1 ELSE 0 END) as lessons_discarded
      FROM lessons
    `,
    )
    .get() as {
    lessons_total: number;
    lessons_validated: number;
    lessons_in_progress: number;
    lessons_discarded: number;
  };

  const top = db
    .prepare(
      `
      SELECT s.key as specialty_key, COUNT(*) as cnt
      FROM lessons l
      JOIN specialties s ON s.id = l.specialty_id
      GROUP BY s.key
      ORDER BY cnt DESC
    `,
    )
    .all() as Array<{ specialty_key: DashboardMetrics["topSpecialties"][number]["specialtyKey"]; cnt: number }>;

  return {
    lessonsTotal: totals.lessons_total ?? 0,
    lessonsValidated: totals.lessons_validated ?? 0,
    lessonsInProgress: totals.lessons_in_progress ?? 0,
    lessonsDiscarded: totals.lessons_discarded ?? 0,
    topSpecialties: top.map((t) => ({ specialtyKey: t.specialty_key, count: t.cnt })),
  };
}

