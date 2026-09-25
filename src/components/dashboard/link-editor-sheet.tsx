"use client";

import { useEffect, useId, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Trash2, Zap } from "lucide-react";
import { useT } from "@/i18n/client";
import { ModalSheet } from "@/components/dashboard/modal-sheet";
import { LinkIconPicker } from "@/components/dashboard/link-icon-picker";
import { LinkColorPicker } from "@/components/dashboard/link-color-picker";
import { ToggleRow } from "@/components/themes/theme-controls";
import { normalizeLinkUrl } from "@/utils/normalize-url";
import type { LinkEditPatch, LinkItem } from "@/components/links-list";

interface LinkEditorSheetProps {
  open: boolean;
  /** null = ny länk */
  link: LinkItem | null;
  mode: "SOCIAL" | "BUSINESS";
  isRedirect: boolean;
  canCustomizeColor: boolean;
  onShowUpgrade: () => void;
  onClose: () => void;
  /** Returnerar ett felmeddelande, eller null om det gick bra. */
  onCreate: (data: { label: string; url: string }) => Promise<string | null>;
  onSave: (id: string, patch: LinkEditPatch) => Promise<string | null>;
  onDelete: (id: string) => void;
  onToggleRedirect: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const inputClass =
  "w-full rounded-xl border bg-slate-900 px-3.5 py-3 text-base text-nordic-secondary placeholder:text-slate-500 outline-none transition-colors focus:border-purple-500";

export function LinkEditorSheet({
  open,
  link,
  mode,
  isRedirect,
  canCustomizeColor,
  onShowUpgrade,
  onClose,
  onCreate,
  onSave,
  onDelete,
  onToggleRedirect,
  onMove,
  canMoveUp,
  canMoveDown,
}: LinkEditorSheetProps) {
  const t = useT();
  const titleId = useId();
  const urlId = useId();
  const isNew = link === null;

  const [form, setForm] = useState<LinkEditPatch>({ label: "", url: "", icon: null, customColor: null });
  const [titleError, setTitleError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fyll formuläret varje gång arket öppnas.
  useEffect(() => {
    if (!open) return;
    setForm({
      label: link?.label ?? "",
      url: link?.url ?? "",
      icon: link?.icon ?? null,
      customColor: link?.customColor ?? null,
    });
    setTitleError(null);
    setUrlError(null);
    setFormError(null);
    setSaving(false);
  }, [open, link]);

  const submit = async () => {
    const label = form.label.trim();
    let ok = true;
    // Samma gränser som API:t (1–60). Tidigare föll en tom/för lång titel
    // tyst på servern och ändringen hoppade tillbaka.
    if (!label || label.length > 60) {
      setTitleError(t("dashboard.links.titleInvalid"));
      ok = false;
    }
    const normalized = normalizeLinkUrl(form.url);
    if (!normalized.ok) {
      setUrlError(t("links.invalidUrl"));
      ok = false;
    }
    if (!ok || !normalized.ok) return;

    setSaving(true);
    setFormError(null);
    const error = isNew
      ? await onCreate({ label, url: normalized.url })
      : await onSave(link.id, { ...form, label, url: normalized.url });
    setSaving(false);
    if (error) setFormError(error);
    else onClose();
  };

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="h-12 flex-1 rounded-2xl bg-white/[0.07] text-[15px] font-semibold text-slate-300 active:scale-[0.98]"
      >
        {t("common.cancel")}
      </button>
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="h-12 flex-[2] rounded-2xl bg-purple-600 text-[15px] font-semibold text-white shadow-lg shadow-purple-500/25 active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? t("common.saving") : isNew ? t("links.add") : t("common.save")}
      </button>
    </div>
  );

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title={isNew ? t("dashboard.links.newTitle") : t("links.editLink")}
      closeLabel={t("common.close")}
      footer={footer}
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor={titleId} className="text-[13px] font-semibold text-slate-300">
            {t("links.title")}
          </label>
          <input
            id={titleId}
            value={form.label}
            maxLength={60}
            onChange={(e) => {
              setForm((p) => ({ ...p, label: e.target.value }));
              if (titleError) setTitleError(null);
            }}
            placeholder={mode === "BUSINESS" ? t("links.placeholderBusiness") : t("links.placeholderSocial")}
            aria-invalid={Boolean(titleError)}
            className={`${inputClass} ${titleError ? "border-rose-500/70" : "border-white/10"}`}
          />
          {titleError && <p className="text-[13px] text-rose-400">{titleError}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={urlId} className="text-[13px] font-semibold text-slate-300">
            {t("links.url")}
          </label>
          {/* type="text": webbläsarens url-validering kräver protokoll och blockerar "dinsida.se". */}
          <input
            id={urlId}
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={form.url}
            onChange={(e) => {
              setForm((p) => ({ ...p, url: e.target.value }));
              if (urlError) setUrlError(null);
            }}
            placeholder={t("links.urlPlaceholder")}
            aria-invalid={Boolean(urlError)}
            className={`${inputClass} ${urlError ? "border-rose-500/70" : "border-white/10"}`}
          />
          <p className={`text-[13px] ${urlError ? "text-rose-400" : "text-slate-500"}`}>{urlError ?? t("links.urlHint")}</p>
        </div>

        {formError && (
          <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {formError}
          </p>
        )}

        {!isNew && (
          <>
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-slate-300">{t("links.icon")}</p>
              <LinkIconPicker value={form.icon} onChange={(icon) => setForm((p) => ({ ...p, icon }))} url={form.url} title={form.label} />
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-slate-300">{t("links.color")}</p>
              <LinkColorPicker
                value={form.customColor}
                onChange={(customColor) => setForm((p) => ({ ...p, customColor }))}
                locked={!canCustomizeColor}
                onShowUpgrade={onShowUpgrade}
                url={form.url}
                title={form.label}
                icon={form.icon}
              />
            </div>

            <div className="space-y-2 border-t border-white/10 pt-5">
              <ToggleRow
                label={t("dashboard.links.redirectLabel")}
                description={t("dashboard.links.redirectDesc")}
                checked={isRedirect}
                onChange={() => onToggleRedirect(link.id)}
                badge={<Zap size={14} className="text-amber-400" />}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onMove(link.id, -1)}
                  disabled={!canMoveUp}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/50 text-sm font-semibold text-slate-300 disabled:opacity-40"
                >
                  <ArrowUp size={16} /> {t("dashboard.links.moveUp")}
                </button>
                <button
                  type="button"
                  onClick={() => onMove(link.id, 1)}
                  disabled={!canMoveDown}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/50 text-sm font-semibold text-slate-300 disabled:opacity-40"
                >
                  <ArrowDown size={16} /> {t("dashboard.links.moveDown")}
                </button>
              </div>

              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/50 text-sm font-semibold text-slate-300"
              >
                <ExternalLink size={16} /> {t("dashboard.links.openLink")}
              </a>

              <button
                type="button"
                onClick={() => onDelete(link.id)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-rose-400 active:bg-rose-500/10"
              >
                <Trash2 size={16} /> {t("dashboard.links.deleteLink")}
              </button>
            </div>
          </>
        )}
        {/* Enter i ett fält sparar. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </ModalSheet>
  );
}
