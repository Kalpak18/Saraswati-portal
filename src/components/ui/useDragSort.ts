"use client";

import { useState } from "react";

/**
 * Drag-to-reorder for a list, using the browser's native drag and drop.
 * Spread `itemProps(i)` onto each row and `handleProps(i)` onto its grip:
 * a row only becomes draggable while its grip is held, so text fields in
 * the row keep normal selection. Touch screens don't do native drag, so
 * keep the up / down buttons alongside for phones and keyboards.
 */
export function useDragSort(count: number, onMove: (from: number, to: number) => void) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);

  const handleProps = (i: number) => ({
    onPointerDown: () => setArmed(i),
    onPointerUp: () => setArmed(null),
    style: { cursor: "grab", touchAction: "none" } as React.CSSProperties,
  });

  const itemProps = (i: number) => ({
    draggable: armed === i,
    onDragStart: (e: React.DragEvent) => {
      if (armed !== i) { e.preventDefault(); return; }
      setDragging(i);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i));
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragging == null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== i) setOver(i);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragging != null && dragging !== i && i >= 0 && i < count) onMove(dragging, i);
      setDragging(null);
      setOver(null);
      setArmed(null);
    },
    onDragEnd: () => { setDragging(null); setOver(null); setArmed(null); },
    "data-dragging": dragging === i || undefined,
    "data-drop-target": (over === i && dragging !== null && dragging !== i) || undefined,
  });

  return { itemProps, handleProps, dragging, over };
}

/** Move one element of an array to a new index. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}
