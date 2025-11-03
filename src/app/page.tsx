import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 text-center">
      <h1 className="text-4xl font-bold text-slate-900">Välkommen till SocialCard</h1>
      <p className="text-lg text-slate-600">
        Samla dina viktigaste länkar, välj ett tema och dela din profil med världen.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link
          href="/register"
          className="rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-700"
        >
          Skapa konto
        </Link>
        <Link
          href="/u/demo"
          className="rounded-full border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100"
        >
          Se demo-profil
        </Link>
      </div>
    </div>
  );
}
