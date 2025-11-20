// Authentication middleware är avstängd eftersom NextAuth-konfigurationen
// använder bcrypt (Node.js-only) som inte stöds i Edge-runtime.
// Skydd av sidor som /dashboard hanteras istället inne i respektive
// serverkomponent via `auth()`.

export const config = {
  matcher: []
};
