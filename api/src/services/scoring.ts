// Phase multipliers applied to match base points
export const PHASE_MULTIPLIERS: Record<string, number> = {
  group: 1.0,
  r16: 1.25,
  qf: 1.5,
  sf: 1.75,
  final: 3.0,
};

// Phase factors used for Shame/Surprise index calculation
export const PHASE_FACTORS: Record<string, number> = {
  group: 1.0,
  r16: 2.0,
  qf: 3.0,
  sf: 4.0,
  "3rd": 5.0,
  champion: 7.0,
};

// Pre-cup fixed points
export const PRE_CUP_POINTS = {
  champion: 200,
  top8PerTeam: 20,
  shame: 100,
  surprise: 100,
};

/**
 * Calculate points for a single match prediction.
 * Base points:
 *   5 = exact score
 *   3 = right winner + correct goal difference
 *   1 = right winner or correct draw
 *   0 = wrong
 * Multiplied by the phase multiplier.
 */
export function calcMatchPoints(
  predA: number,
  predB: number,
  realA: number,
  realB: number,
  phaseMultiplier: number
): number {
  const predWinner = Math.sign(predA - predB);
  const realWinner = Math.sign(realA - realB);
  const predDiff = predA - predB;
  const realDiff = realA - realB;

  let base = 0;
  if (predA === realA && predB === realB) {
    base = 5; // exact score
  } else if (predWinner === realWinner && predDiff === realDiff) {
    base = 3; // right winner + same goal difference
  } else if (predWinner === realWinner) {
    base = 1; // right winner only
  }

  return parseFloat((base * phaseMultiplier).toFixed(2));
}

/**
 * Shame index for top-14 FIFA ranked teams.
 * Lower = more shameful. Winner of "vergonha" = team with LOWEST index.
 * Formula: fifaRanking * phaseFactor
 * Example: #1 ranked team eliminated in groups = 1 * 1.0 = 1.0 (maximum shame)
 */
export function calcShameIndex(fifaRanking: number, eliminatedPhase: string): number {
  const factor = PHASE_FACTORS[eliminatedPhase] ?? 1.0;
  return parseFloat((fifaRanking * factor).toFixed(2));
}

/**
 * Surprise index for teams outside top-14 FIFA ranking.
 * Higher = more surprising. Winner of "surpresa" = team with HIGHEST index.
 * Formula: fifaRanking * phaseFactor
 * Example: #90 ranked team reaches quarters = 90 * 3.0 = 270.0 (huge surprise)
 */
export function calcSurpriseIndex(fifaRanking: number, eliminatedPhase: string): number {
  const factor = PHASE_FACTORS[eliminatedPhase] ?? 1.0;
  return parseFloat((fifaRanking * factor).toFixed(2));
}