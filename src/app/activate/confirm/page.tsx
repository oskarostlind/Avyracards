import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { claimCard } from "@/lib/card-claim";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface Props {
  searchParams: {
    code?: string;
    token?: string;
  };
}

export const metadata = {
  title: "Bekräfta Aktivering | AvyraCards",
};

export default async function ConfirmActivationPage({ searchParams }: Props) {
  const cardCode = searchParams.code;
  const claimToken = searchParams.token;

  const session = await auth();
  if (!session?.user?.id) {
    // Behåll token genom inloggningen — annars blir länken oanvändbar efteråt.
    const params = new URLSearchParams();
    if (cardCode) params.set("code", cardCode);
    if (claimToken) params.set("token", claimToken);
    return redirect(`/activate?${params.toString()}`);
  }

  let result;
  try {
    result = await claimCard({
      cardCode,
      claimToken,
      userId: session.user.id,
    });
  } catch (error) {
    console.error("Activation error:", error);
    return <ErrorState message="Ett tekniskt fel uppstod vid aktiveringen." />;
  }

  if (!result.ok) {
    if (result.reason === "already_claimed_by_user") {
      redirect("/profile/settings");
    }
    return <ErrorState message={result.message} />;
  }

  return (
    <div className="min-h-screen bg-nordic-primary flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-nordic-primary/80 border border-nordic-highlight/40 p-8 rounded-3xl backdrop-blur-sm animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-nordic-accent/10 text-nordic-accent rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-nordic-accent/30">
          <CheckCircle size={40} />
        </div>

        <h1 className="text-2xl font-bold text-nordic-secondary mb-2">Kortet är aktiverat!</h1>
        <p className="text-nordic-highlight mb-8">
          Ditt AvyraCards <strong>{cardCode}</strong> är nu kopplat till din profil.
        </p>

        <div className="space-y-3">
          <Link
            href="/profile/settings"
            className="block w-full py-3.5 bg-nordic-secondary text-nordic-primary font-bold rounded-xl hover:bg-nordic-support transition-colors"
          >
            Hantera mina kort
          </Link>
          <Link
            href={`/u/${session.user.username}`}
            className="block w-full py-3.5 bg-nordic-accent text-nordic-primary font-medium rounded-xl hover:bg-nordic-accent/80 transition-colors"
          >
            Visa min profil <ArrowRight size={16} className="inline ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-nordic-primary flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-nordic-primary/80 border border-red-900/30 p-8 rounded-3xl backdrop-blur-sm">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-nordic-secondary mb-2">Kunde inte aktivera</h1>
        <p className="text-nordic-highlight mb-6">{message}</p>
        <Link
          href="/activate"
          className="inline-block px-6 py-3 bg-nordic-secondary text-nordic-primary rounded-lg hover:bg-nordic-support transition"
        >
          Försök igen
        </Link>
      </div>
    </div>
  );
}
