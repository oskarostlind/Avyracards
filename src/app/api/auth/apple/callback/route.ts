import { NextResponse } from "next/server";

/**
 * Return URL för Sign in with Apple på webben (registreras på Services ID:t i
 * Apple-portalen). Webbknappen kör popup-läge, där Apple skickar svaret till
 * sidan via postMessage och aldrig navigerar hit. Routen finns för att Apple
 * kräver en registrerad URL på samma domän, och för att en eventuell vilsen
 * POST/GET (t.ex. om popupen blockerades och Apple föll tillbaka på redirect)
 * ska landa på inloggningssidan i stället för en 404.
 */
function backToLogin(req: Request) {
  return NextResponse.redirect(new URL("/login", req.url), 303);
}

export function GET(req: Request) {
  return backToLogin(req);
}

export function POST(req: Request) {
  return backToLogin(req);
}
