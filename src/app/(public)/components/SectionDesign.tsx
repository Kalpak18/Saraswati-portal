"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SectionDesign } from "@/lib/homeSections";

// A section's Design-panel choices (heading alignment / size, entrance
// animation), readable by any heading or Reveal inside that section.
const Ctx = createContext<SectionDesign>({});

export function SectionDesignProvider({ value, children }: { value: SectionDesign; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSectionDesign(): SectionDesign {
  return useContext(Ctx);
}
