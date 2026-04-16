import { getMongoDb } from "@/lib/mongo";
import type { DashboardMetrics } from "@/types/models";

const LESSONS = "lessons";
const SPECIALTIES = "specialties";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const db = await getMongoDb();
  const lessons = db.collection(LESSONS);

  const [
    lessonsTotal,
    lessonsValidated,
    lessonsInProgress,
    lessonsDiscarded,
  ] = await Promise.all([
    lessons.countDocuments({}),
    lessons.countDocuments({ status: "VALIDATED" }),
    lessons.countDocuments({ status: { $in: ["RECEIVED", "IN_PROGRESS"] } }),
    lessons.countDocuments({ status: "DISCARDED" }),
  ]);

  const top = await lessons
    .aggregate<{ _id: DashboardMetrics["topSpecialties"][number]["specialtyKey"]; count: number }>([
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

  return {
    lessonsTotal,
    lessonsValidated,
    lessonsInProgress,
    lessonsDiscarded,
    topSpecialties: top.map((t) => ({ specialtyKey: t._id, count: t.count })),
  };
}
