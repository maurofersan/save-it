import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/types/models";
import { AppShellClient } from "@/components/nav/AppShellClient";

export async function AppShell({
  children,
  activePath,
}: {
  children: ReactNode;
  activePath: string;
}) {
  const user = await getCurrentUser();
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

  const roleLabel = safeUser?.role === "RESIDENT" ? "Residente" : "Ingeniero";

  return (
    <AppShellClient
      activePath={activePath}
      links={links}
      safeUser={
        safeUser
          ? { name: safeUser.name, email: safeUser.email }
          : null
      }
      roleLabel={roleLabel}
    >
      {children}
    </AppShellClient>
  );
}
