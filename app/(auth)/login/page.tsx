import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login · SAVE IT",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return <LoginForm next={sp.next} />;
}

