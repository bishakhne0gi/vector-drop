"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

/**
 * Routes that are always dark, regardless of stored or system preference.
 *
 * These pages are built from explicit dark values and a `.dark`-scoped variable
 * set. Letting a light preference apply to them turns cards and panels white —
 * which is exactly what happened: app/(app)/layout.tsx added `dark`, then this
 * provider mounted and removed it again for anyone whose preference was light.
 */
const FORCED_DARK_ROUTE = /^\/(dashboard|editor|icons|hades)/;

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "dark" || stored === "light") return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function applyTheme(next: Theme) {
  document.documentElement.classList.toggle("dark", next === "dark");
  localStorage.setItem("theme", next);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const forcedDark = FORCED_DARK_ROUTE.test(pathname ?? "");

  useEffect(() => {
    // Re-runs on navigation: entering an app route must re-assert dark, and
    // leaving it must restore the user's own preference.
    if (forcedDark) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
      setMounted(true);
      return;
    }

    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, [forcedDark]);

  const toggle = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";

    // View Transitions API — block-wipe from top-right corner
    // flushSync ensures React re-renders synchronously inside the transition
    // so the wipe covers the entire page, not just CSS-variable-driven elements
    if ("startViewTransition" in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        flushSync(() => {
          applyTheme(next);
          setTheme(next);
        });
      });
    } else {
      applyTheme(next);
      setTheme(next);
    }
  }, [theme]);

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "light", toggle }}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
