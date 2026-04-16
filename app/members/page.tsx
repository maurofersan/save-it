import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMembers } from "@/services/userService";
import { AppShell } from "@/components/nav/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Badge";

export const metadata = {
  title: "Miembros · SAVE IT",
};

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const members = await listMembers();

  return (
    <AppShell activePath="/members">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-blue-200">Miembros</div>
          <div className="mt-1 text-xl font-semibold text-slate-50">Usuarios registrados</div>
          <div className="mt-1 text-sm text-slate-300">
            Identifica al Residente (revisor) y a los ingenieros (registradores).
          </div>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Cargo</th>
                  <th className="py-2">Rol</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-white/10">
                    <td className="py-3 text-slate-100">{m.name}</td>
                    <td className="py-3 text-slate-300">{m.email}</td>
                    <td className="py-3 text-slate-300">{m.title ?? "—"}</td>
                    <td className="py-3">
                      <Pill tone="blue">
                        {m.role === "RESIDENT" ? "Residente" : "Ingeniero"}
                      </Pill>
                    </td>
                  </tr>
                ))}
                {members.length === 0 ? (
                  <tr>
                    <td className="py-4 text-slate-300" colSpan={4}>
                      Aún no hay usuarios.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </AppShell>
  );
}

