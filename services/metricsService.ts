import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import type { DashboardMetrics } from "@/types/models";

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
  ] = await Promise.all([
    lessons.countDocuments(orgMatch),
    lessons.countDocuments({ ...orgMatch, status: "VALIDATED" }),
    lessons.countDocuments({
      ...orgMatch,
      status: { $in: ["RECEIVED", "IN_PROGRESS"] },
    }),
    lessons.countDocuments({ ...orgMatch, status: "DISCARDED" }),
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

  return {
    lessonsTotal,
    lessonsValidated,
    lessonsInProgress,
    lessonsDiscarded,
    topSpecialties: top.map((t) => ({ specialtyKey: t._id, count: t.count })),
  };
}
