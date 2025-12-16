export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">Integritetspolicy</h1>
      <p className="mt-2 text-slate-300">
        Denna integritetspolicy beskriver hur AvyraCards samlar in, anvAnder och
        skyddar personlig information i enlighet med GDPR.
      </p>

      <div className="mt-8 space-y-8 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold text-slate-100">1. Data vi samlar in</h2>
          <p className="mt-2">
            Vi samlar in den information du sjAlv tillhandahAťller, sAťsom namn,
            e-postadress, profilinformation, lAnkar och instAllningar. Vi kan
            ocksAť samla teknisk data som IP-adress, enhetstyp och
            anvAndningsstatistik.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            2. Hur vi anvAnder informationen
          </h2>
          <p className="mt-2">
            Informationen anvAnds fAr att tillhandahAťlla och fArbAttra tjAnsten,
            anpassa din profil, analysera anvAndning och erbjuda support. Vi
            sAljer aldrig din information till tredje part.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            3. Lagring & sAkerhet
          </h2>
          <p className="mt-2">
            Data lagras sAkert i EU hos vAťra molnleverantArer. Vi vidtar tekniska
            och organisatoriska AťtgArder fAr att skydda din information mot
            obehArig Aťtkomst eller fArlust.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            4. Delning av information
          </h2>
          <p className="mt-2">
            Vi delar endast data med betrodda partners som krAvs fAr att driva
            tjAnsten, t.ex. molnleverantArer, betalningslAsningar och e-posttjAnster.
            Vi delar aldrig information fAr marknadsfAringssyften utan ditt samtycke.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            5. Dina rAttigheter
          </h2>
          <p className="mt-2">
            Du har rAtt att begAra utdrag, rAttelse, radering och begrAnsning av
            dina personuppgifter. Kontakta oss via{" "}
            <a
              href="mailto:kontakt@avyracards.se"
              className="text-emerald-300 hover:text-emerald-200"
            >
              kontakt@avyracards.se
            </a>{" "}
            fAr att utAva dina rAttigheter.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            6. Cookies
          </h2>
          <p className="mt-2">
            Vi anvAnder cookies fAr att fArbAttra anvAndarupplevelsen, mAta
            trafik och hantera inloggningar. Du kan vAlja att blockera cookies i
            din webblAsare, men vissa funktioner kan dAť sluta fungera.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            7. A,ndringar i policyn
          </h2>
          <p className="mt-2">
            Vi kan uppdatera denna policy vid behov. Den senaste versionen finns
            alltid pAť denna sida.
          </p>
        </section>
      </div>
    </main>
  );
}
