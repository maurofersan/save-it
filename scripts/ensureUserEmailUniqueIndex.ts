import type { Db } from "mongodb";

const USERS = "users";

/**
 * A unique text index on `email` is invalid: MongoDB tokenizes the string, so
 * different addresses can share a token (e.g. ".com") and trigger E11000 on
 * `_fts` / `_ftsx` instead of the full address.
 *
 * Drops legacy `email_text` if present and ensures a normal unique index on
 * the exact `email` field (matches app lookups in userService).
 */
export async function ensureUserEmailUniqueIndex(db: Db): Promise<void> {
  const users = db.collection(USERS);
  const names = new Set((await users.indexes()).map((i) => i.name));
  if (names.has("email_text")) {
    await users.dropIndex("email_text");
    console.log(
      "Removed legacy email_text index (unique text index on email breaks inserts).",
    );
  }
  await users.createIndex({ email: 1 }, { unique: true });
  console.log("Ensured unique index on users.email (exact match).");
}
