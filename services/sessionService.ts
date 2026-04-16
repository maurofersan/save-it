import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import type { Session } from "@/types/models";

const COL = "sessions";

type SessionDoc = {
  _id: ObjectId;
  userId: ObjectId;
  token: string;
  expiresAt: string;
  createdAt: string;
};

function mapSession(doc: SessionDoc): Session {
  return {
    id: doc._id.toHexString(),
    userId: doc.userId.toHexString(),
    token: doc.token,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  };
}

export async function createSession(input: {
  userId: string;
  token: string;
  expiresAtIso: string;
}): Promise<Session> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const res = await db.collection(COL).insertOne({
    userId: new ObjectId(input.userId),
    token: input.token,
    expiresAt: input.expiresAtIso,
    createdAt: now,
  });
  const doc = (await db.collection(COL).findOne({ _id: res.insertedId })) as SessionDoc | null;
  if (!doc) throw new Error("Failed to create session");
  return mapSession(doc);
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const db = await getMongoDb();
  const doc = (await db.collection(COL).findOne({ token })) as SessionDoc | null;
  return doc ? mapSession(doc) : null;
}

export async function deleteSessionByToken(token: string): Promise<void> {
  const db = await getMongoDb();
  await db.collection(COL).deleteOne({ token });
}

export async function deleteExpiredSessions(nowIso: string): Promise<void> {
  const db = await getMongoDb();
  await db.collection(COL).deleteMany({ expiresAt: { $lte: nowIso } });
}
