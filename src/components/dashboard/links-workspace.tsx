"use client";

import { useCallback, useEffect, useState } from "react";

import { AddLinkForm } from "@/components/dashboard/add-link-form";
import { LinksList, LinkItem } from "@/components/links-list";

interface LinksWorkspaceProps {
  initialLinks: LinkItem[];
}

export function LinksWorkspace({ initialLinks }: LinksWorkspaceProps) {
  const [links, setLinks] = useState(initialLinks);

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/links");
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { links: LinkItem[] };
    setLinks(data.links);
  }, []);

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
      <AddLinkForm onCreated={handleCreated} />
      <LinksList
        links={links}
        onReorder={handleReorder}
        onToggleVisibility={handleToggleVisibility}
        onDelete={handleDelete}
      />
    </div>
  );
}
