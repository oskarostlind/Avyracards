import LoginForm from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logga in | SocialCard",
  description: "Logga in på ditt SocialCard konto",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4">
      <LoginForm />
    </div>
  );
}