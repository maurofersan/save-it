import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/nav/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata = {
  title: "Perfil · SAVE IT",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");

  return (
    <AppShell activePath="/profile">
      <ProfileForm user={user} />
    </AppShell>
  );
}

