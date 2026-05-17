import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface PhaseOption {
  key: string;
  label: string;
}

interface PhasePickerProps {
  value: string;
  onChange: (val: string) => void;
  options: PhaseOption[];
  placeholder?: string;
}

export function PhasePicker({ value, onChange, options, placeholder }: PhasePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((p) => p.key === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block w-[180px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition text-left text-sm ${
          open ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        <span className={selected ? "text-white" : "text-white/25"}>
          {selected ? selected.label : (placeholder ?? t("phasePicker.placeholder"))}
        </span>
        <span className="text-white/20 text-[10px]">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 left-0 top-full mt-2 z-50 bg-[#1a1a24] border border-white/15 rounded-xl shadow-2xl overflow-hidden min-w-[160px]">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  onChange(p.key);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition text-left text-sm ${
                  p.key === value ? "bg-[#f5c842]/10 text-[#f5c842]" : "text-white/80"
                }`}
              >
                <span>{p.label}</span>
                {p.key === value && <span className="text-[#f5c842]">✓</span>}
              </button>
            ))}
            {value && (
               <button
               type="button"
               onClick={() => { onChange(""); setOpen(false); }}
               className="w-full text-left px-4 py-2 text-xs text-white/30 hover:text-white/60 border-t border-white/5"
             >
               {t("phasePicker.clearSelection")}
             </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
