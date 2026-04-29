import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import type { Specialty } from "@/types/models";

const COL = "specialties";

type SpecialtyDoc = {
  _id: ObjectId;
  key: Specialty["key"];
  name: string;
};

export async function listSpecialties(): Promise<Specialty[]> {
  const db = await getMongoDb();
  const rows = await db
    .collection<SpecialtyDoc>(COL)
    .find({})
    .sort({ key: 1 })
    .toArray();
  return rows.map((r) => ({
    id: r._id.toHexString(),
    key: r.key,
    name: r.name,
  }));
}

export async function getSpecialtyByKey(key: Specialty["key"]): Promise<Specialty | null> {
  const db = await getMongoDb();
  const row = await db.collection<SpecialtyDoc>(COL).findOne({ key });
  return row
    ? { id: row._id.toHexString(), key: row.key, name: row.name }
    : null;
}
