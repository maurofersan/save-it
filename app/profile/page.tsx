import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationById } from "@/services/organizationService";
import { AppShell } from "@/components/nav/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata = {
  title: "Perfil · SAVE IT",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");

  const org = await getOrganizationById(user.organizationId);
  const organizationName = org?.name ?? "—";

  return (
    <AppShell activePath="/profile">
      <ProfileForm user={user} organizationName={organizationName} />
    </AppShell>
  );
}

