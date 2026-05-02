import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeams, getMyPreCup, submitPreCup } from "../api/client";

interface Team {
  id: number;
  name: string;
  code: string;
  flagEmoji?: string;
  fifaRanking: number;
  isTop14: boolean;
}

export default function PreCopa() {
  const qc = useQueryClient();
  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["teams"], queryFn: getTeams });
  const { data: existing } = useQuery({ queryKey: ["my-precup"], queryFn: getMyPreCup });

  const [championId, setChampionId] = useState<number | "">("");
  const [shameTeamId, setShameTeamId] = useState<number | "">("");
  const [surpriseTeamId, setSurpriseTeamId] = useState<number | "">("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) {
      setChampionId(existing.championId);
      setShameTeamId(existing.shameTeamId);
      setSurpriseTeamId(existing.surpriseTeamId);
    }
  }, [existing]);

  const top14 = teams.filter((t) => t.isTop14);
  const others = teams.filter((t) => !t.isTop14);

  const mutation = useMutation({
    mutationFn: () =>
      submitPreCup({
        championId: Number(championId),
        shameTeamId: Number(shameTeamId),
        surpriseTeamId: Number(surpriseTeamId),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-precup"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const canSubmit = championId && shameTeamId && surpriseTeamId;

  const SelectGroup = ({
    label,
    emoji,
    description,
    value,
    onChange,
    options,
    color,
  }: {
    label: string;
    emoji: string;
    description: string;
    value: number | "";
    onChange: (v: number) => void;
    options: Team[];
    color: string;
  }) => (
    <div className={`bg-white rounded-2xl shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h3 className="font-black text-gray-900 text-lg">{label}</h3>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-green-500 bg-gray-50"
      >
        <option value="">Selecione uma seleção...</option>
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.flagEmoji} {t.name} (#{t.fifaRanking} FIFA)
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">🎯 Palpites Pré-Copa</h1>
        <p className="text-gray-500 mt-1">
          Faça suas escolhas antes da Copa começar. Estes palpites valem pontos extras!
        </p>
      </div>

      {/* Points summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Campeão", pts: "200 pts", color: "bg-yellow-50 border-yellow-400" },
          { label: "Vergonha", pts: "100 pts", color: "bg-red-50 border-red-400" },
          { label: "Surpresa", pts: "100 pts", color: "bg-blue-50 border-blue-400" },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border-2 p-3 text-center ${item.color}`}>
            <div className="font-black text-2xl">{item.pts}</div>
            <div className="text-sm font-semibold text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <SelectGroup
          label="Campeão da Copa"
          emoji="🏆"
          description="Quem vai levantar a taça? Vale 200 pontos!"
          value={championId}
          onChange={setChampionId}
          options={teams}
          color="border-yellow-400"
        />

        <SelectGroup
          label="Vergonha da Copa 😱"
          emoji="😳"
          description="Qual top-14 vai decepicionar mais? Menor índice (ranking × fase) = maior vergonha"
          value={shameTeamId}
          onChange={setShameTeamId}
          options={top14}
          color="border-red-400"
        />

        <SelectGroup
          label="Surpresa da Copa 🚀"
          emoji="⭐"
          description="Qual zebra vai ir mais longe? Maior índice (ranking × fase) = maior surpresa"
          value={surpriseTeamId}
          onChange={setSurpriseTeamId}
          options={others}
          color="border-blue-400"
        />
      </div>

      {/* Info box */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 border">
        <p className="font-bold text-gray-800 mb-1">📐 Como funciona o índice?</p>
        <p>
          <strong>Vergonha:</strong> índice = ranking FIFA × fator da fase de eliminação.
          O menor índice é a maior vergonha (ex: #1 eliminado na fase de grupos = índice 1.0).
        </p>
        <p className="mt-1">
          <strong>Surpresa:</strong> mesmo cálculo, mas quem tiver o{" "}
          <em>maior</em> índice ganha (ex: #90 nas quartas = 90 × 3.0 = 270).
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Fatores de fase: Grupos ×1, 16-avos ×2, Quartas ×3, Semi ×4, Campeão ×7
        </p>
      </div>

      <button
        disabled={!canSubmit || mutation.isPending}
        onClick={() => mutation.mutate()}
        className={`mt-6 w-full py-4 rounded-2xl font-black text-lg transition ${
          saved
            ? "bg-green-500 text-white"
            : canSubmit
            ? "bg-green-700 hover:bg-green-800 text-white"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {mutation.isPending ? "Salvando..." : saved ? "✅ Palpites salvos!" : "Salvar Palpites Pré-Copa"}
      </button>

      {mutation.isError && (
        <p className="text-red-500 text-center mt-3 text-sm">
          {(mutation.error as any)?.response?.data?.error ?? "Erro ao salvar"}
        </p>
      )}

      {existing && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Você pode alterar seus palpites até a Copa começar.
        </p>
      )}
    </div>
  );
}