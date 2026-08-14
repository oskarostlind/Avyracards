"use client";

import { HTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";
import { 
  GripVertical, 
  Trash2, 
  Eye, 
  EyeOff, 
  Zap, 
  Pencil, 
  Check, 
  X,
  ExternalLink
} from "lucide-react";
import { useT } from "@/i18n/client";
//import { cn } from "@/lib/utils"; // Eller din utility för klassnamn om du har en, annars ta bort cn()

// Om du inte har en cn-funktion, använd denna enkla ersättare eller ta bort den:
// function cn(...classes: (string | undefined | null | false)[]) { return classes.filter(Boolean).join(" "); }

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  isVisible: boolean;
}

interface LinksListProps {
  links: LinkItem[];
  activeRedirectId: string | null;
  onReorder: (ids: string[]) => Promise<void> | void;
  onToggleVisibility: (id: string, next: boolean) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onSetRedirect: (id: string) => Promise<void> | void;
  onEdit: (id: string, title: string, url: string) => Promise<void> | void;
}

export function LinksList({ 
  links, 
  activeRedirectId,
  onReorder, 
  onToggleVisibility, 
  onDelete,
  onSetRedirect,
  onEdit
}: LinksListProps) {
  const [items, setItems] = useState(links);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(links);
  }, [links]);

  // --- Drag & Drop Logic ---
  const handleDrop = useCallback(
    async (targetId: string) => {
      if (!draggingId || draggingId === targetId) {
        setDraggingId(null);
        return;
      }
      const sourceIndex = items.findIndex((item) => item.id === draggingId);
      const targetIndex = items.findIndex((item) => item.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        setDraggingId(null);
        return;
      }
      const updated = [...items];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      setItems(updated);
      setDraggingId(null);
      await onReorder(updated.map((item) => item.id));
    },
    [draggingId, items, onReorder]
  );

  const dragPropsMap = useMemo(() => {
    return items.reduce<Record<string, HTMLAttributes<HTMLDivElement>>>((acc, item) => {
      acc[item.id] = {
        draggable: true,
        onDragStart: () => setDraggingId(item.id),
        onDragOver: (e) => { e.preventDefault(); },
        onDrop: async (e) => { e.preventDefault(); await handleDrop(item.id); },
        onDragEnd: () => setDraggingId(null),
      };
      return acc;
    }, {});
  }, [items, handleDrop]);

  return (
    <div className="space-y-3">
      {items.map((link) => (
        <SortableLinkCard 
          key={link.id}
          link={link}
          isRedirect={activeRedirectId === link.id}
          dragProps={dragPropsMap[link.id]}
          isDragging={draggingId === link.id}
          onToggleVisibility={onToggleVisibility}
          onDelete={onDelete}
          onSetRedirect={onSetRedirect}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

// --- Intern komponent för varje kort (Inkluderar Edit & UI logic) ---

interface SortableLinkCardProps {
  link: LinkItem;
  isRedirect: boolean;
  dragProps: HTMLAttributes<HTMLDivElement>;
  isDragging: boolean;
  onToggleVisibility: (id: string, next: boolean) => void;
  onDelete: (id: string) => void;
  onSetRedirect: (id: string) => void;
  onEdit: (id: string, title: string, url: string) => Promise<void> | void;
}

function SortableLinkCard({ 
  link, 
  isRedirect, 
  dragProps, 
  isDragging,
  onToggleVisibility,
  onDelete,
  onSetRedirect,
  onEdit
}: SortableLinkCardProps) {
  const t = useT();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ label: link.label, url: link.url });
  const [isSaving, setIsSaving] = useState(false);

  // Synka local state om props ändras utifrån
  useEffect(() => {
    if (!isEditing) {
      setEditForm({ label: link.label, url: link.url });
    }
  }, [link, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    await onEdit(link.id, editForm.label, editForm.url);
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div
      {...dragProps}
      className={`
        group relative flex flex-col gap-3 rounded-2xl border bg-slate-900/40 p-4 transition-all
        ${isDragging ? "opacity-50 ring-2 ring-purple-500/50" : "hover:border-nordic-highlight/60"}
        ${isRedirect ? "border-amber-400/50 ring-1 ring-amber-400/20 bg-amber-900/10" : "border-nordic-highlight/30"}
        ${!link.isVisible && !isDragging ? "opacity-60 grayscale" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button className="mt-1 cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing">
          <GripVertical size={20} />
        </button>

        {/* Content Area */}
        <div className="min-w-0 flex-1 space-y-1">
          {isEditing ? (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{t("links.titleShort")}</label>
                <input 
                  value={editForm.label}
                  onChange={(e) => setEditForm(prev => ({...prev, label: e.target.value}))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{t("links.url")}</label>
                <input 
                  value={editForm.url}
                  onChange={(e) => setEditForm(prev => ({...prev, url: e.target.value}))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-colors"
                >
                  <Check size={14} /> {isSaving ? t("common.saving") : t("common.save")}
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors"
                >
                  <X size={14} /> {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : (
            // Visningsläge
            <>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-nordic-secondary truncate">
                  {link.label}
                </h3>
                {isRedirect && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                    <Zap size={10} fill="currentColor" /> {t("links.redirectBadge")}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-nordic-highlight">
                {/* TRUNCATE: Här klipper vi av URL:en */}
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="truncate max-w-[200px] sm:max-w-[300px] hover:text-emerald-400 hover:underline decoration-emerald-500/30 underline-offset-2 transition-colors"
                  title={link.url} // Hover visar hela URLen
                >
                  {link.url}
                </a>
                <ExternalLink size={10} className="opacity-50" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Bar (Only visible when not editing) */}
      {!isEditing && (
        <div className="flex items-center justify-between border-t border-slate-800/50 pt-3 mt-1">
          <div className="flex items-center gap-2">
            {/* Redirect Toggle */}
            <button
              onClick={() => onSetRedirect(link.id)}
              className={`p-2 rounded-lg transition-all ${
                isRedirect 
                  ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20" 
                  : "text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
              }`}
              title={isRedirect ? t("links.redirectOff") : t("links.redirectOn")}
            >
              <Zap size={16} fill={isRedirect ? "currentColor" : "none"} />
            </button>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-500 hover:text-nordic-accent hover:bg-nordic-accent/10 rounded-lg transition-colors"
              title={t("links.editLink")}
            >
              <Pencil size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Visibility Toggle */}
            <button
              onClick={() => onToggleVisibility(link.id, !link.isVisible)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                link.isVisible
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-800/50 text-slate-500 hover:bg-slate-800"
              }`}
            >
              {link.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="hidden sm:inline">{link.isVisible ? t("links.visible") : t("links.hidden")}</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(link.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">{t("common.delete")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}