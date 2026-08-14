import type { sv } from "./sv";

/**
 * `sv` är deklarerad med `as const`, vilket ger literal-typer ("Spara" etc).
 * Loosen byter ut varje literal mot `string` så att en översättning kan ha
 * ett annat värde — men *inte* en annan uppsättning nycklar. Det är den
 * kontrollen vi vill ha: saknad eller felstavad nyckel i `en.ts` blir ett
 * typfel i `tsc --noEmit`.
 */
export type Loosen<T> = T extends string
  ? string
  : { [K in keyof T]: Loosen<T[K]> };

export type Messages = Loosen<typeof sv>;
