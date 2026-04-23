import { redirect } from "next/navigation";

export const metadata = {
  title: "Registro · SAVE IT",
};

export default function RegisterPage() {
  redirect("/login");
}

