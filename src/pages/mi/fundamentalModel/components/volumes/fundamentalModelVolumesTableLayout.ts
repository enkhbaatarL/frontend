import type { SxProps } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { SystemStyleObject } from '@mui/system'

/** Volumes Table 컴포넌트 최소 너비 */
export const FM_VOLUME_TABLE_MIN_W = 960
/** Volumes Table 기본 타겟 너비 */
export const FM_VOLUME_TABLE_BASE_W = 1000

/** Volumes 표 공통 레이아웃 토큰 */
export const FM_VOLUME_TABLE_HEADER_H = 36
export const FM_VOLUME_TABLE_BODY_H = 40

/** Global 본문 표 최대 높이(Table 900px) */
export const FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT = 900
/** Volumes 로딩 중 표 영역 placeholder 고정 높이 */
export const FM_VOLUME_TABLE_SKELETON_H = 460
/** 하단 가로 스크롤 트랙 높이 */
export const FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H = 12
export const FM_VOLUME_GLOBAL_TABLE_BODY_MAX_HEIGHT =
  FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT - FM_VOLUME_TABLE_HEADER_H - FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H

/** Global 본문 표 - 섹션/국가 고정열 너비 */
export const FM_VOLUME_GLOBAL_SECTION_COL_W = 100
export const FM_VOLUME_GLOBAL_COUNTRY_COL_W = 160
export const FM_VOLUME_GLOBAL_FROZEN_W = FM_VOLUME_GLOBAL_SECTION_COL_W + FM_VOLUME_GLOBAL_COUNTRY_COL_W

/** 월 컬럼 너비 */
export const FM_VOLUME_MONTH_COL_W = 90

export const fmVolumeMonthColumnsWidth = (monthCount: number, columnWidth = FM_VOLUME_MONTH_COL_W) => monthCount * columnWidth

export const fmVolumeResolvedMonthColumnWidth = (monthCount: number, frozenWidth: number, tableWidth = FM_VOLUME_TABLE_BASE_W): number => {
  if (monthCount <= 0) return FM_VOLUME_MONTH_COL_W
  const stretchWidth = Math.floor((tableWidth - frozenWidth) / monthCount)
  return Math.max(FM_VOLUME_MONTH_COL_W, stretchWidth)
}

export const fmVolumeExpandColumnWidthsToFit = (columnWidths: number[], availableWidth: number): number[] => {
  if (columnWidths.length === 0 || !Number.isFinite(availableWidth)) return columnWidths
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0)
  if (totalWidth >= availableWidth) return columnWidths
  const extraWidth = (availableWidth - totalWidth) / columnWidths.length
  return columnWidths.map((width) => width + extraWidth)
}

/** 가로 스크롤바 숨김(하단 트랙만 표시할 때) */
export const fmVolumeHiddenHorizontalScrollbarSx: SystemStyleObject<Theme> = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
}

/** Trade 표 To country 고정열 너비 */
export const FM_VOLUME_TRADE_TO_COL_W = 160
export const FM_VOLUME_TRADE_FROM_COL_MIN_W = 90
export const FM_VOLUME_TRADE_TOTAL_COL_W = 90
/** Trade 표 헤더 2단(From country 배너 + 열 라벨) */
export const FM_VOLUME_TRADE_TABLE_HEADER_H = FM_VOLUME_TABLE_HEADER_H + FM_VOLUME_TABLE_BODY_H
export const FM_VOLUME_TRADE_TABLE_BODY_MAX_HEIGHT =
  FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT - FM_VOLUME_TRADE_TABLE_HEADER_H - FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H

/** Trade From 열 너비(디자인 스펙, API와 분리) */
export const FM_VOLUME_TRADE_FROM_COL_WIDTHS = [80, 80, 80, 80, 92, 90, 80, 90, 98, 80, 82, 80, 80, 80, 80, 100, 110] as const

export const fmVolumeTradeFromColumnWidth = (columnIndex: number): number =>
  FM_VOLUME_TRADE_FROM_COL_WIDTHS[columnIndex] ?? FM_VOLUME_TRADE_FROM_COL_MIN_W

export const fmVolumeTradeColumnsWidth = (columnCount: number): number =>
  Array.from({ length: columnCount }, (_, i) => fmVolumeTradeFromColumnWidth(i)).reduce((sum, w) => sum + w, 0)

/** 요약 표 라벨열 너비 */
export const FM_VOLUME_SUMMARY_LABEL_COL_W = 260

/** 본문 셀 구분선(content.border.normal #DEE2E6) */
export const FM_VOLUME_TABLE_BORDER = '1px solid #DEE2E6'
export const FM_VOLUME_TABLE_TOTAL_ROW_BORDER = '2px solid #DEE2E6'

/** 헤더 하단 구분선(gray.40 #CED4DA) */
export const FM_VOLUME_TABLE_HEADER_BORDER = '1px solid #CED4DA'
export const FM_VOLUME_TABLE_HOVER_SCROLL_CLASS = 'fm-volume-table-hover-scroll'
export const FM_VOLUME_TABLE_SCROLL_SHADOW_EPSILON_PX = 2
export const FM_VOLUME_TABLE_COLUMN_HEADER_SHADOW = '0 8px 16px -10px rgba(0, 0, 0, 0.1)'
export const FM_VOLUME_TABLE_ROW_HEADER_SHADOW = '8px 0 16px -10px rgba(0, 0, 0, 0.1)'
export const FM_VOLUME_TABLE_SCROLL_SHADOW_TRANSITION = 'box-shadow 180ms cubic-bezier(0.4, 0, 0.2, 1)'

