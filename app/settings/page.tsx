import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { AppShell } from "@/components/nav/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const metadata = {
  title: "Configuración · SAVE IT",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");

  return (
    <AppShell activePath="/settings" currentUser={user}>
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-blue-200">
            Configuración
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-50">
            Preferencias
          </div>
          <div className="mt-1 text-sm text-slate-300">
            Ajusta usuario/contraseña.
          </div>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <ChangePasswordForm />
          {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-100">Notificaciones</div>
            <div className="mt-1 text-sm text-slate-300">
              Próxima iteración: alertas por lecciones nuevas.
            </div>
            <div className="mt-4">
              <Button variant="secondary" disabled>
                Configurar
              </Button>
            </div>
          </div> */}
        </CardBody>
      </Card>
    </AppShell>
  );
}
