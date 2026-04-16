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
  company: string | null;
  title: string | null;
  role: UserRole;
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
    company: doc.company,
    title: doc.title,
    role: doc.role,
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

export async function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  passwordSaltHex: string;
  passwordHashHex: string;
}): Promise<User> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const res = await db.collection(COL).insertOne({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: null,
    company: null,
    title: null,
    role: input.role,
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
  input: { name: string; phone: string | null; company: string | null; title: string | null },
): Promise<User> {
  const db = await getMongoDb();
  const oid = new ObjectId(userId);
  const now = new Date().toISOString();
  const r = await db.collection<UserDoc>(COL).updateOne(
    { _id: oid },
    {
      $set: {
        name: input.name,
        phone: input.phone,
        company: input.company,
        title: input.title,
        updatedAt: now,
      },
    },
  );
  if (r.matchedCount === 0) throw new Error("User not found");
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found after update");
  return user;
}

export async function listMembers(): Promise<
  Array<Pick<User, "id" | "name" | "email" | "title" | "role">>
> {
  const db = await getMongoDb();
  const rows = await db
    .collection<UserDoc>(COL)
    .find({}, { projection: { _id: 1, name: 1, email: 1, title: 1, role: 1 } })
    .sort({ role: -1, name: 1 })
    .toArray();
  return rows.map((r) => ({
    id: r._id.toHexString(),
    name: r.name,
    email: r.email,
    title: r.title,
    role: r.role,
  }));
}
