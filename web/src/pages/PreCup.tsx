import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getTeams, getMyPreCup, submitPreCup } from "../api/client";
import { TeamPicker } from "../components/TeamPicker";

interface Team { id: number; name: string; code: string; fifaRanking: number; isTop14: boolean; }

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
    mutationFn: () => submitPreCup({
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">🎯 Palpites Pré-Copa</h1>
        <p className="text-white/30 text-sm mt-1">Faça suas escolhas antes da Copa começar — valem pontos extras!</p>
      </div>

      {/* Points cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { pts: "200", label: "Campeão", sub: "acertar o vencedor", color: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 text-yellow-400" },
          { pts: "100", label: "Vergonha", sub: "menor índice top-14", color: "from-red-500/20 to-red-600/5 border-red-500/30 text-red-400" },
          { pts: "100", label: "Surpresa", sub: "maior índice fora-14", color: "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400" },
        ].map((c) => (
          <div key={c.label} className={`bg-gradient-to-b ${c.color} border rounded-2xl p-4 text-center`}>
            <div className="text-2xl font-black">{c.pts} pts</div>
            <div className="text-xs font-bold mt-0.5 opacity-80">{c.label}</div>
            <div className="text-[10px] opacity-40 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Pickers */}
      <div className="space-y-4">
        <TeamPicker
          label="Campeão da Copa"
          emoji="🏆"
          description="Quem vai levantar a taça? Vale 200 pontos!"
          value={championId}
          onChange={setChampionId}
          options={teams}
          accent="border-yellow-500/20"
        />
        <TeamPicker
          label="Vergonha da Copa"
          emoji="😳"
          description="Qual top-14 vai cair mais cedo? Menor índice = maior vergonha"
          value={shameTeamId}
          onChange={setShameTeamId}
          options={top14}
          accent="border-red-500/20"
        />
        <TeamPicker
          label="Surpresa da Copa"
          emoji="⭐"
          description="Qual zebra vai ir mais longe? Maior índice = maior surpresa"
          value={surpriseTeamId}
          onChange={setSurpriseTeamId}
          options={others}
          accent="border-blue-500/20"
        />
      </div>

      {/* Index explanation */}
      <div className="bg-white/[0.02] border border-white/6 rounded-xl p-4 text-xs text-white/25 space-y-1.5">
        <p className="font-bold text-white/35 text-sm">📐 Como funciona o índice?</p>
        <p><span className="text-white/45">Vergonha:</span> ranking FIFA × fator da fase. Menor = mais vergonha. Ex: #1 cai nos grupos = 1×1 = 1.0</p>
        <p><span className="text-white/45">Surpresa:</span> mesmo cálculo, mas ganha quem tiver o maior índice. Ex: #90 nas quartas = 90×3 = 270</p>
        <div className="flex gap-3 flex-wrap pt-1">
          {[["Grupos","×1"],["16-avos","×2"],["Quartas","×3"],["Semi","×4"],["Campeão","×7"]].map(([l,v]) => (
            <span key={l} className="bg-white/5 px-2 py-0.5 rounded text-[10px]">{l} <span className="text-[#f5c842]/60">{v}</span></span>
          ))}
        </div>
      </div>

      {/* Submit */}
      <motion.button
        disabled={!canSubmit || mutation.isPending}
        onClick={() => mutation.mutate()}
        whileHover={canSubmit ? { scale: 1.01 } : {}}
        whileTap={canSubmit ? { scale: 0.99 } : {}}
        className={`w-full py-4 rounded-2xl font-black text-sm transition ${
          saved
            ? "bg-green-500/15 border border-green-500/30 text-green-400"
            : canSubmit
            ? "bg-gradient-to-r from-[#f5c842] to-[#e8a020] text-black shadow-lg shadow-yellow-500/20"
            : "bg-white/5 border border-white/8 text-white/20 cursor-not-allowed"
        }`}
      >
        {mutation.isPending ? "Salvando..." : saved ? "✅ Palpites salvos!" : "Salvar Palpites Pré-Copa"}
      </motion.button>

      {mutation.isError && (
        <p className="text-red-400 text-center text-sm">
          {(mutation.error as any)?.response?.data?.error ?? "Erro ao salvar"}
        </p>
      )}
      {existing && !saved && (
        <p className="text-center text-white/15 text-xs">Você pode alterar seus palpites até a Copa começar.</p>
      )}
    </div>
  );
}