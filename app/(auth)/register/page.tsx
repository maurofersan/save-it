import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Registro · SAVE IT",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return <RegisterForm next={sp.next} />;
}

