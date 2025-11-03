import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/app/api/auth/[...nextauth]/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
