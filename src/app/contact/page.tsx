export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">Kontakta oss</h1>
      <p className="mt-2 text-slate-300">
        Har du frAgor om AvyraCards, bestAllningar eller partnerskap? HAr av dig
        sA Aterkommer vi sA snabbt som mAjligt.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div>
          <h2 className="text-xl font-medium">E-post</h2>
          <p className="mt-1 text-slate-300">
            Vi svarar vanligtvis inom 24ƒ?"48 timmar.
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
            FrAgor om ditt konto, NFC-kort eller profil? Vi hjAlper dig gArna!
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium">FAretagsinformation</h2>
          <p className="mt-1 text-slate-300">
            AvyraCards drivs och utvecklas i Sverige. FAr affArsfArfrAgningar,
            fAretagslAsningar eller samarbeten ƒ?" kontakta oss via mail.
          </p>
        </div>
      </div>
    </main>
  );
}
