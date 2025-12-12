"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

// 1. Definiera schemat för validering
const LoginSchema = z.object({
  username: z.string().min(1, "Användarnamn krävs"), // Vi använder username nu, inte email
  password: z.string().min(1, "Lösenord krävs"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [globalError, setGlobalError] = useState<string>("");

  // 2. Koppla React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(""); // Rensa gamla fel

    try {
      // 3. Anropa NextAuth signIn
      const result = await signIn("credentials", {
        username: data.username, // Viktigt: Vi skickar 'username' till vår authorize-funktion
        password: data.password,
        redirect: false, // Vi hanterar redirect manuellt för bättre UX
      });

      if (result?.error) {
        // Om inloggningen misslyckades
        setGlobalError("Felaktigt användarnamn eller lösenord.");
      } else {
        // Succé! Skicka användaren vidare
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setGlobalError("Något gick fel. Försök igen senare.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Välkommen tillbaka
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Logga in för att hantera din profil
        </p>
      </div>

      {/* Globalt felmeddelande (t.ex. "Fel lösenord") */}
      {globalError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Användarnamn */}
        <div className="space-y-2">
          <label 
            htmlFor="username" 
            className="block text-sm font-medium text-gray-700"
          >
            Användarnamn
          </label>
          <input
            {...register("username")}
            id="username"
            type="text"
            placeholder="Ditt användarnamn"
            autoCapitalize="none"
            autoCorrect="off"
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
              errors.username 
                ? "border-red-300 focus:border-red-500" 
                : "border-gray-200 focus:border-blue-500"
            }`}
          />
          {errors.username && (
            <p className="text-xs text-red-500 font-medium ml-1">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Lösenord */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700"
            >
              Lösenord
            </label>
            <Link 
              href="/forgot-password" 
              className="text-xs font-medium text-blue-600 hover:text-blue-500"
            >
              Glömt lösenord?
            </Link>
          </div>
          <input
            {...register("password")}
            id="password"
            type="password"
            placeholder="••••••••"
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
              errors.password 
                ? "border-red-300 focus:border-red-500" 
                : "border-gray-200 focus:border-blue-500"
            }`}
          />
          {errors.password && (
            <p className="text-xs text-red-500 font-medium ml-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center py-3 px-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Logga in"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Har du inget konto?{" "}
        <Link href="/register" className="font-semibold text-black hover:underline">
          Skapa konto
        </Link>
      </p>
    </div>
  );
}