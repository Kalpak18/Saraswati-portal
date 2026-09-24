"use client";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal, ModalActions } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";

/**
 * A styled replacement for `window.confirm()`.
 *
 * For high-risk actions (cascading delete of a class + its students, etc.)
 * pass `challengeText` — the user must retype it exactly before Confirm
 * enables. Prevents muscle-memory clicks.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  challengeText,
  challengeHint,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  /** If set, user must type this into a text box before Confirm enables. */
  challengeText?: string;
  challengeHint?: ReactNode;
}) {
  const [typed, setTyped] = useState("");
  const requiresChallenge = !!challengeText;
  const passesChallenge = !requiresChallenge || typed.trim() === challengeText.trim();

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} size="md" showClose={false} title={undefined}>
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${tone === "danger" ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <div className="mt-1 text-sm text-gray-600">{description}</div>}

          {requiresChallenge && (
            <div className="mt-4">
              <Input
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={challengeText}
                label={<>Type <span className="font-mono text-gray-900">{challengeText}</span> to confirm</>}
                hint={challengeHint}
              />
            </div>
          )}
        </div>
      </div>

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
          disabled={!passesChallenge || loading}
        >
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
}
