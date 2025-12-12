import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: {
    cardCode: string;
  };
}

export default async function CardRedirectPage({ params }: Props) {
  const card = await prisma.card.findUnique({
    where: {
      cardCode: params.cardCode,
    },
    include: {
      user: true, 
    },
  });

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Ogiltigt kort</h1>
          <p className="text-gray-600">
            {/* HÄR VAR FELET: Vi använder &quot; istället för " */}
            Koden &quot;{params.cardCode}&quot; kunde inte hittas i vårt system.
          </p>
        </div>
      </div>
    );
  }

  if (card.status === "CLAIMED" && card.user) {
    redirect(`/u/${card.user.username}`);
  }

  if (card.status === "DISABLED" || card.status === "LOST") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Kortet är inaktiverat</h1>
          <p className="text-gray-500">Detta kort har spärrats av ägaren.</p>
        </div>
      </div>
    );
  }

  redirect(`/activate?code=${card.cardCode}&token=${card.claimToken}`);
}