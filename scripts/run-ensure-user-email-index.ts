/**
 * One-off / CI: fix users collection indexes (see ensureUserEmailUniqueIndex).
 *
 *   npm run db:fix-user-email-index
 */
import { MongoClient } from "mongodb";
import { ensureUserEmailUniqueIndex } from "./ensureUserEmailUniqueIndex";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI (e.g. in .env.local)");
  const dbName = process.env.MONGODB_DB ?? "saveit";

  const client = new MongoClient(uri);
  await client.connect();
  try {
    await ensureUserEmailUniqueIndex(client.db(dbName));
  } finally {
    await client.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
