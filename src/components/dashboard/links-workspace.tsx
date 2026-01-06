"use client";

import { useCallback, useEffect, useState } from "react";
import { AddLinkForm } from "@/components/dashboard/add-link-form";
import { LinksList, LinkItem } from "@/components/links-list";

interface LinksWorkspaceProps {
  initialLinks: LinkItem[];
  // NYTT: Tar emot mode för att veta vad som ska hämtas/skapas
  mode: "SOCIAL" | "BUSINESS";
}

export function LinksWorkspace({ initialLinks, mode }: LinksWorkspaceProps) {
  const [links, setLinks] = useState(initialLinks);

  // Nollställ listan om vi byter flik (mode) eller om initialLinks ändras
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks, mode]);

  const refresh = useCallback(async () => {
    // NYTT: Lägger till ?mode=... i URL:en
    const response = await fetch(`/api/links?mode=${mode}`);
    if (!response.ok) {
      return;
    }
    
    // API:et returnerar en array direkt (enligt min tidigare kod), inte { links: [] }
    const data = (await response.json()) as LinkItem[];
    setLinks(data);
  }, [mode]);

  const handleCreated = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleReorder = useCallback(
    async (ids: string[]) => {
      await fetch("/api/links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: ids }),
      });
      // Inget refresh behövs här om UI:t uppdateras optimistiskt i LinksList, 
      // men för säkerhets skull kan vi köra det.
      await refresh();
    },
    [refresh]
  );

  const handleToggleVisibility = useCallback(
    async (id: string, next: boolean) => {
      await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: next }),
      });
      await refresh();
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await fetch(`/api/links/${id}`, { method: "DELETE" });
      await refresh();
    },
    [refresh]
  );

  return (
    <div className="space-y-6">
      {/* Skickar med mode till formuläret */}
      <AddLinkForm onCreated={handleCreated} mode={mode} />
      
      <LinksList
        links={links}
        onReorder={handleReorder}
        onToggleVisibility={handleToggleVisibility}
        onDelete={handleDelete}
      />
    </div>
  );
}