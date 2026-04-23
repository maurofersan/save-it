import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import type { Evidence } from "@/types/models";

const COL = "evidence";

type EvidenceDoc = {
  _id: ObjectId;
  lessonId: ObjectId;
  organizationId: ObjectId;
  type: Evidence["type"];
  url: string;
  createdAt: string;
};

function mapEvidence(doc: EvidenceDoc): Evidence {
  return {
    id: doc._id.toHexString(),
    lessonId: doc.lessonId.toHexString(),
    organizationId: doc.organizationId.toHexString(),
    type: doc.type,
    url: doc.url,
    createdAt: doc.createdAt,
  };
}

export async function addEvidence(input: {
  lessonId: string;
  organizationId: string;
  type: Evidence["type"];
  url: string;
}): Promise<Evidence> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const res = await db.collection(COL).insertOne({
    lessonId: new ObjectId(input.lessonId),
    organizationId: new ObjectId(input.organizationId),
    type: input.type,
    url: input.url,
    createdAt: now,
  });
  const row = (await db.collection(COL).findOne({ _id: res.insertedId })) as EvidenceDoc | null;
  if (!row) throw new Error("Failed to create evidence");
  return mapEvidence(row);
}

export async function listEvidenceForLesson(
  lessonId: string,
  organizationId: string,
): Promise<Evidence[]> {
  const db = await getMongoDb();
  const rows = (await db
    .collection(COL)
    .find({
      lessonId: new ObjectId(lessonId),
      organizationId: new ObjectId(organizationId),
    })
    .sort({ _id: 1 })
    .toArray()) as EvidenceDoc[];
  return rows.map(mapEvidence);
}
