"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const ResendSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
});

type ResendFormData = z.infer<typeof ResendSchema>;

export default function ResendVerificationPage() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendFormData>({
    resolver: zodResolver(ResendSchema),
  });

  const onSubmit = async (data: ResendFormData) => {
    setServerError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Något gick fel.");
      }

      setSuccess(true);
    } catch (error) {
      setServerError("Kunde inte skicka mailet. Försök igen senare.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030712] p-4 text-slate-200">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800">
            <Mail className="h-6 w-6 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Verifiera ditt konto</h1>
          <p className="mt-2 text-sm text-slate-400">
            Skriv in din e-postadress så skickar vi en ny verifieringslänk till dig.
          </p>
        </div>

        {success ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center animate-in fade-in zoom-in-95">
            <div className="mb-3 flex justify-center text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="mb-2 font-semibold text-white">Mailet är skickat!</h3>
            <p className="text-sm text-slate-300">
              Kolla din inkorg (och skräppost). Det kan ta någon minut.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till inloggning
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                E-post
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="namn@exempel.se"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-center text-sm text-red-400">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-xl bg-white py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Skicka verifieringsmail"
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Tillbaka till inloggning
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}