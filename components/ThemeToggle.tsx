"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const o = new MutationObserver(onChange);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => o.disconnect();
}
const getTheme = (): Theme | null => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const getServerTheme = (): Theme | null => null;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const next: Theme = theme === "light" ? "dark" : "light";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* not persisted in private mode */
    }
  }

  return (
    <button className="tgl" type="button" onClick={toggle} aria-label={theme ? `Switch to ${next} theme` : "Toggle theme"}>
      ◐ <span>{theme ? (next === "light" ? "Light" : "Dark") : "Theme"}</span>
    </button>
  );
}
