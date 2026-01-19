"use client";

import { useCallback, useEffect, useState } from "react";
import { AddLinkForm } from "@/components/dashboard/add-link-form";
import { LinksList, LinkItem } from "@/components/links-list";
import { useRouter } from "next/navigation"; 

interface LinksWorkspaceProps {
  initialLinks: LinkItem[];
  mode: "SOCIAL" | "BUSINESS";
  activeRedirectId?: string | null;
}

export function LinksWorkspace({ initialLinks, mode, activeRedirectId: initialRedirectId }: LinksWorkspaceProps) {
  const [links, setLinks] = useState(initialLinks);
  const [activeRedirectId, setActiveRedirectId] = useState<string | null>(initialRedirectId ?? null);
  const router = useRouter();

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

  const handleEdit = useCallback(async (id: string, title: string, url: string) => {
    try {
      await fetch(`/api/links/${id}`, {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url }),
      });
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
      />
    </div>
  );
}