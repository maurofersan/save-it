import { redirect } from "next/navigation";
import { listValidationQueue } from "@/actions/lessons";
import { getCurrentUser } from "@/lib/auth";
import { listSpecialties } from "@/services/specialtyService";
import { AppShell } from "@/components/nav/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LessonFiltersBar } from "@/components/lessons/LessonFiltersBar";
import { ValidationQueue } from "@/components/lessons/ValidationQueue";
import type { LessonStatus, SpecialtyKey } from "@/types/domain";

export const metadata = {
  title: "Validación · SAVE IT",
};

export default async function ValidatePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    specialty?: string;
    projectType?: string;
    year?: string;
    ratingMin?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");
  if (user.role !== "RESIDENT") redirect("/dashboard");

  const sp = await searchParams;
  const specialties = await listSpecialties();
  const status: LessonStatus | undefined =
    sp.status === "RECEIVED" ||
    sp.status === "IN_PROGRESS" ||
    sp.status === "VALIDATED" ||
    sp.status === "DISCARDED"
      ? (sp.status as LessonStatus)
      : undefined;
  const specialtyKey: SpecialtyKey | undefined =
    sp.specialty === "QUALITY" ||
    sp.specialty === "SAFETY" ||
    sp.specialty === "PRODUCTION"
      ? (sp.specialty as SpecialtyKey)
      : undefined;
  const ratingMin =
    sp.ratingMin && /^[1-5]$/.test(sp.ratingMin) ? Number(sp.ratingMin) : undefined;
  const lessons = await listValidationQueue({
    q: sp.q,
    status,
    specialtyKey,
    projectType: sp.projectType,
    year: sp.year,
    ratingMin,
  });

  return (
    <AppShell activePath="/validate">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-blue-200">Validación</div>
          <div className="mt-1 text-xl font-semibold text-slate-50">
            Panel del Residente
          </div>
          <div className="mt-1 text-sm text-slate-300">
            Marca las lecciones como <b>EN PROCESO</b>, <b>VALIDADO</b> o{" "}
            <b>DESCARTADO</b>.
          </div>
        </CardHeader>
        <CardBody>
          <LessonFiltersBar mode="validate" specialties={specialties} showStatus />
        </CardBody>
      </Card>

      <div className="mt-4 lg:mt-6">
        <ValidationQueue lessons={lessons} />
      </div>
    </AppShell>
  );
}

