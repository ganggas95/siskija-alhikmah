"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Skip initial mount — page already loaded
    if (prevPathname.current === pathname) return;

    // Navigation detected — start progress bar
    if (intervalRef.current) clearInterval(intervalRef.current);

    setVisible(true);
    setWidth(25);

    // Simulate indeterminate progress while page loads
    intervalRef.current = setInterval(() => {
      setWidth((prev) => {
        if (prev < 85) return prev + Math.random() * 6 + 2;
        return prev;
      });
    }, 250);

    prevPathname.current = pathname;

    // Fallback: complete after component re-renders with new route
    const fallback = setTimeout(() => {
      finish();
    }, 4000);

    function finish() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setWidth(100);
      setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 350);
    }

    return () => {
      clearTimeout(fallback);
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Navigation complete — finish animation
      setWidth(100);
      setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 350);
    }
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] bg-green-100/50">
      <div
        className="h-full bg-green-800 transition-all duration-[350ms] ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
