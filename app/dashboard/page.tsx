import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardMetrics } from "@/services/metricsService";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Badge";

export const metadata = {
  title: "Dashboard · SAVE IT",
};

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-50">{value}</div>
        <div className="mt-2 text-xs text-slate-400">{hint}</div>
      </CardBody>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const metrics = getDashboardMetrics();

  return (
    <AppShell activePath="/dashboard">
      <div className="grid gap-4 lg:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-slate-300">Hola,</div>
            <div className="text-2xl font-semibold tracking-tight text-slate-50">
              {user.name}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Rol:{" "}
              <Pill tone="blue">
                {user.role === "RESIDENT" ? "Residente (revisor)" : "Ingeniero (registrador)"}
              </Pill>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/lessons/new">
              <Button>Registrar lección</Button>
            </Link>
            <form action={logoutAction}>
              <Button variant="secondary" type="submit">
                Salir
              </Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total de lecciones"
            value={metrics.lessonsTotal}
            hint="Registradas en la plataforma"
          />
          <MetricCard
            label="Validadas"
            value={metrics.lessonsValidated}
            hint="Publicadas en la biblioteca"
          />
          <MetricCard
            label="En revisión"
            value={metrics.lessonsInProgress}
            hint="Recibidas / en proceso"
          />
          <MetricCard
            label="Descartadas"
            value={metrics.lessonsDiscarded}
            hint="No se publican"
          />
        </div>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold text-slate-100">Tendencias por especialidad</div>
            <div className="mt-1 text-sm text-slate-400">
              Frecuencia de registro (resumen simple).
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.topSpecialties.map((s) => (
                <div
                  key={s.specialtyKey}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="text-xs text-slate-400">{s.specialtyKey}</div>
                  <div className="mt-1 text-xl font-semibold text-slate-50">{s.count}</div>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{
                        width:
                          metrics.lessonsTotal > 0
                            ? `${Math.round((s.count / metrics.lessonsTotal) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
              {metrics.topSpecialties.length === 0 ? (
                <div className="text-sm text-slate-400">Aún no hay lecciones registradas.</div>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

