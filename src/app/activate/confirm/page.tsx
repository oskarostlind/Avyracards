import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface Props {
  searchParams: {
    code?: string;
    token?: string;
  };
}

export const metadata = {
  title: "Bekräfta Aktivering | SocialCard",
};

export default async function ConfirmActivationPage({ searchParams }: Props) {
  // 1. Kontrollera inloggning
  const session = await auth();
  if (!session?.user?.id) {
    // Om man inte är inloggad, skicka tillbaka till startrutan
    return redirect(`/activate?code=${searchParams.code || ""}`);
  }

  const cardCode = searchParams.code;

  if (!cardCode) {
    return <ErrorState message="Ingen kortkod hittades." />;
  }

  // 2. Hitta kortet i databasen
  const card = await prisma.card.findUnique({
    where: { cardCode: cardCode },
  });

  if (!card) {
    return <ErrorState message="Ogiltig kortkod. Kontrollera vad som står på kortet." />;
  }

  if (card.status !== "UNCLAIMED") {
    // FIX 1: Använd 'assignedUserId' istället för 'userId'
    if (card.assignedUserId === session.user.id) {
      redirect("/profile/settings");
    }
    return <ErrorState message="Detta kort är redan aktiverat av en annan användare." />;
  }

  // 3. KOPPLA KORTET (The Magic Moment ✨)
  try {
    await prisma.card.update({
      where: { id: card.id },
      data: {
        // FIX 2: Matcha fältnamnen i din schema.prisma
        assignedUserId: session.user.id,
        status: "CLAIMED",
        claimedAt: new Date(), // FIX 3: Använd 'claimedAt' istället för 'activatedAt'
      },
    });
  } catch (error) {
    console.error("Activation error:", error);
    return <ErrorState message="Ett tekniskt fel uppstod vid aktiveringen." />;
  }

  // 4. Visa Success-sida
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm animate-in zoom-in-95 duration-300">
        
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/20">
          <CheckCircle size={40} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Kortet är aktiverat!</h1>
        <p className="text-slate-400 mb-8">
          Ditt SocialCard <strong>{cardCode}</strong> är nu kopplat till din profil.
        </p>

        <div className="space-y-3">
          <Link
            href="/profile/settings"
            className="block w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Hantera mina kort
          </Link>
          <Link
            href={`/u/${session.user.username}`}
            className="block w-full py-3.5 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-slate-900/50 border border-red-900/30 p-8 rounded-3xl">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Kunde inte aktivera</h1>
        <p className="text-slate-400 mb-6">{message}</p>
        <Link
          href="/activate"
          className="inline-block px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
        >
          Försök igen
        </Link>
      </div>
    </div>
  );
}