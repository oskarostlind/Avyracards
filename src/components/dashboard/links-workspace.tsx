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
    const previousId = activeRedirectId;
    
    setActiveRedirectId(newId);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            redirectLinkId: newId,
            redirectEnabled: isActivating 
        }),
      });
      if (!response.ok) {
        setActiveRedirectId(previousId);
        return;
      }
      router.refresh(); 
    } catch (error) {
      console.error("Failed to set redirect", error);
      setActiveRedirectId(previousId);
    }
  }, [activeRedirectId, router]);

  const handleEdit = useCallback(async (id: string, title: string, url: string) => {
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: title, url }),
      });
      if (!response.ok) return;
      await refresh();
    } catch (error) {
      console.error("Failed to edit link", error);
    }
  }, [refresh]);

  const handleReorder = useCallback(
    async (ids: string[]) => {
      const previousLinks = links;
      const reorderedLinks = ids.map(id => links.find(l => l.id === id)!).filter(Boolean);
      setLinks(reorderedLinks);

      try {
        const response = await fetch("/api/links/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: ids }),
        });
        if (!response.ok) setLinks(previousLinks);
      } catch (error) {
        console.error("Failed to reorder links", error);
        setLinks(previousLinks);
      }
    },
    [links]
  );

  const handleToggleVisibility = useCallback(
    async (id: string, next: boolean) => {
      setLinks(prev => prev.map(l => l.id === id ? { ...l, isVisible: next } : l));
      
      try {
        const response = await fetch(`/api/links/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVisible: next }),
        });
        if (!response.ok) {
          setLinks(prev => prev.map(l => l.id === id ? { ...l, isVisible: !next } : l));
        }
      } catch (error) {
        console.error("Failed to toggle link visibility", error);
        setLinks(prev => prev.map(l => l.id === id ? { ...l, isVisible: !next } : l));
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const previousLinks = links;
      const previousRedirectId = activeRedirectId;
      setLinks(prev => prev.filter(l => l.id !== id));
      if (activeRedirectId === id) setActiveRedirectId(null);

      try {
        const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
        if (!response.ok) {
          setLinks(previousLinks);
          setActiveRedirectId(previousRedirectId);
          return;
        }
        await refresh();
      } catch (error) {
        console.error("Failed to delete link", error);
        setLinks(previousLinks);
        setActiveRedirectId(previousRedirectId);
      }
    },
    [activeRedirectId, links, refresh]
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