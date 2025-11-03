"use client";

import { useTransition } from "react";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => signOut({ callbackUrl: "/" }))}
      className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
      type="button"
      disabled={pending}
    >
      {pending ? "Loggar ut..." : "Logga ut"}
    </button>
  );
}
