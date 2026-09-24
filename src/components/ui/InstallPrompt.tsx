"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

/**
 * Chrome / Edge / Samsung Internet fire `beforeinstallprompt` when the site
 * qualifies as installable. Safari (iOS) does not — parents on iPhone will
 * install through "Share → Add to Home Screen" instead, which needs no code.
 *
 * We show this bar the first time it fires, remember the user's answer in
 * localStorage, and stay out of the way otherwise. Deliberately minimal — the
 * banner never blocks content.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "sp-install-dismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already dismissed / installed once — never bother again.
    try {
      if (localStorage.getItem(DISMISSED_KEY) === "1") return;
    } catch { /* private mode — treat as "not dismissed" */ }
    if (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) {
      return; // already installed
    }

    function onEvent(e: Event) {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onEvent as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", onEvent as EventListener);
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* ignore */ }
  }

  async function accept() {
    if (!event) return dismiss();
    try {
      await event.prompt();
      await event.userChoice;
    } finally {
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install app"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-lg sm:inset-x-auto sm:right-4 sm:max-w-md"
    >
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
        <Download className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-medium text-gray-900">Install Saraswati</div>
        <div className="truncate text-xs text-gray-500">
          Add to home screen for fast access.
        </div>
      </div>
      <button
        type="button"
        onClick={accept}
        className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
