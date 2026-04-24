import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import { resolveLessonNotificationHref } from "@/lib/notificationLinks";
import { organizationChannelName } from "@/lib/ably/channelName";
import { publishNotificationEvent } from "@/lib/ably/publish";
import type { LessonStatus, UserRole } from "@/types/domain";
import type {
  AblyNotificationPayloadV1,
  NotificationKind,
  NotificationListItem,
} from "@/types/notifications";

const NOTIFICATIONS = "notifications";
const READS = "notification_reads";

type NotificationDoc = {
  _id: ObjectId;
  organizationId: ObjectId;
  kind: NotificationKind;
  lessonId: ObjectId;
  title: string;
  summary: string | null;
  lessonStatus: LessonStatus;
  actorUserId: ObjectId;
  createdAt: string;
};

type NotificationInsert = Omit<NotificationDoc, "_id">;

type ReadDoc = {
  _id: ObjectId;
  userId: ObjectId;
  organizationId: ObjectId;
  notificationId: ObjectId;
  readAt: string;
};

const MAX_MARK_ALL = 500;

/**
 * Etapas de agregación: añade userId de filtro y hace join con lecturas del usuario.
 */
function withUserReadLookup(userOid: ObjectId): object[] {
  return [
    {
      $addFields: {
        _filterUserId: { $literal: userOid },
      },
    },
    {
      $lookup: {
        from: READS,
        let: { nid: "$_id", quser: "$_filterUserId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$notificationId", "$$nid"] },
                  { $eq: ["$userId", "$$quser"] },
                ],
              },
            },
          },
        ],
        as: "readRows",
      },
    },
  ];
}

function assertOid(id: string, label: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch {
    throw new Error(`Invalid ${label}`);
  }
}

/**
 * Crea notificación, marca como leída al autor (no suma a su contador),
 * y publica en Ably. Errores de Ably no re-lanzan; fallos de insert sí.
 */
export async function createAndDispatchLessonNotification(input: {
  organizationId: string;
  lessonId: string;
  title: string;
  kind: NotificationKind;
  summary: string | null;
  lessonStatus: LessonStatus;
  actorUserId: string;
}): Promise<void> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const orgOid = new ObjectId(input.organizationId);
  const lessonOid = new ObjectId(input.lessonId);
  const actorOid = new ObjectId(input.actorUserId);

  const doc: NotificationInsert = {
    organizationId: orgOid,
    kind: input.kind,
    lessonId: lessonOid,
    title: input.title,
    summary: input.summary,
    lessonStatus: input.lessonStatus,
    actorUserId: actorOid,
    createdAt: now,
  };
  const res = await db.collection(NOTIFICATIONS).insertOne(doc);
  const id = res.insertedId;

  await markNotificationReadInternal(
    db,
    input.actorUserId,
    input.organizationId,
    id,
    now,
  );

  const payload: AblyNotificationPayloadV1 = {
    v: 1,
    id: id.toHexString(),
    organizationId: input.organizationId,
    kind: input.kind,
    lessonId: input.lessonId,
    title: input.title,
    summary: input.summary,
    lessonStatus: input.lessonStatus,
    createdAt: now,
    actorUserId: input.actorUserId,
  };
  void publishNotificationEvent(payload);
}

async function markNotificationReadInternal(
  db: Awaited<ReturnType<typeof getMongoDb>>,
  userId: string,
  organizationId: string,
  notificationObjectId: ObjectId,
  readAt: string,
): Promise<void> {
  const u = new ObjectId(userId);
  const org = new ObjectId(organizationId);
  await db.collection<ReadDoc>(READS).updateOne(
    { userId: u, notificationId: notificationObjectId },
    {
      $set: {
        readAt,
        organizationId: org,
        userId: u,
        notificationId: notificationObjectId,
      },
    },
    { upsert: true },
  );
}

function mapListItem(
  row: {
    _id: ObjectId;
    kind: NotificationKind;
    lessonId: ObjectId;
    title: string;
    summary: string | null;
    lessonStatus: LessonStatus;
    createdAt: string;
    hasRead: boolean;
  },
  role: UserRole,
): NotificationListItem {
  const lessonId = row.lessonId.toHexString();
  return {
    id: row._id.toHexString(),
    kind: row.kind,
    lessonId,
    title: row.title,
    summary: row.summary,
    lessonStatus: row.lessonStatus,
    createdAt: row.createdAt,
    read: row.hasRead,
    href: resolveLessonNotificationHref(lessonId, row.lessonStatus, role),
  };
}

