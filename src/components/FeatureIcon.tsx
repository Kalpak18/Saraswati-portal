import {
  BookOpen, Bus, Eye, Heart, Landmark, Target, Dumbbell, GraduationCap, HeartHandshake, Languages, Laptop, Leaf, Microscope, Music,
  Palette, ShieldCheck, Stethoscope, Trophy, Users, Utensils,
} from "lucide-react";
import type { FEATURE_ICONS } from "@/lib/homeSections";

// Explicit imports (not `import *`) so only these 16 icons ship to the browser.
export const FEATURE_ICON_MAP: Record<(typeof FEATURE_ICONS)[number], React.ComponentType<{ className?: string }>> = {
  Eye, Target, Heart, Landmark, BookOpen, Microscope, Trophy, Palette, Bus, HeartHandshake, Laptop, Music,
  Dumbbell, GraduationCap, Leaf, ShieldCheck, Languages, Users, Utensils, Stethoscope,
};

export function FeatureIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = FEATURE_ICON_MAP[name as keyof typeof FEATURE_ICON_MAP] ?? BookOpen;
  return <Icon className={className} />;
}
