import { redirect } from "next/navigation";
import { getLessonFormData } from "@/actions/lessons";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/nav/AppShell";
import { LessonCreateForm } from "@/components/lessons/LessonCreateForm";

export const metadata = {
  title: "Registrar · SAVE IT",
};

export default async function NewLessonPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");

  const { specialties, organizationLogoUrl, organizationName, canCreateLesson } =
    await getLessonFormData();

  return (
    <AppShell activePath="/lessons/new">
      <LessonCreateForm
        specialties={specialties}
        organizationLogoUrl={organizationLogoUrl}
        organizationName={organizationName}
        canCreateLesson={canCreateLesson}
      />
    </AppShell>
  );
}

