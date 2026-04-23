import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import type { LessonStatus } from "@/types/domain";
import type { DashboardMetrics } from "@/types/models";
import { listSpecialties } from "@/services/specialtyService";

const LESSONS = "lessons";
const SPECIALTIES = "specialties";

export async function getDashboardMetrics(
  organizationId: string,
): Promise<DashboardMetrics> {
  const db = await getMongoDb();
  const lessons = db.collection(LESSONS);
  const org = new ObjectId(organizationId);

  const orgMatch = { organizationId: org };

  const [
    lessonsTotal,
    lessonsValidated,
    lessonsInProgress,
    lessonsDiscarded,
    receivedCount,
    inProgressCount,
  ] = await Promise.all([
    lessons.countDocuments(orgMatch),
    lessons.countDocuments({ ...orgMatch, status: "VALIDATED" }),
    lessons.countDocuments({
      ...orgMatch,
      status: { $in: ["RECEIVED", "IN_PROGRESS"] },
    }),
    lessons.countDocuments({ ...orgMatch, status: "DISCARDED" }),
    lessons.countDocuments({ ...orgMatch, status: "RECEIVED" }),
    lessons.countDocuments({ ...orgMatch, status: "IN_PROGRESS" }),
  ]);

  const top = await lessons
    .aggregate<{ _id: DashboardMetrics["topSpecialties"][number]["specialtyKey"]; count: number }>([
      { $match: { organizationId: org } },
      {
        $lookup: {
          from: SPECIALTIES,
          localField: "specialtyId",
          foreignField: "_id",
          as: "s",
        },
      },
      { $unwind: "$s" },
      { $group: { _id: "$s.key", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  const countByKey = new Map(
    top.map((t) => [t._id, t.count] as const),
  );
  const catalog = await listSpecialties();
  const specialtyBars = catalog.map((s) => ({
    specialtyKey: s.key,
    label: s.name,
    count: countByKey.get(s.key) ?? 0,
  }));

  const statusCounts: Record<LessonStatus, number> = {
    RECEIVED: receivedCount,
    IN_PROGRESS: inProgressCount,
    VALIDATED: lessonsValidated,
    DISCARDED: lessonsDiscarded,
  };

  return {
    lessonsTotal,
    lessonsValidated,
    lessonsInProgress,
    lessonsDiscarded,
    topSpecialties: top.map((t) => ({ specialtyKey: t._id, count: t.count })),
    specialtyBars,
    statusCounts,
  };
}
