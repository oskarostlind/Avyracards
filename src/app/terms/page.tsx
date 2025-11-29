export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold">Användarvillkor</h1>
      <p className="mt-2 text-slate-300">
        Dessa villkor reglerar användningen av tjänsten SocialCard. Genom att
        skapa ett konto eller använda tjänsten accepterar du dessa villkor.
      </p>

      <div className="mt-8 space-y-8 text-slate-300">
        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            1. Acceptans av villkor
          </h2>
          <p className="mt-2">
            Genom att registrera dig eller använda SocialCard godkänner du att
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
            SocialCard kan erbjuda gratis och betalda funktioner. Priser kan
            ändras, men användare informeras i god tid innan förändringar träder
            i kraft.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            5. Avslut av konto
          </h2>
          <p className="mt-2">
            Du kan avsluta ditt konto när som helst. SocialCard förbehåller sig
            rätten att stänga konton som bryter mot dessa villkor eller missbrukar
            tjänsten.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            6. Ansvarsbegränsning
          </h2>
          <p className="mt-2">
            Tjänsten erbjuds “som den är”. SocialCard ansvarar inte för indirekta
            skador, dataförlust eller avbrott i tjänsten.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-100">
            7. Ändringar av villkor
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
