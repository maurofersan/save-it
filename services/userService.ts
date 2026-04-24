import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import type { User } from "@/types/models";
import type { UserRole } from "@/types/domain";

const COL = "users";

type UserDoc = {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string | null;
  title: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  /** Present for multi-tenant users; null only for legacy accounts. */
  organizationId?: ObjectId | null;
  passwordSaltHex: string;
  passwordHashHex: string;
  createdAt: string;
  updatedAt: string;
};

function mapUser(doc: Omit<UserDoc, "passwordSaltHex" | "passwordHashHex">): User {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    title: doc.title,
    avatarUrl: doc.avatarUrl ?? null,
    role: doc.role,
    organizationId: doc.organizationId
      ? doc.organizationId.toHexString()
      : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getMongoDb();
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  const doc = (await db.collection<UserDoc>(COL).findOne(
    { _id: oid },
    { projection: { passwordSaltHex: 0, passwordHashHex: 0 } },
  )) as Omit<UserDoc, "passwordSaltHex" | "passwordHashHex"> | null;
  return doc ? mapUser(doc) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getMongoDb();
  const doc = (await db.collection<UserDoc>(COL).findOne(
    { email: email.toLowerCase() },
    { projection: { passwordSaltHex: 0, passwordHashHex: 0 } },
  )) as Omit<UserDoc, "passwordSaltHex" | "passwordHashHex"> | null;
  return doc ? mapUser(doc) : null;
}

export async function getUserAuthByEmail(
  email: string,
): Promise<(User & { password: { saltHex: string; hashHex: string } }) | null> {
  const db = await getMongoDb();
  const doc = await db.collection<UserDoc>(COL).findOne({ email: email.toLowerCase() });
  if (!doc) return null;
  return {
    ...mapUser(doc),
    password: { saltHex: doc.passwordSaltHex, hashHex: doc.passwordHashHex },
  };
}

export async function getUserAuthById(
  id: string,
): Promise<(User & { password: { saltHex: string; hashHex: string } }) | null> {
  const db = await getMongoDb();
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  const doc = await db.collection<UserDoc>(COL).findOne({ _id: oid });
  if (!doc) return null;
  return {
    ...mapUser(doc),
    password: { saltHex: doc.passwordSaltHex, hashHex: doc.passwordHashHex },
  };
}

export async function updateUserPassword(
  userId: string,
  passwordSaltHex: string,
  passwordHashHex: string,
): Promise<void> {
  const db = await getMongoDb();
  const oid = new ObjectId(userId);
  const now = new Date().toISOString();
  const r = await db.collection(COL).updateOne(
    { _id: oid },
    { $set: { passwordSaltHex, passwordHashHex, updatedAt: now } },
  );
  if (r.matchedCount === 0) throw new Error("User not found");
}

export async function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  passwordSaltHex: string;
  passwordHashHex: string;
}): Promise<User> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const res = await db.collection(COL).insertOne({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: null,
    title: null,
    avatarUrl: null,
    role: input.role,
    organizationId: new ObjectId(input.organizationId),
    passwordSaltHex: input.passwordSaltHex,
    passwordHashHex: input.passwordHashHex,
    createdAt: now,
    updatedAt: now,
  });
  const user = await getUserById(res.insertedId.toHexString());
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function updateUserProfile(
  userId: string,
  input: {
    name: string;
    phone: string | null;
    title: string | null;
    /** Si se pasa, actualiza la URL del avatar. Omite el campo en `$set` si `undefined`. */
    avatarUrl?: string | null;
  },
): Promise<User> {
  const db = await getMongoDb();
  const oid = new ObjectId(userId);
  const now = new Date().toISOString();
  const $set: Record<string, unknown> = {
    name: input.name,
    phone: input.phone,
    title: input.title,
    updatedAt: now,
  };
  if (input.avatarUrl !== undefined) {
    $set.avatarUrl = input.avatarUrl;
  }
  const r = await db.collection<UserDoc>(COL).updateOne(
    { _id: oid },
    {
      $set,
      /** Migra documentos antiguos: el nombre de empresa sale de `organizations`. */
      $unset: { company: "" },
    },
  );
  if (r.matchedCount === 0) throw new Error("User not found");
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found after update");
  return user;
}

export async function listMembers(organizationId: string): Promise<
  Array<Pick<User, "id" | "name" | "email" | "title" | "role" | "avatarUrl">>
> {
  const db = await getMongoDb();
  const oid = new ObjectId(organizationId);
  const rows = await db
    .collection<UserDoc>(COL)
    .find(
      { organizationId: oid },
      { projection: { _id: 1, name: 1, email: 1, title: 1, role: 1, avatarUrl: 1 } },
    )
    .sort({ role: -1, name: 1 })
    .toArray();
  return rows.map((r) => ({
    id: r._id.toHexString(),
    name: r.name,
    email: r.email,
    title: r.title,
    role: r.role,
    avatarUrl: r.avatarUrl ?? null,
  }));
}
