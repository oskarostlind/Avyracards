import Stripe from 'stripe';

// FIX: Använd en fallback-nyckel om miljövariabeln saknas.
// Detta förhindrar att appen kraschar direkt vid uppstart (t.ex. under build eller lokalt utan env).
// Om man försöker göra ett betalningsanrop kommer det istället att misslyckas kontrollerat då.
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_missing_key_placeholder";

export const stripe = new Stripe(stripeKey, {
  typescript: true,
  //apiVersion: '2024-06-20', // Bra praxis att låsa API-versionen för stabilitet
});