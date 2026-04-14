import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/nav/AppShell";
import { Faq } from "@/components/help/Faq";

export const metadata = {
  title: "Ayuda · SAVE IT",
};

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell activePath="/help">
      <Faq />
    </AppShell>
  );
}

