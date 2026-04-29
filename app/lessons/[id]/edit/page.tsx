import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isValidObjectIdString } from "@/lib/objectId";
import { AppShell } from "@/components/nav/AppShell";
import { LessonEditForm } from "@/components/lessons/LessonEditForm";
import { listSpecialties } from "@/services/specialtyService";
import { getLessonByIdInOrganization } from "@/services/lessonService";

export const metadata = {
  title: "Editar · SAVE IT",
};

export default async function LessonEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");
  if (user.role !== "ENGINEER") redirect("/dashboard");

  const { id } = await params;
  if (!isValidObjectIdString(id)) redirect("/dashboard");

  const [lesson, specialties] = await Promise.all([
    getLessonByIdInOrganization(id, user.organizationId),
    listSpecialties(),
  ]);

  if (!lesson) redirect("/dashboard");
  if (lesson.createdBy !== user.id) redirect("/dashboard");
  if (lesson.status !== "IN_PROGRESS") redirect("/dashboard");

  return (
    <AppShell activePath="/dashboard">
      <LessonEditForm lesson={lesson} specialties={specialties} />
    </AppShell>
  );
}

