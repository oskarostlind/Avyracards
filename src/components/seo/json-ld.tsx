/**
 * Renderar ett JSON-LD-block i serverns HTML. Serverkomponent — måste ligga
 * utanför klientkomponenter som gatar på state, annars hamnar den bara i
 * RSC-payloaden och crawlern ser den aldrig.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // `<` escapas så att en sträng i datat aldrig kan bryta sig ur script-taggen.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
