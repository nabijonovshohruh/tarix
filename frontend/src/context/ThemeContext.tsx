import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { getColorScheme, onThemeChange } from "../telegram/webApp";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "tarix.themeOverride";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? getColorScheme();
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setTheme(getColorScheme());
    };
    onThemeChange(handler);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
