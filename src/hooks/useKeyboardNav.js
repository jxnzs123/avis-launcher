import { useEffect, useCallback, useRef } from "react";

/**
 * Generischer Grid-Navigations-Hook.
 *
 * @param {Array} items       - Liste der navigierbaren Elemente (z.B. Spiele)
 * @param {number} columns    - Anzahl Spalten im Grid (für Auf/Ab-Berechnung)
 * @param {string} selectedId - aktuell fokussiertes Element (id)
 * @param {(id:string)=>void} onSelect   - wird bei Pfeiltasten-Bewegung aufgerufen
 * @param {(item:any)=>void} onActivate  - wird bei Enter aufgerufen
 * @param {()=>void} onBack   - wird bei Escape aufgerufen
 * @param {boolean} enabled   - Hook nur aktiv, wenn true (z.B. kein Modal offen)
 */
export function useKeyboardNav({
  items,
  columns,
  selectedId,
  onSelect,
  onActivate,
  onBack,
  enabled = true,
}) {
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled || itemsRef.current.length === 0) return;

      const currentIndex = itemsRef.current.findIndex((i) => i.id === selectedId);
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;
      const total = itemsRef.current.length;

      const moveTo = (index) => {
        const clamped = Math.max(0, Math.min(total - 1, index));
        onSelect(itemsRef.current[clamped].id);
      };

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          moveTo(safeIndex + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          moveTo(safeIndex - 1);
          break;
        case "ArrowDown":
          event.preventDefault();
          moveTo(safeIndex + columns);
          break;
        case "ArrowUp":
          event.preventDefault();
          moveTo(safeIndex - columns);
          break;
        case "Enter":
          event.preventDefault();
          onActivate?.(itemsRef.current[safeIndex]);
          break;
        case "Escape":
          event.preventDefault();
          onBack?.();
          break;
        default:
          break;
      }
    },
    [columns, selectedId, onSelect, onActivate, onBack, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Platzhalter-Hook für Gamepad-Support (Gamepad API).
 * Kann später einfach in App.jsx aktiviert werden, indem die gleichen
 * onSelect/onActivate/onBack-Callbacks übergeben werden wie oben.
 *
 * D-Pad/Stick -> Richtungswechsel, Button A/Cross -> Enter, Button B/Circle -> Escape.
 */
export function useGamepadNav({ onSelect, onActivate, onBack, enabled = true }) {
  useEffect(() => {
    if (!enabled) return;
    let animationFrame;
    let lastInputTime = 0;
    const THROTTLE_MS = 180;

    const pollGamepad = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const pad = pads[0];
      if (pad) {
        const now = performance.now();
        if (now - lastInputTime > THROTTLE_MS) {
          const [leftX, leftY] = pad.axes;
          if (pad.buttons[0]?.pressed) {
            onActivate?.();
            lastInputTime = now;
          } else if (pad.buttons[1]?.pressed) {
            onBack?.();
            lastInputTime = now;
          } else if (leftX > 0.5 || pad.buttons[15]?.pressed) {
            onSelect?.("right");
            lastInputTime = now;
          } else if (leftX < -0.5 || pad.buttons[14]?.pressed) {
            onSelect?.("left");
            lastInputTime = now;
          } else if (leftY > 0.5 || pad.buttons[13]?.pressed) {
            onSelect?.("down");
            lastInputTime = now;
          } else if (leftY < -0.5 || pad.buttons[12]?.pressed) {
            onSelect?.("up");
            lastInputTime = now;
          }
        }
      }
      animationFrame = requestAnimationFrame(pollGamepad);
    };

    animationFrame = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animationFrame);
  }, [onSelect, onActivate, onBack, enabled]);
}
