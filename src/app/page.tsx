declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export default function LandingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-semibold mb-4">
        Din digitala visitkortslösning – SocialCard
      </h1>
      <p className="text-slate-300 mb-8 max-w-xl">
        Skapa en personlig profil, lägg till länkar till dina sociala medier och koppla
        dina NFC-kort för att dela allt med en enkel tapp.
      </p>
      <div className="flex gap-4">
        <a
          href="/register"
          className="px-4 py-2 rounded-md bg-slate-50 text-slate-900 text-sm font-medium"
        >
          Skapa konto
        </a>
        <a
          href="/login"
          className="px-4 py-2 rounded-md border border-slate-600 text-sm"
        >
          Logga in
        </a>
      </div>
    </div>
  );
}
