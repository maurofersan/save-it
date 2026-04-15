import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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

  const { id } = await params;
  const lessonId = Number(id);
  if (!lessonId) redirect("/library");

  const lesson = getValidatedLessonWithSpecialtyById(lessonId);
  if (!lesson) redirect("/library");

  const evidence = listEvidenceForLesson(lessonId);

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
          <ViewCounter lessonId={lessonId} initialViews={lesson.viewsCount} />
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
            <Section title="¿Qué ocurrió?">{lesson.description}</Section>
            <Section title="Causa raíz">{lesson.rootCause}</Section>
            <Section title="Solución">{lesson.solution}</Section>
            <div className="grid gap-3 sm:grid-cols-2">
              <Section title="Fecha de suceso">
                {lesson.eventDate
                  ? new Date(lesson.eventDate).toLocaleDateString()
                  : "—"}
              </Section>
              <Section title="Impacto">
                {lesson.impactType === "TIME" ? "Tiempo" : "Costo"} ·{" "}
                {lesson.impactValue}
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
              Fotos adjuntas a la lección.
            </div>
          </CardHeader>
          <CardBody>
            {evidence.length === 0 ? (
              <div className="text-sm text-slate-300">Sin evidencias.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {evidence.map((e) => (
                  <a
                    key={e.id}
                    href={e.url}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="relative aspect-video w-full">
                      <Image
                        src={e.url}
                        alt="Evidencia"
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
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
