export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">Kontakta oss</h1>
      <p className="mt-2 text-slate-300">
        Har du frågor om AvyraCards, beställningar eller partnerskap? Hör av dig
        så återkommer vi så snabbt som möjligt.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border border-nordic-highlight/40 bg-slate-900/40 p-6">
        <div>
          <h2 className="text-xl font-medium">E-post</h2>
          <p className="mt-1 text-slate-300">
            Vi svarar vanligtvis inom 24-48 timmar.
          </p>
          <p className="mt-2">
            <a
              href="mailto:kontakt@avyracards.se"
              className="text-emerald-300 hover:text-emerald-200"
            >
              kontakt@avyracards.se
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium">Support</h2>
          <p className="mt-1 text-slate-300">
            Frågor om ditt konto, NFC-kort eller profil? Vi hjälper dig gärna!
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium">Företagsinformation</h2>
          <p className="mt-1 text-slate-300">
            AvyraCards drivs och utvecklas i Sverige. För affärsförfrågningar,
            företagslösningar eller samarbeten - kontakta oss via mail.
          </p>
        </div>
      </div>
    </main>
  );
}
