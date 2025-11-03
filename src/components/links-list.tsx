"use client";

import { HTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";

import { LinkCard } from "@/components/link-card";

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  isVisible: boolean;
}

interface LinksListProps {
  links: LinkItem[];
  onReorder: (ids: string[]) => Promise<void> | void;
  onToggleVisibility: (id: string, next: boolean) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export function LinksList({ links, onReorder, onToggleVisibility, onDelete }: LinksListProps) {
  const [items, setItems] = useState(links);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(links);
  }, [links]);

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
        onDragOver: (event) => {
          event.preventDefault();
          if (draggingId && draggingId !== item.id) {
            event.currentTarget.classList.add("ring-2", "ring-slate-300");
          }
        },
        onDragLeave: (event) => {
          event.currentTarget.classList.remove("ring-2", "ring-slate-300");
        },
        onDrop: async (event) => {
          event.preventDefault();
          event.currentTarget.classList.remove("ring-2", "ring-slate-300");
          await handleDrop(item.id);
        },
        onDragEnd: (event) => {
          event.currentTarget.classList.remove("ring-2", "ring-slate-300");
          setDraggingId(null);
        },
        className: draggingId === item.id ? "opacity-60" : undefined,
      };
      return acc;
    }, {});
  }, [draggingId, handleDrop, items]);

  return (
    <div className="space-y-4">
      {items.map((link) => (
        <LinkCard
          key={link.id}
          id={link.id}
          label={link.label}
          url={link.url}
          isVisible={link.isVisible}
          onToggleVisibility={onToggleVisibility}
          onDelete={onDelete}
          dragProps={dragPropsMap[link.id]}
        />
      ))}
    </div>
  );
}
