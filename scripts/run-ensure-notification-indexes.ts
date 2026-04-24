/**
 * Crea/actualiza índices de notificaciones. Ejecutar una vez o en CI.
 *
 *   npm run db:ensure-notification-indexes
 */
import { MongoClient } from "mongodb";
import { ensureNotificationIndexes } from "./ensureNotificationIndexes";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI (e.g. in .env.local)");
  const dbName = process.env.MONGODB_DB ?? "saveit";

  const client = new MongoClient(uri);
  await client.connect();
  try {
    await ensureNotificationIndexes(client.db(dbName));
  } finally {
    await client.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
