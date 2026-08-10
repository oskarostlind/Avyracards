export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">Användarvillkor</h1>
      <p className="mt-2 text-slate-300">
        Dessa villkor reglerar användningen av tjänsten AvyraCards. Genom att
        skapa ett konto eller använda tjänsten accepterar du dessa villkor.
      </p>

      <div className="mt-8 space-y-8 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            1. Acceptans av villkor
          </h2>
          <p className="mt-2">
            Genom att registrera dig eller använda AvyraCards godkänner du att
            följa dessa villkor. Om du inte accepterar villkoren ska du inte
            använda tjänsten.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            2. Användarkonto
          </h2>
          <p className="mt-2">
            Du ansvarar för att hålla ditt konto och lösenord säkert. Du är
            ansvarig för all aktivitet som sker via ditt konto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            3. Tillåten användning
          </h2>
          <p className="mt-2">
            Du får inte använda tjänsten på sätt som är olagliga,
            manipulerande, skadliga eller störande för andra användare eller
            system.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            4. Betalningar & prissättning
          </h2>
          <p className="mt-2">
            AvyraCards kan erbjuda gratis och betalda funktioner. Priser kan
            ändras, men användare informeras i god tid innan förändringar träder
            i kraft.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            5. Avslut av konto
          </h2>
          <p className="mt-2">
            Du kan avsluta ditt konto när som helst. AvyraCards förbehåller sig
            rätten att stänga konton som bryter mot dessa villkor eller missbrukar
            tjänsten.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            6. Ansvarsbegränsning
          </h2>
          <p className="mt-2">
            Tjänsten tillhandahålls i befintligt skick. AvyraCards ansvarar inte för indirekta
            skador, dataförlust eller avbrott i tjänsten.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            7. Köp av fysiska produkter
          </h2>
          <p className="mt-2">
            Vid köp av fysiska kort via vår shop gäller följande: Alla priser
            anges i svenska kronor (SEK) inklusive moms. Betalning sker via
            Stripe eller, i iOS-appen, via Apples betalningslösning. Ordern är
            bindande när betalningen har genomförts och du får en
            orderbekräftelse via e-post.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            8. Leverans
          </h2>
          <p className="mt-2">
            Normal leveranstid är 2–4 arbetsdagar inom Sverige. Om en produkt
            är slut i lager eller leveransen försenas väsentligt kontaktar vi
            dig med besked om ny leveranstid, och du har då rätt att avbryta
            köpet och få pengarna tillbaka.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            9. Ångerrätt & returer
          </h2>
          <p className="mt-2">
            Som konsument har du 14 dagars ångerrätt enligt lagen om
            distansavtal, räknat från den dag du tar emot varan. Ångerrätten
            gäller inte kort som tillverkats enligt dina anvisningar eller
            fått en tydlig personlig prägel, till exempel kort med eget
            uppladdat tryck. För att utnyttja ångerrätten, kontakta oss innan
            du returnerar varan. Vid godkänd retur återbetalas beloppet inom
            14 dagar från att vi tagit emot varan. Returfrakten bekostas av
            köparen om inget annat avtalats.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            10. Reklamation
          </h2>
          <p className="mt-2">
            Om en vara är defekt eller skadad vid leverans har du rätt att
            reklamera enligt konsumentköplagen. Kontakta oss så snart som
            möjligt efter att felet upptäckts, så ersätter vi varan eller
            återbetalar köpet.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            11. Prenumerationer
          </h2>
          <p className="mt-2">
            Premium är en löpande prenumeration som förnyas automatiskt tills
            den sägs upp. Du kan när som helst säga upp prenumerationen via
            dina inställningar, och den gäller då till slutet av innevarande
            betalperiod. Köp gjorda i iOS-appen hanteras och sägs upp via ditt
            Apple-konto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            12. Ändringar av villkor
          </h2>
          <p className="mt-2">
            Vi kan uppdatera användarvillkoren när som helst. Fortsatt användning
            efter att ändringarna publicerats innebär att du accepterar dem.
          </p>
        </section>
      </div>
    </main>
  );
}
