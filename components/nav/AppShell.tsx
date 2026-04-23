import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationById } from "@/services/organizationService";
import type { User } from "@/types/models";
import { AppShellClient } from "@/components/nav/AppShellClient";

export async function AppShell({
  children,
  activePath,
  currentUser,
}: {
  children: ReactNode;
  activePath: string;
  /** When the parent page already loaded the user, pass it to avoid a second DB round-trip. */
  currentUser?: User | null;
}) {
  const user = currentUser !== undefined ? currentUser : await getCurrentUser();
  const safeUser: User | null = user;

  const org =
    safeUser?.organizationId != null
      ? await getOrganizationById(safeUser.organizationId)
      : null;

  const links = [
    { href: "/dashboard", label: "Inicio" },
    ...(safeUser?.role === "ENGINEER" ? [{ href: "/lessons/new", label: "Registrar" }] : []),
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
      orgBrand={
        org
          ? { name: org.name, logoUrl: org.logoUrl }
          : null
      }
      roleLabel={roleLabel}
    >
      {children}
    </AppShellClient>
  );
}
