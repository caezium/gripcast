/** Make a non-button clickable element keyboard-activatable (Enter/Space). */
export function activate(node: HTMLElement, handler: (e: Event) => void) {
  let fn = handler;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(e); }
  };
  node.addEventListener("keydown", onKey);
  return {
    update(h: (e: Event) => void) { fn = h; },
    destroy() { node.removeEventListener("keydown", onKey); },
  };
}

export const reducedMotion =
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
