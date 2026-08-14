"use client";

import { usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { useT } from "@/i18n/client";

export function SignInButton() {
  const pathname = usePathname();
  const t = useT();

  return (
    <button
      onClick={() => signIn(undefined, { callbackUrl: pathname === "/" ? "/dashboard" : pathname })}
      className="rounded-full bg-slate-900 px-4 py-2 text-nordic-secondary hover:bg-slate-700"
      type="button"
    >
      {t("nav.signIn")}
    </button>
  );
}
