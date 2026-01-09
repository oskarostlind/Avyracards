import RegisterForm from "@/components/auth/register-form";

// Vi tar emot searchParams för att se om användaren valde "free" eller "premium"
export default function RegisterPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const selectedPlan = searchParams.plan || "free";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      {/* Skicka vidare vald plan till formuläret */}
      <RegisterForm selectedPlan={selectedPlan} />
    </div>
  );
}