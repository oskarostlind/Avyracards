"use client";

import { ChangeEvent } from "react";

import { ThemeName, themes } from "@/utils/theme";

interface ThemeSelectorProps {
  value: ThemeName;
  onChange: (value: ThemeName) => void;
  label: string;
}

export function ThemeSelector({ value, onChange, label }: ThemeSelectorProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as ThemeName);
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700" htmlFor="theme">
        {label}
      </label>
      <select
        id="theme"
        value={value}
        onChange={handleChange}
        className="w-full rounded-xl border border-slate-300 px-4 py-2 capitalize focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        {(Object.keys(themes) as ThemeName[]).map((themeKey) => (
          <option key={themeKey} value={themeKey} className="capitalize">
            {themeKey}
          </option>
        ))}
      </select>
    </div>
  );
}
