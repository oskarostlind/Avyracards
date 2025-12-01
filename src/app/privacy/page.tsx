export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">Integritetspolicy</h1>
      <p className="mt-2 text-slate-300">
        Denna integritetspolicy beskriver hur SocialCard samlar in, använder och
        skyddar personlig information i enlighet med GDPR.
      </p>

      <div className="mt-8 space-y-8 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold text-slate-100">1. Data vi samlar in</h2>
          <p className="mt-2">
            Vi samlar in den information du själv tillhandahåller, såsom namn,
            e-postadress, profilinformation, länkar och inställningar. Vi kan
            också samla teknisk data som IP-adress, enhetstyp och
            användningsstatistik.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            2. Hur vi använder informationen
          </h2>
          <p className="mt-2">
            Informationen används för att tillhandahålla och förbättra tjänsten,
            anpassa din profil, analysera användning och erbjuda support. Vi
            säljer aldrig din information till tredje part.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            3. Lagring & säkerhet
          </h2>
          <p className="mt-2">
            Data lagras säkert i EU hos våra molnleverantörer. Vi vidtar tekniska
            och organisatoriska åtgärder för att skydda din information mot
            obehörig åtkomst eller förlust.
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
              href="mailto:kontakt@socialcard.se"
              className="text-emerald-300 hover:text-emerald-200"
            >
              kontakt@socialcard.se
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
            din webbläsare, men vissa funktioner kan då sluta fungera.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            7. Ändringar i policyn
          </h2>
          <p className="mt-2">
            Vi kan uppdatera denna policy vid behov. Den senaste versionen finns
            alltid på denna sida.
          </p>
        </section>
      </div>
    </main>
  );
}
