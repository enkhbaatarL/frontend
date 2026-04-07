import type { ISeriesData } from '@/service/mi/newsletter'

/** 거래량 패널 — `InflectionPointChart`와 플레이스홀더 높이 */
export const INFLECTION_CHART_VOLUME_PANEL_FULL_HEIGHT = 170
export const INFLECTION_CHART_VOLUME_PANEL_COLLAPSED_HEIGHT = 32

export const INFLECTION_POINT_CHART_MAIN_HEIGHT = 322
export const INFLECTION_POINT_CHART_OUTER_WIDTH = 776
export const INFLECTION_POINT_CHART_EMPTY_STATE_HEIGHT = 352

/**
 * `showChartToolbar` 편집 행 — `InflectionPointChart`의 MISelectMenu·MIBaseButton 행 높이(36px)와 동일.
 */
export const INFLECTION_POINT_CHART_EDIT_TOOLBAR_ROW_HEIGHT = 36

/** 이메일 본문 등 툴바 없는 차트 슬롯 — 모달 플레이스홀더(캔들+거래량 풀 높이 고정, 데이터와 무관) */
export const INFLECTION_POINT_CHART_EMBED_PLACEHOLDER_HEIGHT =
  INFLECTION_POINT_CHART_MAIN_HEIGHT + INFLECTION_CHART_VOLUME_PANEL_FULL_HEIGHT

/** 편집기 News Flow 인라인(툴바 있음) — 모달 플레이스홀더 고정 높이 */
export const INFLECTION_POINT_CHART_INLINE_EDIT_PLACEHOLDER_HEIGHT =
  INFLECTION_POINT_CHART_EMBED_PLACEHOLDER_HEIGHT + INFLECTION_POINT_CHART_EDIT_TOOLBAR_ROW_HEIGHT

export const findVolumeSeriesInChart = (series: ISeriesData[] | undefined) =>
  series?.find(
    (s) =>
      s.renderAs?.toLowerCase() === 'volume' || s.seriesId?.toLowerCase().includes('volume') || s.label?.toLowerCase().includes('volume'),
  )
