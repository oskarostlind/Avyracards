import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/app/api/auth/[...nextauth]/auth";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}
