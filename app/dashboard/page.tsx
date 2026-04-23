import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardMetrics } from "@/services/metricsService";
import { AppShell } from "@/components/nav/AppShell";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Badge";

export const metadata = {
  title: "Dashboard · SAVE IT",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");

  const metrics = await getDashboardMetrics(user.organizationId);

  return (
    <AppShell activePath="/dashboard" currentUser={user}>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-start lg:gap-6">
        <div className="grid min-w-0 gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Hola,
              </div>
              <div className="text-2xl font-bold uppercase tracking-tight text-slate-50 sm:text-3xl">
                {user.name}!
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Rol:{" "}
                <Pill tone="blue">
                  {user.role === "RESIDENT" ? "Residente (revisor)" : "Ingeniero (registrador)"}
                </Pill>
              </div>
            </div>
            <form
              action="/library"
              method="get"
              className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
            >
              <label className="sr-only" htmlFor="dash-search">
                Buscar
              </label>
              <input
                id="dash-search"
                name="q"
                type="search"
                placeholder="Buscar en la biblioteca…"
                className="h-11 w-full flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/60"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Buscar
              </button>
            </form>
          </div>

          <DashboardCharts
            specialtyBars={metrics.specialtyBars}
            statusCounts={metrics.statusCounts}
          />
        </div>

        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <div className="text-sm font-semibold text-slate-100">Novedades</div>
            <div className="mt-1 text-xs text-slate-400">
              Comentarios y actividad reciente (próximamente).
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-400">
              Aquí verás avisos cuando alguien comente o actualice una lección de tu empresa. Por
              ahora no hay novedades que mostrar.
            </p>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
