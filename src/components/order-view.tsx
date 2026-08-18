"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Loader2, Layers, CreditCard, Upload, X, Check, Sparkles, ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { CardPreview3D } from "@/components/card-preview-3d";
import { LiveProfileDemo } from "@/components/live-profile-demo";
import { useIosNativePayments } from "@/hooks/useIosNativePayments";
import { useIsApp } from "@/hooks/useIsApp";
import { IosOrderCheckout } from "@/components/checkout/ios-order-checkout";
import { SubscriptionTerms } from "@/components/checkout/subscription-terms";
import { PREMIUM_6MO_PRICE_ORE } from "@/lib/constants";
import type { MappedProfileData } from "@/lib/profile-mapper";
import type { CustomThemeSettings } from "@/types/theme";
import { useT } from "@/i18n/client";
import type { Translator } from "@/i18n";

// --- Types ---
type MaterialType = "plastic" | "metal";
type DesignType = "minimal" | "qr";
// "1mo"    = startpaketets gratismånad, levereras med kortordern (endast webb).
// "1moIap" = löpande månadsprenumeration köpt via Apples IAP (endast i appen).
//            Två skilda värden eftersom de har olika pris, villkor OCH betalväg
//            — de får aldrig kunna förväxlas i Stripe-payloaden.
type PremiumOption = "none" | "1mo" | "1moIap" | "6mo";

export interface DbVariant {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  colorCode: string | null;
  type: string;
}

interface OrderViewProps {
  standardVariants: DbVariant[];
  metalVariants: DbVariant[];
  bundleVariant: DbVariant | null;
  isPremium: boolean;
  isLoggedIn: boolean;
  /** Kundens riktiga profil — visas i premium-previewn i stället för mock. */
  profileData: MappedProfileData | null;
  profileSettings: CustomThemeSettings | null;
  /** Månadspris för premium (öre), från DB. Visas som jämförelsepris. */
  premiumMonthlyOre: number;
}

export default function OrderViewWrapper(props: OrderViewProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <Loader2 className="animate-spin text-white relative z-10" />
      </div>
    }>
      <OrderViewContent {...props} />
    </Suspense>
  );
}

