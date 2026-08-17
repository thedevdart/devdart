import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dd-theme";

function resolveInitial() {
  if (typeof document === "undefined") return "light";
  // The pre-paint script in index.html already set data-theme; trust it.
  if (document.documentElement.getAttribute("data-theme") === "dark")
    return "dark";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch (e) {
    /* ignore */
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
    return "dark";
  return "light";
}

/**
 * Single source of truth for the light/dark theme.
 * Applies `data-theme` + `color-scheme` to <html> and persists to localStorage.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(resolveInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* ignore */
    }
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  return { theme, toggle };
}
