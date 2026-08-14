"use client";

import { useTransition } from "react";

import { signOut } from "next-auth/react";
import { useT } from "@/i18n/client";

export function SignOutButton() {
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => signOut({ callbackUrl: "/" }))}
      className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
      type="button"
      disabled={pending}
    >
      {pending ? t("nav.signingOut") : t("nav.signOut")}
    </button>
  );
}
