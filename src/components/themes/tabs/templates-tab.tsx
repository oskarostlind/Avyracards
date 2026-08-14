"use client";

import { ThemeTemplate, ThemeMode } from "@/types/theme";
import { PremiumBadge } from "@/components/themes/theme-controls";
import { getTemplates, isTemplateLocked } from "@/lib/feature-access";
import { useT } from "@/i18n/client";

interface TemplatesTabProps {
  isPremium: boolean;
  isAdmin?: boolean;
  onApply: (template: ThemeTemplate) => void;
  onShowUpgrade: () => void;
  mode: ThemeMode;
}

export function TemplatesTab({ isPremium, isAdmin, onApply, onShowUpgrade, mode }: TemplatesTabProps) {
  // Heter `tr` här: den lokala loop-variabeln `t` är en ThemeTemplate.
  const tr = useT();

  const templates = getTemplates(mode);
  const accessUser = { isPremium, isAdmin };

  const getPreviewData = (t: ThemeTemplate) => {
    const s = t.settings;

    if (s.backgroundType === 'image' && s.backgroundImage) {
        return {
            className: "bg-cover bg-center",
            style: { backgroundImage: `url(${s.backgroundImage})` }
        };
    }

    if (s.backgroundType === 'gradient') {
        return {
            className: "",
            style: { 
                background: `linear-gradient(${s.gradientDir || 'to bottom right'}, ${s.gradientFrom || '#000'}, ${s.gradientTo || '#000'})`
            }
        };
    }

    switch (t.id) {
        case 'minimal-white': return { className: 'bg-white border border-slate-200', style: {} };
        case 'minimal-dark': return { className: 'bg-[#020617]', style: {} };
        case 'cocoa': return { className: 'bg-[#451a03]', style: {} };
        case 'lavender': return { className: 'bg-[#f5f3ff] border border-violet-100', style: {} };
        case 'stone': return { className: 'bg-[#e7e5e4]', style: {} };
        case 'tech-basic': return { className: 'bg-[#2563eb]', style: {} };
        case 'cyberpunk': return { className: 'bg-[#050505] border-t-2 border-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.3)]', style: {} };
        case 'bottega': return { className: 'bg-[#064e3b]', style: {} };
        
        case 'biz-trust-blue': return { className: '', style: { background: 'linear-gradient(to bottom right, #0f172a, #1e3a8a)' } };
        case 'biz-growth': return { className: 'bg-[#064e3b]', style: {} };
        case 'biz-modern-tech': return { className: 'bg-[#18181b]', style: {} };
        case 'biz-authority': return { className: '', style: { background: 'linear-gradient(to bottom, #450a0a, #7f1d1d)' } };
        case 'biz-studio': return { className: 'bg-[#e7e5e4]', style: {} };
        case 'biz-creative-flow': return { className: '', style: { background: 'linear-gradient(to bottom right, #4a044e, #2e1065)' } };
        case 'biz-clinic': return { className: 'bg-[#f0f9ff]', style: {} };
        case 'biz-noir': return { className: 'bg-black border border-amber-500/30', style: {} };

        case 'biz-nyc': return { className: 'bg-cover bg-center', style: { backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300)' } };
        case 'biz-nordic-office': return { className: 'bg-cover bg-center', style: { backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=300)' } };
        case 'biz-innovator': return { className: 'bg-cover bg-center', style: { backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300)' } };
        case 'biz-marble': return { className: 'bg-cover bg-center', style: { backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300)' } };
        case 'biz-workspace': return { className: 'bg-cover bg-center', style: { backgroundImage: 'url(https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?q=80&w=300)' } };
        case 'biz-concrete': return { className: 'bg-cover bg-center', style: { backgroundImage: 'url(https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=300)' } };

        default: return { className: 'bg-slate-800', style: {} };
    }
  };

  const getTextColor = (id: string) => {
    const lightThemes = [
        'minimal-white', 
        'lavender', 
        'stone', 
        'biz-studio', 
        'biz-clinic',
        'biz-paper' 
    ];
    return lightThemes.includes(id) ? 'text-slate-900' : 'text-white';
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-nordic-highlight uppercase tracking-wider">
            {mode === "BUSINESS" ? tr("themes.upgrade.templatesTitleBusiness") : tr("themes.upgrade.templatesTitleSocial")}
          </h3>
          <span className="text-[10px] text-slate-500">{tr("themes.upgrade.templatesCount", { count: templates.length })}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {templates.map((t) => {
          const preview = getPreviewData(t);
          const locked = isTemplateLocked(t, accessUser);

          return (
            <button
              key={t.id}
              onClick={() => (locked ? onShowUpgrade() : onApply(t))}
              aria-disabled={locked}
              title={locked ? tr("themes.templateLocked") : t.name}
              className={`group relative aspect-video rounded-xl border border-nordic-highlight/40 bg-slate-900 overflow-hidden transition-all text-left p-3 flex flex-col justify-end shadow-sm ${
                locked ? "hover:border-amber-500 cursor-not-allowed" : "hover:border-purple-500"
              }`}
            >
              <div
                className={`absolute inset-0 opacity-80 transition-opacity group-hover:opacity-100 ${preview.className}`}
                style={preview.style}
              />

              {/* Låst mall: dämpa förhandsvisningen så det syns att den inte går att välja */}
              {locked && <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] z-[5]" />}

              <div className="relative z-10 flex items-center justify-between w-full">
                  <span className={`text-xs font-bold drop-shadow-md ${locked ? "text-white/80" : getTextColor(t.id)}`}>
                      {t.name}
                  </span>
              </div>

              {/* Flyttad Badge så att dess absolu-position kan fästa direkt i parent-button */}
              {t.isPremium && <PremiumBadge isUnlocked={!locked} />}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-nordic-highlight text-center mt-2">
        {mode === "BUSINESS" ? tr("themes.templatesIntroBusiness") : tr("themes.templatesIntroSocial")}
      </p>
    </div>
  );
}