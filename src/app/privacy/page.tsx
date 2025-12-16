export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">Integritetspolicy</h1>
      <p className="mt-2 text-slate-300">
        Denna integritetspolicy beskriver hur AvyraCards samlar in, använder och
        skyddar personlig information i enlighet med GDPR.
      </p>

      <div className="mt-8 space-y-8 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold text-slate-100">1. Data vi samlar in</h2>
          <p className="mt-2">
            Vi samlar in den information du själv tillhandahAťller, sAťsom namn,
            e-postadress, profilinformation, länkar och inställningar. Vi kan
            ocksAť samla teknisk data som IP-adress, enhetstyp och
            användningsstatistik.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            2. Hur vi använder informationen
          </h2>
          <p className="mt-2">
            Informationen används för att tillhandahAťlla och förbättra tjänsten,
            anpassa din profil, analysera användning och erbjuda support. Vi
            säljer aldrig din information till tredje part.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            3. Lagring & säkerhet
          </h2>
          <p className="mt-2">
            Data lagras säkert i EU hos vAťra molnleverantörer. Vi vidtar tekniska
            och organisatoriska Aťtgärder för att skydda din information mot
            obehörig Aťtkomst eller förlust.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            4. Delning av information
          </h2>
          <p className="mt-2">
            Vi delar endast data med betrodda partners som krävs för att driva
            tjänsten, t.ex. molnleverantörer, betalningslösningar och e-posttjänster.
            Vi delar aldrig information för marknadsföringssyften utan ditt samtycke.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            5. Dina rättigheter
          </h2>
          <p className="mt-2">
            Du har rätt att begära utdrag, rättelse, radering och begränsning av
            dina personuppgifter. Kontakta oss via{" "}
            <a
              href="mailto:kontakt@avyracards.se"
              className="text-emerald-300 hover:text-emerald-200"
            >
              kontakt@avyracards.se
            </a>{" "}
            för att utöva dina rättigheter.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            6. Cookies
          </h2>
          <p className="mt-2">
            Vi använder cookies för att förbättra användarupplevelsen, mäta
            trafik och hantera inloggningar. Du kan välja att blockera cookies i
            din webbläsare, men vissa funktioner kan dAť sluta fungera.
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
