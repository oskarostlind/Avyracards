import LoginForm from "@/components/auth/login-form";
import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo-metadata";

export function generateMetadata(): Metadata {
  return pageMetadata({ key: "login", path: "/login", index: false });
}

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4">
      <LoginForm />
    </div>
  );
}
