import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/i18n/server";

interface Props {
  params: {
    cardCode: string;
  };
}

export default async function CardRedirectPage({ params }: Props) {
  const t = getT();
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
      <div className="min-h-screen flex items-center justify-center bg-transparent p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">{t("cardRedirect.invalidTitle")}</h1>
          <p className="text-nordic-highlight">
            {t("cardRedirect.invalidBody", { code: params.cardCode })}
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
      <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
        <div className="bg-nordic-primary p-8 rounded-xl shadow-sm border border-nordic-support max-w-md text-center">
          <h1 className="text-xl font-bold text-nordic-secondary mb-2">{t("cardRedirect.disabledTitle")}</h1>
          <p className="text-nordic-highlight">{t("cardRedirect.disabledBody")}</p>
        </div>
      </div>
    );
  }

  redirect(`/activate?code=${card.cardCode}&token=${card.claimToken}`);
}