/**
 * Listado con estado leído y enlace acorde al rol.
 */
export async function listNotificationsForUser(input: {
  userId: string;
  organizationId: string;
  role: UserRole;
  limit: number;
}): Promise<NotificationListItem[]> {
  const { userId, organizationId, role, limit } = input;
  const take = Math.min(50, Math.max(1, limit));
  const db = await getMongoDb();
  const orgOid = assertOid(organizationId, "organizationId");
  const userOid = assertOid(userId, "userId");

  const rows = await db
    .collection<NotificationDoc>(NOTIFICATIONS)
    .aggregate<{
      _id: ObjectId;
      kind: NotificationKind;
      lessonId: ObjectId;
      title: string;
      summary: string | null;
      lessonStatus: LessonStatus;
      createdAt: string;
      hasRead: boolean;
    }>([
      { $match: { organizationId: orgOid } },
      { $sort: { createdAt: -1 } },
      { $limit: 200 },
      ...withUserReadLookup(userOid),
      {
        $addFields: {
          hasRead: { $gt: [{ $size: "$readRows" }, 0] },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: take },
      {
        $project: {
          _id: 1,
          kind: 1,
          lessonId: 1,
          title: 1,
          summary: 1,
          lessonStatus: 1,
          createdAt: 1,
          hasRead: 1,
        },
      },
    ])
    .toArray();

  return rows.map((r) => mapListItem(r, role));
}

export async function countUnreadForUser(
  userId: string,
  organizationId: string,
): Promise<number> {
  const db = await getMongoDb();
  const orgOid = assertOid(organizationId, "organizationId");
  const userOid = assertOid(userId, "userId");

  const out = await db
    .collection<NotificationDoc>(NOTIFICATIONS)
    .aggregate<{ c: number }>([
      { $match: { organizationId: orgOid } },
      ...withUserReadLookup(userOid),
      { $match: { readRows: { $size: 0 } } },
      { $count: "c" },
    ])
    .toArray();

  return out[0]?.c ?? 0;
}

export { organizationChannelName };

export async function markNotificationAsRead(input: {
  userId: string;
  organizationId: string;
  notificationId: string;
}): Promise<void> {
  const db = await getMongoDb();
  const nOid = assertOid(input.notificationId, "notificationId");
  const n = await db.collection<NotificationDoc>(NOTIFICATIONS).findOne({
    _id: nOid,
    organizationId: new ObjectId(input.organizationId),
  });
  if (!n) {
    throw new Error("Notificación no encontrada");
  }
  const readAt = new Date().toISOString();
  await markNotificationReadInternal(
    db,
    input.userId,
    input.organizationId,
    n._id,
    readAt,
  );
}

export async function markAllNotificationsAsRead(input: {
  userId: string;
  organizationId: string;
}): Promise<{ marked: number }> {
  const db = await getMongoDb();
  const orgOid = assertOid(input.organizationId, "organizationId");
  const userOid = assertOid(input.userId, "userId");

  const pipeline: object[] = [
    { $match: { organizationId: orgOid } },
    { $sort: { createdAt: -1 } },
    { $limit: 500 },
    ...withUserReadLookup(userOid),
    { $match: { readRows: { $size: 0 } } },
    { $limit: MAX_MARK_ALL },
    { $project: { _id: 1 } },
  ];

  const unread = await db
    .collection<NotificationDoc>(NOTIFICATIONS)
    .aggregate<{ _id: ObjectId }>(pipeline)
    .toArray();
  if (!unread.length) return { marked: 0 };

  const readAt = new Date().toISOString();
  const userO = new ObjectId(input.userId);
  const toInsert = unread.map((u) => ({
    userId: userO,
    organizationId: orgOid,
    notificationId: u._id,
    readAt,
  }));

  try {
    const r = await db.collection(READS).insertMany(toInsert, { ordered: false });
    return { marked: r.insertedCount };
  } catch (e: unknown) {
    const m = e as { insertedCount?: number };
    if (typeof m.insertedCount === "number" && m.insertedCount > 0) {
      return { marked: m.insertedCount };
    }
    throw e;
  }
}
