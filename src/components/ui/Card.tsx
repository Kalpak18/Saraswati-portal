import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * White surface with a rounded border. Use for anything that would otherwise
 * be a naked `<div className="rounded-lg border bg-white …">` — every admin
 * page uses this shape ten times.
 */
export function Card({
  as: Tag = "div",
  padded = true,
  className,
  children,
}: {
  as?: keyof React.JSX.IntrinsicElements;
  /** Adds internal padding. Off when the card contains its own header/body. */
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("text-base font-semibold text-gray-900", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("mt-1 text-sm text-gray-500", className)}>{children}</p>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3", className)}>
      {children}
    </div>
  );
}
