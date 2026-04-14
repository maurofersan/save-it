import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/types/models";

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-blue-600/15 text-blue-200 border border-blue-500/25"
          : "text-slate-200 hover:bg-white/5 border border-transparent"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-blue-400/60" />
      <span>{label}</span>
    </Link>
  );
}

export async function AppShell({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  const user = await getCurrentUser();
  // middleware blocks unauthenticated access, but keep it defensive
  const safeUser: User | null = user;

  const links = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/lessons/new", label: "Registrar" },
    { href: "/library", label: "Visualizar" },
    ...(safeUser?.role === "RESIDENT" ? [{ href: "/validate", label: "Validar" }] : []),
    { href: "/members", label: "Miembros" },
    { href: "/profile", label: "Perfil" },
    { href: "/help", label: "Ayuda" },
    { href: "/settings", label: "Configuración" },
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
          <aside className="c-card rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/15 border border-blue-500/20">
                  <span className="text-sm font-semibold text-blue-200">SI</span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-slate-100">SAVE IT</div>
                  <div className="text-xs text-slate-400">Lecciones Aprendidas</div>
                </div>
              </div>
              <div className="hidden text-xs text-slate-400 sm:block">
                {safeUser?.role === "RESIDENT" ? "Residente" : "Ingeniero"}
              </div>
            </div>

            <nav className="mt-4 flex flex-col gap-1">
              {links.map((l) => (
                <NavLink key={l.href} href={l.href} label={l.label} active={activePath === l.href} />
              ))}
            </nav>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">Sesión</div>
              <div className="mt-1 text-sm font-medium text-slate-100">
                {safeUser?.name ?? "Usuario"}
              </div>
              <div className="text-xs text-slate-400">{safeUser?.email ?? ""}</div>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

