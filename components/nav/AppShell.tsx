import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationById } from "@/services/organizationService";
import { countUnreadForUser } from "@/services/notificationService";
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

  let initialUnread = 0;
  if (safeUser?.organizationId) {
    initialUnread = await countUnreadForUser(safeUser.id, safeUser.organizationId);
  }

  const links = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/profile", label: "Perfil" },
    { href: "/lessons/new", label: "Registrar" },
    { href: "/library", label: "Visualizar" },
    ...(safeUser?.role === "RESIDENT" ? [{ href: "/validate", label: "Validar" }] : []),
    { href: "/members", label: "Miembros" },
    { href: "/settings", label: "Configuración" },
    { href: "/help", label: "Ayuda" },
  ];

  const roleLabel = safeUser?.role === "RESIDENT" ? "Residente" : "Ingeniero";

  return (
    <AppShellClient
      activePath={activePath}
      links={links}
      safeUser={
        safeUser
          ? { name: safeUser.name, email: safeUser.email, avatarUrl: safeUser.avatarUrl }
          : null
      }
      orgBrand={
        org
          ? { name: org.name, logoUrl: org.logoUrl }
          : null
      }
      roleLabel={roleLabel}
      notification={
        safeUser?.organizationId
          ? {
              userId: safeUser.id,
              organizationId: safeUser.organizationId,
              userRole: safeUser.role,
              initialUnread,
            }
          : null
      }
    >
      {children}
    </AppShellClient>
  );
}
