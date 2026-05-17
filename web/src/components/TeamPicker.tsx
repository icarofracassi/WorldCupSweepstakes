import { useState, useRef, useEffect } from "react";
import Flag from "react-world-flags";
import { useTranslation } from "react-i18next";

const FIFA_TO_ISO: Record<string, string> = {
  GER:"DE",SWE:"SE",HAI:"HT",URU:"UY",MEX:"MX",SUI:"CH",NED:"NL",
  DEN:"DK",POR:"PT",ESP:"ES",FRA:"FR",ENG:"GB-ENG",SCO:"GB-SCT",
  BRA:"BR",ARG:"AR",COL:"CO",ECU:"EC",CHI:"CL",PAR:"PY",BOL:"BO",
  VEN:"VE",PER:"PE",USA:"US",CAN:"CA",CRC:"CR",PAN:"PA",SEN:"SN",
  MAR:"MA",TUN:"TN",NGA:"NG",CMR:"CM",GHA:"GH",CIV:"CI",ALG:"DZ",
  EGY:"EG",RSA:"ZA",COD:"CD",CPV:"CV",QAT:"QA",KSA:"SA",IRN:"IR",
  IRQ:"IQ",JOR:"JO",KOR:"KR",JPN:"JP",AUS:"AU",NZL:"NZ",UZB:"UZ",
  CRO:"HR",POL:"PL",SRB:"RS",SVK:"SK",CZE:"CZ",HUN:"HU",AUT:"AT",
  BIH:"BA",UKR:"UA",TUR:"TR",BEL:"BE",ITA:"IT",NOR:"NO",CUR:"CW",
};
function getFlagCode(code: string) { return FIFA_TO_ISO[code] ?? code; }

interface Team { id: number; name: string; code: string; fifaRanking: number; isTop14: boolean; }

interface TeamPickerProps {
  label: string;
  emoji: string;
  description: string;
  value: number | "";
  onChange: (v: number) => void;
  options: Team[];
  accent: string;
}

export function TeamPicker({ label, emoji, description, value, onChange, options, accent }: TeamPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((team) => team.id === value);

  const filtered = options.filter((team) => {
    const localizedName = t(`teams.${team.code}`, { defaultValue: team.name }).toLowerCase();
    
    return (
      localizedName.includes(search.toLowerCase()) ||
      team.code.toLowerCase().includes(search.toLowerCase())
    );
  });
  // ------------------------------------------------

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) { setSearch(""); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  return (
    <div ref={ref} className={`bg-white/[0.03] border rounded-2xl p-5 transition ${accent} relative`}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl mt-0.5">{emoji}</span>
        <div className="flex-1">
          <div className="font-black text-white text-sm">{label}</div>
          <div className="text-white/30 text-xs mt-0.5">{description}</div>
        </div>
      </div>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
          open ? "border-white/30 bg-white/8" : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        {selected ? (
          <>
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
              <Flag code={getFlagCode(selected.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
            {/* CHANGED HERE: Localized Selected Label */}
            <span className="text-white font-semibold text-sm flex-1">
              {t(`teams.${selected.code}`, { defaultValue: selected.name })}
            </span>
            <span className="text-white/25 text-xs">#{selected.fifaRanking} FIFA</span>
          </>
        ) : (
            <span className="text-white/25 text-sm flex-1">{t("teamPicker.selectTeam")}</span>
        )}
        <span className="text-white/20 text-xs ml-auto">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#1a1a24] border border-white/15 rounded-2xl shadow-2xl overflow-hidden mx-4">
          {/* Search */}
          <div className="p-3 border-b border-white/5">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("teamPicker.searchPlaceholder")}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/30 transition"
            />
          </div>
          {/* Options */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
               <div className="text-center py-4 text-white/20 text-sm">{t("teamPicker.noResults")}</div>
            ) : (
              filtered.map((team) => (
                <button key={team.id} type="button"
                  onClick={() => { onChange(team.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left ${
                    team.id === value ? "bg-[#f5c842]/5" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                    <Flag code={getFlagCode(team.code)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                  {/* CHANGED HERE: Localized Dropdown Row Labels */}
                  <span className={`text-sm font-semibold flex-1 ${team.id === value ? "text-[#f5c842]" : "text-white/80"}`}>
                    {t(`teams.${team.code}`, { defaultValue: team.name })}
                  </span>
                  <span className="text-white/20 text-xs">#{team.fifaRanking}</span>
                  {team.id === value && <span className="text-[#f5c842] text-xs">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}