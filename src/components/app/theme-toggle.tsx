"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "siskija-theme";
const THEME_EVENT = "siskija-theme-change";

type Theme = "light" | "dark";

function getSnapshot(): Theme {
  if (typeof document !== "undefined") {
    const current = document.documentElement.dataset.theme;

    if (current === "light" || current === "dark") {
      return current;
    }
  }

  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      title={isDark ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      onClick={() => {
        const nextTheme = isDark ? "light" : "dark";

        document.documentElement.dataset.theme = nextTheme;
        localStorage.setItem(STORAGE_KEY, nextTheme);
        window.dispatchEvent(new Event(THEME_EVENT));
      }}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-card-alt"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-secondary" />
      ) : (
        <Moon className="h-4 w-4 text-secondary" />
      )}
      <span>{isDark ? "Tema Terang" : "Tema Gelap"}</span>
    </button>
  );
}
