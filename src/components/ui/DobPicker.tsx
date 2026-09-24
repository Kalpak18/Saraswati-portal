"use client";

import { useState } from "react";
import { Input } from "./Input";
import { Select } from "./Select";

const MONTHS = [
  "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
  "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर",
];

const pad = (n: string | number) => String(n).padStart(2, "0");
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate(); // m is 1-based

type Props = {
  /** "YYYY-MM-DD" or "" */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

/** Day (typed) · Month (dropdown) · Year (typed) — the usual birthday row. */
export function DobPicker({ value, onChange, disabled }: Props) {
  const parts = value ? value.split("-") : null;
  const [day, setDay] = useState(parts ? String(Number(parts[2])) : "");
  const [month, setMonth] = useState(parts ? String(Number(parts[1])) : "");
  const [year, setYear] = useState(parts ? parts[0] : "");

  // Parent cleared the field (e.g. "new search") — clear the boxes with it.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (!value && (day || month || year)) {
      setDay("");
      setMonth("");
      setYear("");
    }
  }

  function emit(d: string, m: string, y: string) {
    if (d && m && y.length === 4) {
      const yy = Number(y);
      const mm = Number(m);
      const dd = Math.min(Number(d), daysInMonth(yy, mm));
      if (yy >= 1900 && dd >= 1) {
        onChange(`${yy}-${pad(mm)}-${pad(dd)}`);
        return;
      }
    }
    onChange("");
  }

  const digitsOnly = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

  return (
    <div className="grid grid-cols-[1fr_1.6fr_1.1fr] gap-2">
      <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">दिवस · Day</span>
      <Input
        placeholder="13"
        inputMode="numeric"
        autoComplete="bday-day"
        disabled={disabled}
        value={day}
        onChange={(e) => {
          const v = digitsOnly(e.target.value, 2);
          setDay(v);
          emit(v, month, year);
        }}
        onBlur={() => {
          // 31 in February → 28/29, so the parent never submits an impossible date
          if (day && month && year.length === 4) {
            const clamped = String(Math.min(Number(day) || 1, daysInMonth(Number(year), Number(month))));
            if (clamped !== day) {
              setDay(clamped);
              emit(clamped, month, year);
            }
          }
        }}
      />
      </label>

      <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">महिना · Month</span>
      <Select
        disabled={disabled}
        value={month}
        onChange={(e) => {
          setMonth(e.target.value);
          emit(day, e.target.value, year);
        }}
      >
        <option value="">महिना</option>
        {MONTHS.map((label, i) => (
          <option key={label} value={i + 1}>{label}</option>
        ))}
      </Select>
      </label>

      <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">वर्ष · Year</span>
      <Input
        placeholder="2010"
        inputMode="numeric"
        autoComplete="bday-year"
        disabled={disabled}
        value={year}
        onChange={(e) => {
          const v = digitsOnly(e.target.value, 4);
          setYear(v);
          emit(day, month, v);
        }}
      />
      </label>
    </div>
  );
}
