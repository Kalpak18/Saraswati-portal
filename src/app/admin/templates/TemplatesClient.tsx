"use client";

import * as XLSX from "xlsx";
import { TEMPLATES } from "@/lib/excel/templates";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

function download(wb: XLSX.WorkBook, name: string) {
  XLSX.writeFile(wb, name);
}

export default function TemplatesClient() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Templates"
        description="Download ready-to-fill Excel files for students and results."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <Card key={t.filename}>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-semibold text-ink-900">{t.title}</h3>
                <p className="mt-1 text-sm text-ink-600">{t.description}</p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => download(t.build(), t.filename)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
