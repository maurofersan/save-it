import { redirect } from "next/navigation";
import { listValidationQueue } from "@/actions/lessons";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/nav/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ValidationQueue } from "@/components/lessons/ValidationQueue";
import type { LessonStatus } from "@/types/domain";

export const metadata = {
  title: "Validación · SAVE IT",
};

export default async function ValidatePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "RESIDENT") redirect("/dashboard");

  const sp = await searchParams;
  const status: LessonStatus | undefined =
    sp.status === "RECEIVED" ||
    sp.status === "IN_PROGRESS" ||
    sp.status === "VALIDATED" ||
    sp.status === "DISCARDED"
      ? (sp.status as LessonStatus)
      : undefined;
  const lessons = await listValidationQueue({
    q: sp.q,
    status,
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
          <form className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-slate-200">Buscar</span>
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Título, descripción o autor..."
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/60"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-slate-200">Estado</span>
              <select
                name="status"
                defaultValue={sp.status ?? ""}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/60"
              >
                <option value="">Todos</option>
                <option value="RECEIVED">Recibido</option>
                <option value="IN_PROGRESS">En proceso</option>
                <option value="VALIDATED">Validado</option>
                <option value="DISCARDED">Descartado</option>
              </select>
            </label>
            <button className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
              Filtrar
            </button>
          </form>
        </CardBody>
      </Card>

      <div className="mt-4 lg:mt-6">
        <ValidationQueue lessons={lessons} />
      </div>
    </AppShell>
  );
}