export const fmVolumeTableHeaderCellSx: SystemStyleObject<Theme> = {
  height: FM_VOLUME_TABLE_HEADER_H,
  px: '12px',
  py: '8px',
  display: 'flex',
  alignItems: 'center',
  bgcolor: 'gray.5',
  borderBottom: FM_VOLUME_TABLE_HEADER_BORDER,
  boxSizing: 'border-box',
}

export const fmVolumeTableBodyCellSx: SystemStyleObject<Theme> = {
  height: FM_VOLUME_TABLE_BODY_H,
  px: '12px',
  display: 'flex',
  alignItems: 'center',
  borderBottom: FM_VOLUME_TABLE_BORDER,
  bgcolor: 'commonColor.White',
  boxSizing: 'border-box',
}

/** 소계/합계 셀 배경 */
export const FM_VOLUME_SUBTOTAL_CELL_BG = 'var(--common-primary-5, rgba(46, 63, 94, 0.05))'
export const FM_VOLUME_TOTAL_CELL_BG = 'var(--common-primary-10, rgba(46, 63, 94, 0.1))'

/** Total 행 구분선 - 이전 행 borderBottom과 겹치지 않도록 Total에만 적용 */
export const fmVolumeTableTotalRowCellSx: SystemStyleObject<Theme> = {
  borderTop: FM_VOLUME_TABLE_BORDER,
  borderBottom: FM_VOLUME_TABLE_TOTAL_ROW_BORDER,
  bgcolor: FM_VOLUME_TOTAL_CELL_BG,
}

/** Global 표 본문 셀 border/배경(Total 직전 행 이중선 방지 포함) */
export const fmVolumeGlobalBodyCellSx = (isTotal: boolean, nextIsTotal: boolean, isRegion = false): SystemStyleObject<Theme> => ({
  bgcolor: isTotal ? FM_VOLUME_TOTAL_CELL_BG : isRegion ? FM_VOLUME_SUBTOTAL_CELL_BG : 'commonColor.White',
  ...(nextIsTotal ? { borderBottom: 'none' } : {}),
  ...(isTotal ? fmVolumeTableTotalRowCellSx : {}),
})

/** Trade 표 본문 셀(Total 행 포함) */
export const fmVolumeTradeBodyCellSx = (
  isTotal: boolean,
  nextIsTotal: boolean,
  isRegion = false,
  isTotalColumn = false,
): SystemStyleObject<Theme> => ({
  bgcolor: isTotal || isTotalColumn ? FM_VOLUME_TOTAL_CELL_BG : isRegion ? FM_VOLUME_SUBTOTAL_CELL_BG : 'commonColor.White',
  ...(nextIsTotal ? { borderBottom: 'none' } : {}),
  ...(isTotal ? fmVolumeTableTotalRowCellSx : {}),
})

/** MI 표 가로 스크롤 영역용 얇은 스크롤바 */
export const miThinScrollbarSx: SystemStyleObject<Theme> = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#CED4DA transparent',
  '&::-webkit-scrollbar': {
    height: 4,
  },
  '&::-webkit-scrollbar-track': {
    bgcolor: 'transparent',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    bgcolor: 'gray.40',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    bgcolor: 'gray.50',
  },
}

/** MI 표 가로 스크롤 영역용 얇은 hover 스크롤바 */
export const miHoverThinScrollbarSx: SystemStyleObject<Theme> = {
  scrollbarWidth: 'thin',
  scrollbarColor: 'transparent transparent',
  '&::-webkit-scrollbar': {
    height: 4,
  },
  '&::-webkit-scrollbar-track': {
    bgcolor: 'transparent',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    bgcolor: 'transparent',
    borderRadius: '4px',
    transition: 'background-color 150ms ease',
  },
  '&:hover, &:focus-within': {
    scrollbarColor: '#CED4DA transparent',
    '&::-webkit-scrollbar-thumb': {
      bgcolor: 'gray.40',
    },
  },
  [`.${FM_VOLUME_TABLE_HOVER_SCROLL_CLASS}:hover &`]: {
    scrollbarColor: '#CED4DA transparent',
    '&::-webkit-scrollbar-thumb': {
      bgcolor: 'gray.40',
    },
  },
  '&::-webkit-scrollbar-thumb:hover': {
    bgcolor: 'gray.50',
  },
}

/** Volumes Table 루트 프레임 */
export const fmVolumeTableFrameSx: SystemStyleObject<Theme> = {
  width: '100%',
  minWidth: FM_VOLUME_TABLE_MIN_W,
  bgcolor: 'commonColor.White',
  overflow: 'clip',
}

export const mergeVolumeTableSx = (...parts: Array<SystemStyleObject<Theme> | SxProps<Theme> | undefined>): SxProps<Theme> =>
  parts.filter((part): part is SystemStyleObject<Theme> | SxProps<Theme> => part !== null) as SxProps<Theme>
