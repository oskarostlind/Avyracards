"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Loader2, AlertCircle } from "lucide-react"; // Tog bort CheckCircle
import { useSession } from "next-auth/react";

export default function ConfirmClaimPage() {
  return (
    <Suspense fallback={<div>Laddar...</div>}>
      <ConfirmLogic />
    </Suspense>
  );
}

function ConfirmLogic() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const cardCode = searchParams.get("code");
  const claimToken = searchParams.get("token");
  
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  if (status === "unauthenticated") {
     // Lägg till encodeURIComponent för säkerhet
     const callbackUrl = encodeURIComponent(`/activate/confirm?code=${cardCode}&token=${claimToken}`);
     router.push(`/login?callbackUrl=${callbackUrl}`);
     return null;
  }

  const handleClaim = async () => {
    setClaiming(true);
    setError("");

    try {
      const res = await fetch("/api/cards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardCode, claimToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Kunde inte aktivera kortet");
      }

      router.push("/dashboard?claimed=true");
      router.refresh(); 
      
    } catch (err: any) {
      setError(err.message);
      setClaiming(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
       <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2">Bekräfta aktivering</h1>
          <p className="text-gray-600 mb-6">
            Du är inloggad som <strong>{session?.user?.email}</strong>.
            Vill du koppla kortet <strong>{cardCode}</strong> till detta konto?
          </p>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 justify-center">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {claiming ? <Loader2 className="animate-spin" /> : "Ja, koppla kortet nu"}
          </button>
          
          <button 
            onClick={() => router.back()}
            className="mt-4 text-gray-500 text-sm hover:underline"
          >
            Avbryt
          </button>
       </div>
    </div>
  );
}