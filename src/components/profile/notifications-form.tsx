"use client";

import { useState } from "react";
import { Save, Bell } from "lucide-react";
import { useT } from "@/i18n/client";

interface NotificationsFormProps {
  notifyOnProfileView: boolean;
  notifyOnLinkClick: boolean;
  notifyOnContactSave: boolean;
}

function ToggleItem({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="font-medium text-slate-200 text-sm">{label}</div>
        <div className="text-xs text-nordic-highlight mt-1 leading-relaxed max-w-sm">
          {description}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          checked ? "bg-purple-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationsForm({
  notifyOnProfileView: initialProfileView,
  notifyOnLinkClick: initialLinkClick,
  notifyOnContactSave: initialContactSave,
}: NotificationsFormProps) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [notifyOnProfileView, setNotifyOnProfileView] = useState(initialProfileView);
  const [notifyOnLinkClick, setNotifyOnLinkClick] = useState(initialLinkClick);
  const [notifyOnContactSave, setNotifyOnContactSave] = useState(initialContactSave);

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyOnProfileView,
          notifyOnLinkClick,
          notifyOnContactSave,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("settings.account.saveFailed"));
      }
      setStatus({ type: "success", msg: t("settings.account.saved") });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err instanceof Error ? err.message : t("settings.account.saveFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {status && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${
            status.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {status.type === "success" ? "✅" : "⚠️"} {status.msg}
        </div>
      )}

      <section className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6 space-y-6">
        <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
          <Bell size={18} className="text-nordic-highlight" /> {t("settings.notifications.pushTitle")}
        </h3>
        <p className="text-sm text-nordic-highlight">
          {t("settings.notifications.pushIntro")}
        </p>
        <div className="space-y-4 pt-2">
          <ToggleItem
            label={t("settings.notifications.profileView")}
            description={t("settings.notifications.profileViewDesc")}
            checked={notifyOnProfileView}
            onChange={setNotifyOnProfileView}
          />
          <div className="h-px bg-slate-800" />
          <ToggleItem
            label={t("settings.notifications.linkClick")}
            description={t("settings.notifications.linkClickDesc")}
            checked={notifyOnLinkClick}
            onChange={setNotifyOnLinkClick}
          />
          <div className="h-px bg-slate-800" />
          <ToggleItem
            label={t("settings.notifications.contactSave")}
            description={t("settings.notifications.contactSaveDesc")}
            checked={notifyOnContactSave}
            onChange={setNotifyOnContactSave}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Save size={16} />
          )}
          {t("common.save")}
        </button>
      </section>
    </div>
  );
}
