"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, User, Mail, Lock } from "lucide-react";
import { signIn } from "next-auth/react";

export default function ActivateAccountPage() {
  // Tog bort const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(""); 

  const handleActivation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username,
          isPremium: true,
          stripeSessionId: sessionId 
        }),
      });

      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || "Kunde inte skapa konto");
      }

      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
      });

    } catch (error: any) {
      console.error(error);
      setLoading(false);
      alert(error.message || "Något gick fel.");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
         
         <div className="text-center space-y-4 mb-8">
            <div className="mx-auto w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center ring-1 ring-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
               <CheckCircle2 size={40} />
            </div>
            <h1 className="text-3xl font-bold">Betalning Mottagen!</h1>
            <p className="text-gray-400">
               Tack för ditt köp. Slutför din registrering nedan för att komma igång direkt.
            </p>
         </div>

         <div className="bg-[#0A0F1C] border border-gray-800 p-8 rounded-2xl shadow-xl">
            <form onSubmit={handleActivation} className="space-y-5">
               
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Användarnamn</label>
                  <div className="relative">
                     <User className="absolute left-4 top-3.5 text-gray-500" size={18} />
                     <input 
                        name="username" 
                        type="text" 
                        required 
                        placeholder="dittnamn" 
                        className="w-full bg-[#030712] border border-gray-700 rounded-xl pl-11 pr-4 py-3 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all placeholder:text-gray-600" 
                     />
                  </div>
                  <p className="text-[10px] text-gray-500 pl-1">Din länk: socialcard.se/användarnamn</p>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">E-post</label>
                  <div className="relative">
                     <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                     <input 
                        name="email" 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="namn@exempel.se"
                        className="w-full bg-[#030712] border border-gray-700 rounded-xl pl-11 pr-4 py-3 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all placeholder:text-gray-600"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Lösenord</label>
                  <div className="relative">
                     <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                     <input 
                        name="password" 
                        type="password" 
                        required 
                        placeholder="••••••••" 
                        className="w-full bg-[#030712] border border-gray-700 rounded-xl pl-11 pr-4 py-3 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all placeholder:text-gray-600" 
                     />
                  </div>
               </div>

               <button disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 transition-all shadow-lg flex justify-center mt-4">
                  {loading ? <Loader2 className="animate-spin"/> : "Aktivera konto"}
               </button>
            </form>
         </div>
      </div>
    </div>
  );
}