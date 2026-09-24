"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { COUNTRIES, flagOf, type Country } from "@/lib/countries";
import { cn } from "@/lib/utils";

type Props = {
  value: Country;
  onChange: (c: Country) => void;
  disabled?: boolean;
};

export function CountryCodeSelect({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.startsWith(q) ||
        c.iso.toLowerCase() === q,
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(c: Country) {
    onChange(c);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-full items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 shadow-sm",
          "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100",
        )}
      >
        <span className="text-base leading-none">{flagOf(value.iso)}</span>
        <span className="tabular-nums">+{value.dial}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="relative border-b border-gray-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="देश शोधा · Search country"
              className="w-full rounded-md border border-gray-200 py-1.5 pl-8 pr-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {results.length === 0 && (
              <li className="px-3 py-3 text-center text-sm text-gray-400">
                काही सापडले नाही · No match
              </li>
            )}
            {results.map((c) => (
              <li key={c.iso}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.iso === value.iso}
                  onClick={() => choose(c)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50",
                    c.iso === value.iso && "bg-indigo-50/60 font-medium",
                  )}
                >
                  <span className="text-base leading-none">{flagOf(c.iso)}</span>
                  <span className="min-w-0 flex-1 truncate text-gray-900">{c.name}</span>
                  <span className="shrink-0 tabular-nums text-gray-500">+{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
