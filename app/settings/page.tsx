import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/nav/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Configuración · SAVE IT",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell activePath="/settings">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-blue-200">Configuración</div>
          <div className="mt-1 text-xl font-semibold text-slate-50">Preferencias</div>
          <div className="mt-1 text-sm text-slate-300">
            Ajusta usuario/contraseña y notificaciones (UI preparada).
          </div>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">Usuario y contraseña</div>
            <div className="mt-1 text-sm text-slate-300">
              Próxima iteración: cambio de contraseña.
            </div>
            <div className="mt-4">
              <Button variant="secondary" disabled>
                Cambiar contraseña
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">Notificaciones</div>
            <div className="mt-1 text-sm text-slate-300">
              Próxima iteración: alertas por lecciones nuevas.
            </div>
            <div className="mt-4">
              <Button variant="secondary" disabled>
                Configurar
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </AppShell>
  );
}

