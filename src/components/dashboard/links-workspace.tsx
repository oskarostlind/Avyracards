"use client";

import { useCallback, useEffect, useState } from "react";
import { AddLinkForm } from "@/components/dashboard/add-link-form";
import { LinksList, LinkItem, LinkEditPatch } from "@/components/links-list";
import { UpgradeModal } from "@/components/themes/upgrade-modal";
import { canAccess } from "@/lib/feature-access";
import { useRouter } from "next/navigation";

interface LinksWorkspaceProps {
  initialLinks: LinkItem[];
  mode: "SOCIAL" | "BUSINESS";
  activeRedirectId?: string | null;
  /** Behövs för att veta om per-länk-färg ska vara upplåst. */
  isPremium?: boolean;
  isAdmin?: boolean;
}

export function LinksWorkspace({
  initialLinks,
  mode,
  activeRedirectId: initialRedirectId,
  isPremium = false,
  isAdmin = false,
}: LinksWorkspaceProps) {
  const [links, setLinks] = useState(initialLinks);
  const [activeRedirectId, setActiveRedirectId] = useState<string | null>(initialRedirectId ?? null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const router = useRouter();

  // Samma källa som /api/links använder vid sparning. Ett UI-lås som glöms
  // bort får inte bli en datalucka — se sanitizeLinkCustomization.
  const canCustomizeColor = canAccess("link_custom_color", { isPremium, isAdmin });

  useEffect(() => {
    setLinks(initialLinks);
    // Uppdatera redirect-ID när vi byter läge, så vi inte visar fel "aktiv" länk
    setActiveRedirectId(initialRedirectId ?? null);
  }, [initialLinks, initialRedirectId, mode]);

  const refresh = useCallback(async () => {
    // VIKTIGT: Skicka med mode till API:et så vi bara får länkar för detta läge
    const response = await fetch(`/api/links?mode=${mode}`);
    if (!response.ok) return;
    const data = (await response.json()) as LinkItem[];
    setLinks(data);
    router.refresh();
  }, [mode, router]);

  const handleCreated = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleSetRedirect = useCallback(async (linkId: string) => {
    const isActivating = linkId !== activeRedirectId;
    const newId = isActivating ? linkId : null;

    setActiveRedirectId(newId);

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            redirectLinkId: newId,
            redirectEnabled: isActivating
        }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to set redirect", error);
      setActiveRedirectId(activeRedirectId);
    }
  }, [activeRedirectId, router]);

  const handleEdit = useCallback(async (id: string, patch: LinkEditPatch) => {
    try {
      // OBS: fältet heter `label` i API:t. Tidigare skickades `title`, vilket
      // zod-schemat strippade tyst — titeländringar sparades aldrig.
      const response = await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: patch.label,
          url: patch.url,
          icon: patch.icon,
          customColor: patch.customColor,
        }),
      });

      // Servern tvättade bort en premium-funktion -> visa uppgraderingen i
      // stället för att låta ändringen försvinna tyst.
      if (response.ok) {
        const json = await response.json().catch(() => null);
        if (json?.sanitized) setShowUpgrade(true);
      }

      await refresh();
    } catch (error) {
      console.error("Failed to edit link", error);
    }
  }, [refresh]);

  const handleReorder = useCallback(
    async (ids: string[]) => {
      // Optimistisk uppdatering
      const reorderedLinks = ids.map(id => links.find(l => l.id === id)!).filter(Boolean);
      setLinks(reorderedLinks);

      await fetch("/api/links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: ids }),
      });
    },
    [links]
  );

  const handleToggleVisibility = useCallback(
    async (id: string, next: boolean) => {
      setLinks(prev => prev.map(l => l.id === id ? { ...l, isVisible: next } : l));

      await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: next }),
      });
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setLinks(prev => prev.filter(l => l.id !== id));
      if (activeRedirectId === id) setActiveRedirectId(null);

      await fetch(`/api/links/${id}`, { method: "DELETE" });
      await refresh();
    },
    [activeRedirectId, refresh]
  );

  return (
    <div className="space-y-6">
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* Skicka vidare 'mode' till formuläret så nya länkar får rätt tagg */}
      <AddLinkForm onCreated={handleCreated} mode={mode} />

      <LinksList
        links={links}
        activeRedirectId={activeRedirectId}
        onReorder={handleReorder}
        onToggleVisibility={handleToggleVisibility}
        onDelete={handleDelete}
        onSetRedirect={handleSetRedirect}
        onEdit={handleEdit}
        canCustomizeColor={canCustomizeColor}
        onShowUpgrade={() => setShowUpgrade(true)}
      />
    </div>
  );
}