function OrderViewContent({ standardVariants, metalVariants, bundleVariant, isPremium, isLoggedIn, profileData, profileSettings, premiumMonthlyOre }: OrderViewProps) {
  const t = useT();
  /** Prisrad med rätt valutasuffix för valt språk ("299 kr" / "299 SEK"). */
  const price = (amount: number | string) => t("order.price", { amount: String(amount) });
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const isIosCheckout = useIosNativePayments();
  // Guideline 3.1.1 (App Review-avslag 2026-08-17): "Startpaket — 1 mån
  // Premium" ger en digital premiummånad som betalas som del av kortordern
  // (Apple Pay/Stripe) — dvs. via annat än IAP. Erbjudandet får därför aldrig
  // visas i appen, oavsett om IAP är påslaget. 6-månaders visas i appen bara
  // när IAP-flödet är aktivt (köps då via StoreKit innan kortbetalningen).
  const isApp = useIsApp();
  const showStarterPack = !isApp;
  const showSixMonths = !isApp || isIosCheckout;
  // Månadspremium finns kvar i appen — men som riktig prenumeration via
  // StoreKit (samma väg som 6-månaders), aldrig som tillägg på kortordern.
  // "1 mån"-platsen i nivåvalet är alltså startpaketet på webben och den
  // löpande IAP-prenumerationen i appen, så flödet har tre val i båda fallen.
  const showMonthlyIap = isApp && isIosCheckout;
  const [iosCheckoutItems, setIosCheckoutItems] = useState<Array<{
    variantId: string;
    quantity: number;
    color?: string;
    design?: string;
    material?: string;
    customPrintUrl?: string | null;
  }> | null>(null);

  const defaultStandardColor = standardVariants[0]?.colorCode || "#1a1a1a";
  const defaultMetalColor = metalVariants[0]?.colorCode || "#171717";

  // Lagersaldo-kontroll
  const hasStandard = standardVariants && standardVariants.length > 0;
  const hasMetal = metalVariants && metalVariants.length > 0;

  // Välj det första tillgängliga materialet som standard
  const initialMaterial: MaterialType = hasStandard ? "plastic" : (hasMetal ? "metal" : "plastic");

  const [material, setMaterial] = useState<MaterialType>(initialMaterial);
  const [design] = useState<DesignType>("minimal");
  const [colorCode, setColorCode] = useState<string>(hasStandard ? defaultStandardColor : defaultMetalColor);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customFile, setCustomFile] = useState<File | null>(null);

  const [premiumOption, setPremiumOption] = useState<PremiumOption>("none");

  // Stegat flöde: 1 = Designa kortet, 2 = Välj nivå, 3 = Sammanfattning.
  // Premium-användare har inget nivåval och hoppar över steg 2.
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const steps = isPremium
    ? [
        { n: 1, label: t("order.stepDesign") },
        { n: 3, label: t("order.stepSummary") },
      ]
    : [
        { n: 1, label: t("order.stepDesign") },
        { n: 2, label: t("order.stepTier") },
        { n: 3, label: t("order.stepSummary") },
      ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    // Startpaket-länk (från registrering/get-started): förvälj 1 mån premium
    const isBundle = searchParams.get("bundle") === "pro-bundle";
    if (isBundle && !isPremium) {
      setPremiumOption("1mo");
      if (hasStandard) {
        setMaterial("plastic");
        setColorCode(defaultStandardColor);
      }
    }

    // ?variantId= skickas från dashboard-widgeten och onboardingen.
    // Tidigare ignorerades parametern helt — nu förväljer den rätt kort.
    const variantId = searchParams.get("variantId");
    if (variantId) {
      const std = standardVariants.find(v => v.id === variantId);
      const met = metalVariants.find(v => v.id === variantId);
      if (std) {
        setMaterial("plastic");
        setColorCode(std.colorCode || defaultStandardColor);
      } else if (met) {
        setMaterial("metal");
        setColorCode(met.colorCode || defaultMetalColor);
      } else if (!isPremium) {
        // Okänt ID (t.ex. bundle-variant) → tolka som startpaket
        setPremiumOption("1mo");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isPremium, hasStandard]);

  // isApp sätts asynkront (Capacitor-bridgen läses i en effect) — nollställ
  // därför otillåtna förval när appen väl identifierats, t.ex. startpaketet
  // som förväljs via ?bundle=pro-bundle ovan. (Guideline 3.1.1)
  useEffect(() => {
    if (isApp && premiumOption === "1mo") {
      setPremiumOption("none");
    }
    if (isApp && !isIosCheckout && (premiumOption === "6mo" || premiumOption === "1moIap")) {
      setPremiumOption("none");
    }
    // Motsatt riktning: IAP-månaden kan bara betalas i appen.
    if (!isApp && premiumOption === "1moIap") {
      setPremiumOption("none");
    }
  }, [isApp, isIosCheckout, premiumOption]);

  // --- Helpers ---
  const findSelectedVariant = () => {
    const variants = material === "plastic" ? standardVariants : metalVariants;
    return variants.find(v => v.colorCode === colorCode) || variants[0];
  };

  const selectedVariant = findSelectedVariant();
  const quantity = 1;

  const getDisplayPriceForMaterial = (m: MaterialType) => {
      const variants = m === "plastic" ? standardVariants : metalVariants;
      if (variants.length === 0) return { price: 0, compareAt: null };

      if (material === m) {
          const variant = variants.find(v => v.colorCode === colorCode);
          const active = variant || variants[0];
          return { price: active.price, compareAt: active.compareAtPrice };
      }

      const cheapest = variants.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
      return { price: cheapest.price, compareAt: cheapest.compareAtPrice };
  };

  const standardDisplay = getDisplayPriceForMaterial("plastic");
  const metalDisplay = getDisplayPriceForMaterial("metal");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setCustomFile(file);
          const url = URL.createObjectURL(file);
          setCustomImage(url);
      }
  };

  const clearImage = () => {
      setCustomImage(null);
      setCustomFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectMaterial = (m: MaterialType) => {
    setMaterial(m);
    if (m === "plastic") {
      setCustomImage(null);
      setColorCode(defaultStandardColor);
    } else {
      setColorCode(defaultMetalColor);
    }
  };

  const handleCheckout = async () => {
      if (!selectedVariant) return alert(t("order.noVariant"));

      // Checkout kräver inloggning — skicka till login med återvändo i stället
      // för att låta API:t svara 401 och visa ett kryptiskt felmeddelande.
      if (!isLoggedIn) {
        window.location.href = "/login?callbackUrl=" + encodeURIComponent("/order");
        return;
      }

      try {
        setLoading(true);
        let printFileUrl = null;

        if (customFile && material === "metal") {
            const formData = new FormData();
            formData.append('file', customFile);

            const uploadRes = await fetch('/api/upload/print', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error(t("order.uploadFailed"));
            const uploadData = await uploadRes.json();
            printFileUrl = uploadData.url;
        }

        const items = [{
            variantId: selectedVariant.id,
            quantity: quantity,
            color: selectedVariant.name,
            design: design,
            material: material,
            customPrintUrl: printFileUrl
        }];

        if (isIosCheckout) {
          setIosCheckoutItems(items);
          setLoading(false);
          return;
        }

        // Hängslen & livrem (3.1.1): skulle Stripe-vägen någonsin nås inne i
        // appen får ordern aldrig bära med sig ett digitalt premiumtillägg.
        // "1moIap" är per definition ett StoreKit-köp och skickas aldrig med.
        const safePremiumOption: "none" | "1mo" | "6mo" =
          isApp || premiumOption === "1moIap" ? "none" : premiumOption;
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, premiumOption: safePremiumOption })
        });

        if (response.status === 401) {
          window.location.href = "/login?callbackUrl=" + encodeURIComponent("/order");
          return;
        }
        if(!response.ok) throw new Error("Checkout failed");
        const data = await response.json();
        if (data.url) window.location.href = data.url;

      } catch (error) {
        console.error(error);
        alert(t("order.checkoutError"));
        setLoading(false);
      }
  };

  // --- Calculations ---
  const cardPrice = selectedVariant ? (selectedVariant.price / 100) : 0;
  const compareAt = selectedVariant?.compareAtPrice ? (selectedVariant.compareAtPrice / 100) : null;
  const customPrintCost = (material === "metal" && customImage) ? 100 : 0;

  // Priser för premium-nivåerna kommer från en delad konstant (6 mån) och DB
  // (månadspriset) — inte längre hårdkodade siffror som kunde glida isär
  // mellan klient och Stripe-rad. Jämförpriset för 6-mån härleds alltid som
  // 6 × det verkliga månadspriset (krav enligt svensk prismärkningslag).
  const premiumMonthly = Math.round(premiumMonthlyOre / 100);
  const premium6moPrice = Math.round(PREMIUM_6MO_PRICE_ORE / 100);
  const premium6moCompare = premiumMonthly * 6;

  let premiumCost = 0;
  if (premiumOption === "6mo") {
    premiumCost = premium6moPrice;
  } else if (premiumOption === "1moIap") {
    premiumCost = premiumMonthly;
  }

  const total = selectedVariant ? (((cardPrice + customPrintCost) * quantity) + premiumCost) : premiumCost;
  const activeVariants = material === "plastic" ? standardVariants : metalVariants;

  // Månadsprenumerationen säljs till ordinarie pris — inget jämförpris och
  // därmed ingen "du sparar"-rad för den (prismärkningslagen).
  const premiumValue = premiumOption === "1mo"
    ? premiumMonthly
    : premiumOption === "1moIap"
      ? premiumMonthly
      : (premiumOption === "6mo" ? premium6moCompare : 0);
  const totalOriginalPrice = selectedVariant ? ((compareAt || cardPrice) + customPrintCost + premiumValue) : premiumValue;

  const savings = Math.round(totalOriginalPrice - total);
  const hasSavings = savings > 0 && selectedVariant !== undefined;

  const isCompletelyOutOfStock = !hasStandard && !hasMetal;

  const materialLabel = material === "plastic" ? t("order.standard") : t("order.metal");
  const premiumLabel = premiumOption === "1mo"
    ? t("order.starterPackRow")
    : premiumOption === "1moIap"
      ? t("order.premiumMonthly")
      : premiumOption === "6mo"
        ? t("order.premium6mo")
        : null;

  const goNext = () => {
    if (step === 1) setStep(isPremium ? 3 : 2);
    else if (step === 2) setStep(3);
  };
  const goBack = () => {
    if (step === 3) setStep(isPremium ? 1 : 2);
    else if (step === 2) setStep(1);
  };

  const currentStepIndex = steps.findIndex(s => s.n === step);

  return (
    <div className="min-h-screen bg-slate-950 text-nordic-secondary py-6 lg:py-12 px-4 sm:px-6 lg:px-8 flex items-start lg:items-center justify-center relative overflow-hidden">

      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl w-full relative z-10">

        {/* PROGRESS */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 lg:mb-12">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => { if (i < currentStepIndex) setStep(s.n as 1 | 2 | 3); }}
                className={`flex items-center gap-2 ${i < currentStepIndex ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  s.n === step
                    ? "bg-blue-500 border-blue-500 text-white"
                    : i < currentStepIndex
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      : "bg-white/5 border-white/10 text-nordic-highlight"
                }`}>
                  {i < currentStepIndex ? <Check size={13} strokeWidth={3.5} /> : i + 1}
                </span>
                <span className={`text-xs sm:text-sm font-medium hidden sm:block ${s.n === step ? "text-nordic-secondary" : "text-nordic-highlight"}`}>
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && <div className="w-6 sm:w-12 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

          {/* LEFT (desktop right): PREVIEW */}
          <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col gap-6 lg:sticky lg:top-24">
            {step !== 2 && (
              <div className="flex flex-col items-center justify-center min-h-[320px] lg:min-h-[460px]">
                <CardPreview3D material={material} color={colorCode} design={design} customImage={customImage} />
              </div>
            )}

            {/* Premium preview visas aldrig för användare som redan har premium (ClickUp 86ca6yck3) */}
            {step === 2 && !isPremium && (
               <div className="animate-in slide-in-from-bottom-4 duration-500 bg-[#0A0F1C] border border-blue-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl shadow-blue-900/10">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                      <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Sparkles size={20}/></div>
                      <div>
                        <h3 className="font-bold text-base text-nordic-secondary">
                            {profileData ? t("order.previewTitleOwn") : t("order.previewTitleDemo")}
                        </h3>
                        <p className="text-xs text-nordic-highlight">{t("order.previewSubtitle")}</p>
                      </div>
                  </div>
                  <LiveProfileDemo data={profileData} settings={profileSettings} />
                  {!profileData && (
                    <p className="mt-4 text-center text-xs text-nordic-highlight">
                      {t("order.previewDemoNote")}
                    </p>
                  )}
               </div>
            )}
          </div>

          {/* RIGHT (desktop left): STEP CONTENT */}
          <div className="lg:col-span-5 order-2 lg:order-1 space-y-8 py-2">

            {/* ---------- STEG 1: DESIGNA ---------- */}
            {step === 1 && (
              <>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-nordic-secondary mb-2">{t("order.designTitle")}</h1>
                  <p className="text-nordic-highlight text-sm lg:text-base">{t("order.designSubtitle")}</p>
                </div>

                {/* Material */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-nordic-highlight uppercase tracking-widest ml-1">{t("order.material")}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <button
                      disabled={!hasStandard}
                      onClick={() => selectMaterial("plastic")}
                      className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
                        !hasStandard
                          ? "border-white/5 opacity-50 cursor-not-allowed bg-white/5"
                          : material === "plastic"
                            ? "border-blue-500 bg-blue-500/10 text-nordic-secondary"
                            : "border-white/10 hover:border-white/20 text-nordic-highlight"
                      }`}
                    >
                      <div className="p-2 bg-white/5 rounded-lg"><Layers size={18} /></div>
                      <div className="text-left">
                        <span className="block font-bold text-sm">{t("order.standard")}</span>
                        <span className="text-xs opacity-60">{t("order.standardSub")}</span>
                      </div>
                      <div className="ml-auto text-right">
                          {!hasStandard ? (
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded">Slut</span>
                          ) : (
                              <>
                                {standardDisplay.compareAt && standardDisplay.compareAt > standardDisplay.price && (
                                    <div className="text-[10px] text-nordic-highlight line-through">{price((standardDisplay.compareAt / 100).toFixed(0))}</div>
                                )}
                                <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded block">
                                    {price((standardDisplay.price / 100).toFixed(0))}
                                </span>
                              </>
                          )}
                      </div>
                    </button>

                    <button
                      disabled={!hasMetal}
                      onClick={() => selectMaterial("metal")}
                      className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
                        !hasMetal
                          ? "border-white/5 opacity-50 cursor-not-allowed bg-white/5"
                          : material === "metal"
                            ? "border-blue-500 bg-blue-500/10 text-nordic-secondary"
                            : "border-white/10 hover:border-white/20 text-nordic-highlight"
                      }`}
                    >
                      <div className="p-2 bg-white/5 rounded-lg"><CreditCard size={18} /></div>
                      <div className="text-left">
                        <span className="block font-bold text-sm">{t("order.metal")}</span>
                        {/* Leverantörens spec är metall/PVC med aluminiumantenn — inte stål (ClickUp 86c6qdj6d) */}
                        <span className="text-xs opacity-60">{t("order.metalSub")}</span>
                      </div>
                       <div className="ml-auto text-right">
                          {!hasMetal ? (
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded">Slut</span>
                          ) : (
                              <>
                                {metalDisplay.compareAt && metalDisplay.compareAt > metalDisplay.price && (
                                    <div className="text-[10px] text-nordic-highlight line-through">{price((metalDisplay.compareAt / 100).toFixed(0))}</div>
                                )}
                                <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded block">
                                    {price((metalDisplay.price / 100).toFixed(0))}
                                </span>
                              </>
                          )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Färg */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-nordic-highlight uppercase tracking-widest ml-1">{t("order.color")}</label>
                  {activeVariants.length === 0 ? (
                      <div className="text-sm text-nordic-highlight py-2 ml-1">{t("order.noColors")}</div>
                  ) : (
                      <div className="flex flex-wrap gap-3">
                        {activeVariants.map((variant) => {
                          const isSelected = colorCode === variant.colorCode;
                          const isWhite = variant.colorCode?.toLowerCase() === "#ffffff" || variant.colorCode?.toLowerCase() === "#f5f5f5";
                          return (
                              <button
                                  key={variant.id}
                                  onClick={() => setColorCode(variant.colorCode || "")}
                                  className={`group relative w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${isSelected ? "border-blue-500 scale-110" : "border-transparent"}`}
                                  style={{ backgroundColor: variant.colorCode || "#000" }}
                                  title={variant.name}
                              >
                                  {isWhite && <span className="absolute inset-0 rounded-full border border-black/10"></span>}
                                  {isSelected && <span className="absolute inset-0 flex items-center justify-center text-nordic-secondary"><Check size={16} strokeWidth={4} /></span>}
                              </button>
                          );
                        })}
                      </div>
                  )}
                </div>

                {/* Custom Print (Metal Only) */}
                {material === "metal" && hasMetal && (
                   <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                      <div className="flex justify-between items-center ml-1"><label className="text-xs font-bold text-nordic-highlight uppercase tracking-widest">{t("order.customPrint")}</label><span className="text-[10px] bg-blue-500 text-nordic-secondary px-2 py-0.5 rounded-full">{t("order.popular")}</span></div>
                      {!customImage ? (
                          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl p-6 text-center cursor-pointer transition-all group">
                              <Upload className="mx-auto mb-2 text-nordic-highlight group-hover:text-blue-400" size={20} />
                              <p className="text-sm font-medium text-gray-300">{t("order.uploadLogo")}</p>
                              {/* Tryckytan är PVC-panelen, inte hela kortet (ClickUp 86c6qdj6d) */}
                              <p className="mt-1 text-[11px] text-gray-500">{t("order.printAreaHint")}</p>
                          </div>
                      ) : (
                          <div className="relative rounded-xl overflow-hidden border border-white/20 group h-24 w-full">
                              <Image src={customImage} alt={t("order.uploadAlt")} fill className="object-cover opacity-50" unoptimized />
                              <div className="absolute inset-0 flex items-center justify-center gap-4 z-10">
                                   <button onClick={() => fileInputRef.current?.click()} className="bg-nordic-secondary text-nordic-primary px-3 py-1.5 rounded-lg text-xs font-bold">{t("order.replaceImage")}</button>
                                   <button onClick={clearImage} aria-label={t("order.removeImage")} className="bg-red-500/20 text-red-400 p-1.5 rounded-lg"><X size={16} /></button>
                              </div>
                          </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/>
                   </div>
                )}

                <button
                  onClick={goNext}
                  disabled={isCompletelyOutOfStock}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isCompletelyOutOfStock
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-nordic-secondary text-nordic-primary hover:bg-nordic-support"
                  }`}
                >
                  {isCompletelyOutOfStock ? t("order.noProducts") : t("order.continue")} {!isCompletelyOutOfStock && <ArrowRight size={18} />}
                </button>
              </>
            )}

            {/* ---------- STEG 2: VÄLJ NIVÅ ---------- */}
            {step === 2 && !isPremium && (
              <>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-nordic-secondary mb-2">{t("order.tierTitle")}</h1>
                  <p className="text-nordic-highlight text-sm lg:text-base">{t("order.tierSubtitle")}</p>
                </div>

                <div className="space-y-3">
                    {/* Option 1: Enbart kort */}
                    <div
                        onClick={() => setPremiumOption("none")}
                        className={`relative p-4 rounded-xl border cursor-pointer transition-all ${premiumOption === "none" ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20"}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${premiumOption === "none" ? "border-blue-500 bg-blue-500" : "border-gray-600"}`}>
                                {premiumOption === "none" && <Check size={12} className="text-white" />}
                            </div>
                            <span className="font-medium text-sm">{t("order.cardOnly")}</span>
                            <span className="ml-auto text-sm font-bold text-nordic-highlight">{t("order.plusZero")}</span>
                        </div>
                    </div>

                    {/* Option 2: Startpaket (1 mån gratis) — aldrig i appen (3.1.1) */}
                    {showStarterPack && (
                    <div
                        onClick={() => setPremiumOption("1mo")}
                        className={`relative p-4 rounded-xl border cursor-pointer transition-all ${premiumOption === "1mo" ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20"}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${premiumOption === "1mo" ? "border-blue-500 bg-blue-500" : "border-gray-600"}`}>
                                {premiumOption === "1mo" && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm flex items-center gap-2">
                                    {t("order.starterPack")}
                                    <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full">{t("order.freeBadge")}</span>
                                </span>
                                <span className="text-xs text-nordic-highlight">{t("order.starterPackSub")}</span>
                            </div>
                            <div className="ml-auto text-right">
                                <span className="block font-bold text-sm">{t("order.plusZero")}</span>
                                <span className="text-xs text-nordic-highlight line-through">{price(premiumMonthly)}</span>
                            </div>
                        </div>
                        {/* 3.1.2(c): prenumerationens ordinarie pris ska synas där den erbjuds */}
                        <p className="mt-2 text-[11px] text-nordic-highlight">
                          {t("order.starterPackPriceNote", { price: price(premiumMonthly) })}
                        </p>
                    </div>
                    )}

                    {/* Option 2b: Premium 1 mån — appens motsvarighet till
                        startpaketets månad, men som riktig prenumeration köpt
                        via App Store (3.1.1). Priset står i raden och de fulla
                        villkoren strax under valet (3.1.2c). */}
                    {showMonthlyIap && (
                    <div
                        onClick={() => setPremiumOption("1moIap")}
                        className={`relative p-4 rounded-xl border cursor-pointer transition-all ${premiumOption === "1moIap" ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20"}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${premiumOption === "1moIap" ? "border-blue-500 bg-blue-500" : "border-gray-600"}`}>
                                {premiumOption === "1moIap" && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">{t("order.premiumMonthly")}</span>
                                <span className="text-xs text-nordic-highlight">{t("order.premiumMonthlySub")}</span>
                            </div>
                            <div className="ml-auto text-right">
                                <span className="block font-bold text-sm">
                                  +{t("order.perMonth", { price: price(premiumMonthly) })}
                                </span>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Option 3: Premium 6 mån — i appen endast via IAP (3.1.1) */}
                    {showSixMonths && (
                    <div
                        onClick={() => setPremiumOption("6mo")}
                        className={`relative p-4 rounded-xl border cursor-pointer transition-all ${premiumOption === "6mo" ? "border-green-500 bg-green-500/10" : "border-white/10 hover:border-white/20"}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${premiumOption === "6mo" ? "border-green-500 bg-green-500" : "border-gray-600"}`}>
                                {premiumOption === "6mo" && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm flex items-center gap-2">
                                    {t("order.premium6mo")}
                                    <span className="bg-green-600 text-white text-[9px] px-2 py-0.5 rounded-full">
                                      {t("order.saveBadge", { percent: Math.max(0, Math.round((1 - premium6moPrice / premium6moCompare) * 100)) })}
                                    </span>
                                </span>
                                <span className="text-xs text-nordic-highlight">{t("order.premium6moSub")}</span>
                            </div>
                            <div className="ml-auto text-right">
                                <span className="block font-bold text-sm">+{price(premium6moPrice)}</span>
                                <span className="text-xs text-nordic-highlight line-through">{price(premium6moCompare)}</span>
                            </div>
                        </div>
                    </div>
                    )}
                </div>

                {/* Guideline 3.1.2(c): orderflödet är en egen köppunkt för den
                    auto-förnyande 6-månadersprenumerationen. Villkoren måste därför
                    stå här också, inte bara på premium-sidan — belopp, att den
                    förnyas automatiskt, hur man säger upp och länkar till EULA och
                    integritetspolicy. */}
                {premiumOption === "6mo" && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <SubscriptionTerms price={price(premium6moPrice)} period={t("order.period6mo")} viaAppStore />
                  </div>
                )}

                {premiumOption === "1moIap" && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <SubscriptionTerms price={price(premiumMonthly)} viaAppStore />
                  </div>
                )}

                {premiumOption === "1mo" && (
                  <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                    {t("order.starterPackTerms")}
                  </p>
                )}

                <div className="flex gap-3">
                  <button onClick={goBack} className="py-4 px-5 rounded-xl font-bold border border-white/10 hover:border-white/20 text-nordic-highlight transition-all flex items-center gap-2">
                    <ArrowLeft size={16} /> {t("order.back")}
                  </button>
                  <button onClick={goNext} className="flex-1 py-4 rounded-xl font-bold text-lg bg-nordic-secondary text-nordic-primary hover:bg-nordic-support transition-all shadow-lg flex items-center justify-center gap-2">
                    {t("order.continue")} <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}

            {/* ---------- STEG 3: SAMMANFATTNING ---------- */}
            {step === 3 && (
              <>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-nordic-secondary mb-2">{t("order.summaryTitle")}</h1>
                  <p className="text-nordic-highlight text-sm lg:text-base">{t("order.summarySubtitle")}</p>
                </div>

                {/* Specificerat ordersammandrag */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
                  <SummaryRow
                    t={t}
                    label={t("order.nfcCard", { material: materialLabel })}
                    sub={selectedVariant?.name}
                    price={price(cardPrice.toFixed(0))}
                    compareAt={compareAt && compareAt > cardPrice ? price(compareAt.toFixed(0)) : undefined}
                    onEdit={() => setStep(1)}
                  />
                  {customPrintCost > 0 && (
                    <SummaryRow t={t} label={t("order.customPrintRow")} sub={t("order.customPrintSub")} price={price(customPrintCost)} onEdit={() => setStep(1)} />
                  )}
                  {!isPremium && premiumLabel && (
                    <SummaryRow
                      t={t}
                      label={premiumLabel}
                      sub={
                        premiumOption === "1mo"
                          ? t("order.noAutoRenew")
                          : premiumOption === "1moIap"
                            ? t("order.autoRenewMonthly")
                            : t("order.autoRenew6mo")
                      }
                      price={
                        premiumOption === "6mo"
                          ? price(premium6moPrice)
                          : premiumOption === "1moIap"
                            ? t("order.perMonth", { price: price(premiumMonthly) })
                            : price(0)
                      }
                      compareAt={
                        premiumOption === "1mo"
                          ? price(premiumMonthly)
                          : premiumOption === "6mo"
                            ? price(premium6moCompare)
                            : undefined
                      }
                      onEdit={() => setStep(2)}
                    />
                  )}
                  <div className="flex items-center justify-between p-4">
                    <span className="text-sm font-medium text-nordic-highlight">{t("order.total")}</span>
                    <div className="text-right">
                        {hasSavings && (
                             <span className="text-sm text-nordic-highlight line-through mr-2">
                                {price(totalOriginalPrice)}
                             </span>
                        )}
                        <span className="text-3xl font-bold tracking-tight">{price(total)}</span>
                    </div>
                  </div>
                </div>

                {hasSavings && (
                   <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-center text-sm font-bold">
                       {t("order.savings", { amount: savings })}
                   </div>
                )}

                {/* Prenumerationsvillkor även i sammanfattningen (Guideline 3.1.2c) */}
                {premiumOption === "6mo" && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <SubscriptionTerms price={price(premium6moPrice)} period={t("order.period6mo")} viaAppStore />
                  </div>
                )}

                {premiumOption === "1moIap" && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <SubscriptionTerms price={price(premiumMonthly)} viaAppStore />
                  </div>
                )}

                <div className="space-y-4">
                   <div className="flex gap-3">
                     <button onClick={goBack} className="py-4 px-5 rounded-xl font-bold border border-white/10 hover:border-white/20 text-nordic-highlight transition-all flex items-center gap-2">
                       <ArrowLeft size={16} /> {t("order.back")}
                     </button>
                     <button
                        onClick={handleCheckout}
                        disabled={loading || isCompletelyOutOfStock || Boolean(iosCheckoutItems)}
                        className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                            isCompletelyOutOfStock
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-nordic-secondary text-nordic-primary hover:bg-nordic-support"
                        }`}
                     >
                        {loading ? <Loader2 className="animate-spin" /> : (
                          isCompletelyOutOfStock ? t("order.noProducts")
                            : !isLoggedIn ? t("order.loginAndCheckout")
                            : (isIosCheckout ? t("order.continueToPayment") : t("order.goToCheckout"))
                        )}
                     </button>
                   </div>

                   {iosCheckoutItems && (
                     <IosOrderCheckout
                       items={iosCheckoutItems}
                       premiumOption={premiumOption}
                       isPremium={isPremium}
                     />
                   )}
                   {/* Köpvillkor (ClickUp 86ca6yfmy) */}
                   <p className="text-center text-xs text-gray-500">
                      {t("order.legalBefore")}{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300 transition-colors">{t("order.legalTerms")}</a>
                      {" "}{t("order.legalAnd")}{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300 transition-colors">{t("order.legalPrivacy")}</a>.
                   </p>
                   <p className="text-center text-xs text-gray-600">{t("order.shippingNote")}</p>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, sub, price, compareAt, onEdit, t }: {
  label: string;
  sub?: string | null;
  price: string;
  compareAt?: string;
  onEdit?: () => void;
  t: Translator;
}) {
  return (
    <div className="flex items-center justify-between p-4 gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-nordic-secondary truncate">{label}</p>
        {sub && <p className="text-xs text-nordic-highlight truncate">{sub}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          {compareAt && <span className="block text-[11px] text-nordic-highlight line-through">{compareAt}</span>}
          <span className="text-sm font-bold">{price}</span>
        </div>
        {onEdit && (
          <button onClick={onEdit} aria-label={t("order.editAria", { label })} className="p-1.5 rounded-lg text-nordic-highlight hover:text-nordic-secondary hover:bg-white/5 transition-colors">
            <Pencil size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
