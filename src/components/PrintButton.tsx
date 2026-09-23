"use client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <Button onClick={() => window.print()} variant="secondary">
      <Printer className="mr-1 h-4 w-4" /> {label}
    </Button>
  );
}
