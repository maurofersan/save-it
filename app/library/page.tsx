import { redirect } from "next/navigation";
import { searchLibrary } from "@/actions/lessons";
import { getCurrentUser } from "@/lib/auth";
import { listSpecialties } from "@/services/specialtyService";
import type { SpecialtyKey } from "@/types/domain";
import { AppShell } from "@/components/nav/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LessonFiltersBar } from "@/components/lessons/LessonFiltersBar";
import { LibraryTable } from "@/components/library/LibraryTable";

export const metadata = {
  title: "Biblioteca · SAVE IT",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    specialty?: string;
    projectType?: string;
    year?: string;
    ratingMin?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");

  const sp = await searchParams;
  const specialties = await listSpecialties();
  const specialtyKey: SpecialtyKey | undefined =
    sp.specialty === "QUALITY" ||
    sp.specialty === "SAFETY" ||
    sp.specialty === "PRODUCTION"
      ? (sp.specialty as SpecialtyKey)
      : undefined;
  const ratingMin =
    sp.ratingMin && /^[1-5]$/.test(sp.ratingMin) ? Number(sp.ratingMin) : undefined;
  const lessons = await searchLibrary({
    q: sp.q,
    specialtyKey: specialtyKey ?? undefined,
    projectType: sp.projectType,
    year: sp.year,
    ratingMin,
  });

  return (
    <AppShell activePath="/library">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-blue-200">Visualizar</div>
          <div className="mt-1 text-xl font-semibold text-slate-50">
            Biblioteca de conocimiento
          </div>
          <div className="mt-1 text-sm text-slate-300">
            Solo aparecen lecciones <b>validadas</b>.
          </div>
        </CardHeader>
        <CardBody>
          <LessonFiltersBar mode="library" specialties={specialties} />
        </CardBody>
      </Card>

      <div className="mt-4 lg:mt-6">
        <LibraryTable lessons={lessons} />
      </div>
    </AppShell>
  );
}
