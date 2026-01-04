import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Sidan kunde inte hittas</h1>
      <p className="text-slate-600">Profilen du letade efter finns inte. Kontrollera länken och försök igen.</p>
      <Link href="/" className="rounded-full bg-slate-900 px-6 py-2 text-nordic-secondary hover:bg-slate-700">
        Till startsidan
      </Link>
    </div>
  );
}
