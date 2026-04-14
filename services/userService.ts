import { getDb } from "@/lib/db";
import type { User } from "@/types/models";
import type { UserRole } from "@/types/domain";

type UserRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  title: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

type UserAuthRow = UserRow & {
  password_salt_hex: string;
  password_hash_hex: string;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    title: row.title,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getUserById(id: number): User | null {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT id, name, email, phone, company, title, role, created_at, updated_at
      FROM users
      WHERE id = ?
    `,
    )
    .get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT id, name, email, phone, company, title, role, created_at, updated_at
      FROM users
      WHERE email = ?
    `,
    )
    .get(email) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function getUserAuthByEmail(email: string): (User & { password: { saltHex: string; hashHex: string } }) | null {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT id, name, email, phone, company, title, role, created_at, updated_at,
             password_salt_hex, password_hash_hex
      FROM users
      WHERE email = ?
    `,
    )
    .get(email) as UserAuthRow | undefined;
  if (!row) return null;
  return {
    ...mapUser(row),
    password: { saltHex: row.password_salt_hex, hashHex: row.password_hash_hex },
  };
}

export function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  passwordSaltHex: string;
  passwordHashHex: string;
}): User {
  const db = getDb();
  const res = db
    .prepare(
      `
      INSERT INTO users (name, email, role, password_salt_hex, password_hash_hex)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
    .run(
      input.name,
      input.email.toLowerCase(),
      input.role,
      input.passwordSaltHex,
      input.passwordHashHex,
    );
  const user = getUserById(Number(res.lastInsertRowid));
  if (!user) throw new Error("Failed to create user");
  return user;
}

export function updateUserProfile(
  userId: number,
  input: { name: string; phone: string | null; company: string | null; title: string | null },
): User {
  const db = getDb();
  db.prepare(
    `
      UPDATE users
      SET name = ?, phone = ?, company = ?, title = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
  ).run(input.name, input.phone, input.company, input.title, userId);
  const user = getUserById(userId);
  if (!user) throw new Error("User not found after update");
  return user;
}

export function listMembers(): Array<Pick<User, "id" | "name" | "email" | "title" | "role">> {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id, name, email, title, role
      FROM users
      ORDER BY role DESC, name ASC
    `,
    )
    .all() as Array<{ id: number; name: string; email: string; title: string | null; role: UserRole }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    title: r.title,
    role: r.role,
  }));
}

