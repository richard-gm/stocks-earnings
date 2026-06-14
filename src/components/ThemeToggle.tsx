"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-current/20 hover:bg-white/10 transition-colors"
    >
      {dark ? (
        <>
          <span>☀</span>
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <span>🌙</span>
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}
