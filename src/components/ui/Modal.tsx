"use client";
import { type ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
  showClose = true,
  closeOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: keyof typeof sizeMap;
  showClose?: boolean;
  /** Whether clicking the dim backdrop closes the modal. Defaults true. */
  closeOnBackdrop?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;

    // Lock background scroll so the dialog is the only scrollable surface.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first interactive element inside, or the dialog itself.
    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        "input, select, textarea, button, [tabindex]:not([tabindex='-1'])",
      );
      (first ?? dialogRef.current)?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      // Trap Tab inside the dialog.
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-[1px] transition-opacity animate-in fade-in duration-150"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 my-auto w-full rounded-xl bg-white shadow-2xl outline-none",
          "animate-in fade-in zoom-in-95 duration-150",
          sizeMap[size],
          className,
        )}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id="modal-title" className="truncate text-base font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-gray-500">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 -mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Footer row used inside a Modal — pushes actions to the right. */
export function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 -mx-6 -mb-5 rounded-b-xl bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}
