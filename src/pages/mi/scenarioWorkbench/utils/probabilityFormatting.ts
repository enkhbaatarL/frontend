const BAR_COUNT = 5

/** 채워진 막대 수(1~5) → 발생가능성 단계 라벨 (낮은 단계=막대 적음) */
export const FILLED_BARS_TO_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '매우낮음',
  2: '낮음',
  3: '중간',
  4: '높음',
  5: '매우높음',
}

// probability(0~1)를 채워질 막대 개수(1~5)로 매핑 — 구간 기준 올림: [0~0.2] → 1, [0.2~0.4] → 2, [0.4~0.6] → 3, [0.6~0.8] → 4, [0.8~1] → 5
export const probabilityToFilledBars = (probability: number): 1 | 2 | 3 | 4 | 5 => {
  if (!Number.isFinite(probability)) return 1
  const n = Math.min(BAR_COUNT, Math.max(1, Math.ceil(probability * BAR_COUNT)))
  return n as 1 | 2 | 3 | 4 | 5
}

/** 목록 게이지·상세 KPI와 동일한 발생가능성 문구 */
export const probabilityToLikelihoodLabel = (probability: number): string => {
  if (!Number.isFinite(probability)) return '—'
  return FILLED_BARS_TO_LABEL[probabilityToFilledBars(probability)]
}

export const formatProbabilityPercent = (probability: number): string | null => {
  if (!Number.isFinite(probability)) return null
  return `${Math.round(Math.min(1, Math.max(0, probability)) * 100)}%`
}
