import type { Db } from "mongodb";

const NOTIFICATIONS = "notifications";
const READS = "notification_reads";

/**
 * Índices para listados por empresa, no leídas por usuario y marcar leídas.
 * Idempotente: createIndex con el mismo spec no falla.
 */
export async function ensureNotificationIndexes(db: Db): Promise<void> {
  await db
    .collection(NOTIFICATIONS)
    .createIndex({ organizationId: 1, createdAt: -1 });
  await db
    .collection(READS)
    .createIndex(
      { userId: 1, notificationId: 1 },
      { unique: true },
    );
  await db
    .collection(READS)
    .createIndex({ userId: 1, organizationId: 1, readAt: -1 });
  console.log("Ensured indexes on notifications + notification_reads.");
}
