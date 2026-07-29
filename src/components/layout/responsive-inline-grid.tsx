import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ResponsiveInlineGridProps<E extends ElementType = "div"> = {
  as?: E;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, "as" | "className" | "children">;

export function ResponsiveInlineGrid<E extends ElementType = "div">({
  as,
  className,
  children,
  ...props
}: ResponsiveInlineGridProps<E>) {
  const Component = as ?? "div";

  return (
    <Component
      className={cn(
        "grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
