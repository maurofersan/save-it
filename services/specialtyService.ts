import { getDb } from "@/lib/db";
import { getSpecialtyLabel } from "@/lib/specialtyLabels";
import type { Specialty } from "@/types/models";

type SpecialtyRow = { id: number; key: Specialty["key"]; name: string };

export function listSpecialties(): Specialty[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, key, name FROM specialties ORDER BY id ASC")
    .all() as SpecialtyRow[];
  return rows.map((r) => ({ id: r.id, key: r.key, name: getSpecialtyLabel(r.key) }));
}

export function getSpecialtyByKey(key: Specialty["key"]): Specialty | null {
  const db = getDb();
  const row = db
    .prepare("SELECT id, key, name FROM specialties WHERE key = ?")
    .get(key) as SpecialtyRow | undefined;
  return row ? { id: row.id, key: row.key, name: getSpecialtyLabel(row.key) } : null;
}

