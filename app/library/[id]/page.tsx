import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isValidObjectIdString } from "@/lib/objectId";
import { listEvidenceForLesson } from "@/services/evidenceService";
import { getValidatedLessonWithSpecialtyById } from "@/services/lessonService";
import { AppShell } from "@/components/nav/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Badge";
import { RatingStars } from "@/components/library/RatingStars";
import { ViewCounter } from "@/components/library/ViewCounter";

export default async function LibraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");

  const { id } = await params;
  if (!isValidObjectIdString(id)) redirect("/library");

  const lesson = await getValidatedLessonWithSpecialtyById(id, user.organizationId);
  if (!lesson) redirect("/library");

  const evidence = await listEvidenceForLesson(id, user.organizationId);

  return (
    <AppShell activePath="/library">
      <div className="grid gap-4 lg:gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/library"
            className="text-sm font-medium text-blue-200 hover:underline"
          >
            ← Volver a biblioteca
          </Link>
          <ViewCounter lessonId={id} initialViews={lesson.viewsCount} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-2xl font-semibold tracking-tight text-slate-50">
                  {lesson.title}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <Pill>{lesson.specialtyName}</Pill>
                  <span>·</span>
                  <span>Autor: {lesson.createdByName}</span>
                  <span>·</span>
                  <span>
                    {new Date(
                      lesson.validatedAt ?? lesson.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <RatingStars
                lessonId={lesson.id}
                initialAvg={lesson.ratingAvg}
                initialCount={lesson.ratingCount}
              />
            </div>
          </CardHeader>
          <CardBody className="grid gap-4">
            {(lesson.projectName || lesson.projectType || lesson.area) && (
              <div className="grid gap-3 sm:grid-cols-3">
                {lesson.projectName ? (
                  <Section title="Proyecto">{lesson.projectName}</Section>
                ) : null}
                {lesson.projectType ? (
                  <Section title="Tipo de proyecto">{lesson.projectType}</Section>
                ) : null}
                {lesson.area ? <Section title="Área">{lesson.area}</Section> : null}
              </div>
            )}
            {lesson.cargo ? (
              <Section title="Cargo">{lesson.cargo}</Section>
            ) : null}
            {lesson.projectStages?.length ? (
              <Section title="Etapa del proyecto">
                {lesson.projectStages
                  .map((s) => projectStageLabel(s))
                  .join(" · ")}
              </Section>
            ) : null}
            <Section title="¿Qué ocurrió?">{lesson.description}</Section>
            <Section title="Causas">{lesson.rootCause}</Section>
            {lesson.actionsTaken ? (
              <Section title="Acciones tomadas">{lesson.actionsTaken}</Section>
            ) : null}
            {lesson.lessonLearned ? (
              <Section title="Lección aprendida">{lesson.lessonLearned}</Section>
            ) : null}
            <Section title="Resumen / solución">{lesson.solution}</Section>
            {lesson.actionPlan ? (
              <Section title="Plan de acción">{lesson.actionPlan}</Section>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Section title="Fecha de suceso">
                {lesson.eventDate
                  ? new Date(lesson.eventDate).toLocaleDateString()
                  : "—"}
              </Section>
              <Section title="Impacto">
                {[
                  lesson.impactTime ? lesson.impactTime : null,
                  lesson.impactCostPen > 0
                    ? `S/ ${lesson.impactCostPen.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </Section>
              <Section title="Métricas">
                {lesson.viewsCount} vistas ·{" "}
                {(lesson.ratingAvg || 0).toFixed(1)} / 5
              </Section>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold text-slate-100">
              Evidencias
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Archivos adjuntos (imágenes o documentos).
            </div>
          </CardHeader>
          <CardBody>
            {evidence.length === 0 ? (
              <div className="text-sm text-slate-300">Sin evidencias.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {evidence.map((e) =>
                  e.type === "DOCUMENT" ? (
                    <a
                      key={e.id}
                      href={e.url}
                      className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-blue-200 transition hover:bg-white/10"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="text-2xl" aria-hidden>
                        📎
                      </span>
                      <span className="font-medium">Ver o descargar documento</span>
                      <span className="break-all text-xs text-slate-400">{e.url}</span>
                    </a>
                  ) : (
                    <a
                      key={e.id}
                      href={e.url}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="relative aspect-video w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={e.url}
                          alt="Evidencia"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                      </div>
                    </a>
                  ),
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

function projectStageLabel(key: string): string {
  switch (key) {
    case "LICITACION":
      return "Licitación";
    case "INICIO":
      return "Inicio";
    case "EJECUCION":
      return "Ejecución";
    case "FINALIZACION":
      return "Finalización";
    default:
      return key;
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-semibold text-slate-200">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-300">{children}</div>
    </div>
  );
}
