import Link from "next/link";
import { redirect } from "next/navigation";
import { searchLibrary } from "@/actions/lessons";
import { getCurrentUser } from "@/lib/auth";
import { listSpecialties } from "@/services/specialtyService";
import type { SpecialtyKey } from "@/types/domain";
import { AppShell } from "@/components/nav/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Badge";
import { RatingStars } from "@/components/library/RatingStars";
import { Select } from "@/components/ui/Select";

export const metadata = {
  title: "Biblioteca · SAVE IT",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string }>;
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
  const lessons = await searchLibrary({
    q: sp.q,
    specialtyKey: specialtyKey ?? undefined,
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
          <form className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-slate-200">Buscar</span>
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Palabras clave, causa, solución..."
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <Select
                name="specialty"
                label="Especialidad"
                defaultValue={sp.specialty ?? ""}
              >
                <option value="">Todas</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </label>
            <button className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
              Buscar
            </button>
          </form>
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-2">
        {lessons.map((l) => (
          <Card key={l.id}>
            <CardBody className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/library/${l.id}`}
                    className="block truncate text-base font-semibold text-slate-50 hover:underline"
                  >
                    {l.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <Pill>{l.specialtyName}</Pill>
                    <span>·</span>
                    <span>{l.viewsCount} vistas</span>
                  </div>
                </div>
                <RatingStars
                  lessonId={l.id}
                  initialAvg={l.ratingAvg}
                  initialCount={l.ratingCount}
                />
              </div>
              <div className="line-clamp-3 text-sm text-slate-300">
                {l.description}
              </div>
              <div className="flex items-center justify-end">
                <Link
                  href={`/library/${l.id}`}
                  className="text-sm font-medium text-blue-200 hover:underline"
                >
                  Ver detalle →
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
        {lessons.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-sm text-slate-300">
                No se encontraron lecciones validadas con esos filtros.
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
