import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  as: Tag = "div",
  padded = true,
  className,
  children,
}: {
  as?: keyof React.JSX.IntrinsicElements;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-ink-100 bg-white shadow-sm",
        padded && "p-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("font-display text-base font-semibold text-ink-900", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("mt-1 text-sm text-ink-500", className)}>{children}</p>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-6 py-3", className)}>
      {children}
    </div>
  );
}
