import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export function usePointerDrag() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const origin = useRef({ x: 0, y: 0, px: 0, py: 0 });

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const desk = document.querySelector("[data-desktop]")?.getBoundingClientRect();
    const startX = rect.left - (desk?.left ?? 0);
    const startY = rect.top - (desk?.top ?? 0);
    origin.current = {
      x: startX,
      y: startY,
      px: event.clientX,
      py: event.clientY,
    };
    dragging.current = false;
    target.setPointerCapture(event.pointerId);

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - origin.current.px;
      const dy = ev.clientY - origin.current.py;
      if (Math.hypot(dx, dy) > 4) dragging.current = true;
      setPos({
        x: Math.max(8, origin.current.x + dx),
        y: Math.max(8, origin.current.y + dy),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.setTimeout(() => {
        dragging.current = false;
      }, 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return { pos, onPointerDown, dragging };
}
