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
    <div className="flex min-h-screen items-center justify-center bg-nordic-primary p-4 text-nordic-secondary">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-nordic-highlight/40 bg-nordic-primary p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-nordic-primary border border-nordic-highlight/40">
            <Mail className="h-6 w-6 text-nordic-accent" />
          </div>
          <h1 className="text-2xl font-bold text-nordic-secondary">Verifiera ditt konto</h1>
          <p className="mt-2 text-sm text-nordic-highlight">
            Skriv in din e-postadress så skickar vi en ny verifieringslänk till dig.
          </p>
        </div>

        {success ? (
          <div className="rounded-xl border border-nordic-accent/30 bg-nordic-accent/10 p-6 text-center animate-in fade-in zoom-in-95">
            <div className="mb-3 flex justify-center text-nordic-accent">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="mb-2 font-semibold text-nordic-secondary">Mailet är skickat!</h3>
            <p className="text-sm text-nordic-highlight">
              Kolla din inkorg (och skräppost). Det kan ta någon minut.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center text-sm font-medium text-nordic-accent hover:text-nordic-accent/80"
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
                className="w-full rounded-xl border border-nordic-highlight/40 bg-nordic-primary px-4 py-3 text-nordic-secondary placeholder:text-nordic-highlight/60 focus:border-nordic-accent focus:outline-none focus:ring-1 focus:ring-nordic-accent transition-all"
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
              className="flex w-full items-center justify-center rounded-xl bg-nordic-secondary py-3.5 text-sm font-bold text-nordic-primary transition hover:bg-nordic-support disabled:opacity-50"
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
              className="text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors"
            >
              Tillbaka till inloggning
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
