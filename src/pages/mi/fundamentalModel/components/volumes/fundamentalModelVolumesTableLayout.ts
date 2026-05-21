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

/** 가로 스크롤바 숨김(하단 트랙만 표시할 때) */
export const fmVolumeHiddenHorizontalScrollbarSx: SystemStyleObject<Theme> = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
}

/** Trade 표 To country 고정열 너비 */
export const FM_VOLUME_TRADE_TO_COL_W = 160
export const FM_VOLUME_TRADE_FROM_COL_MIN_W = 90
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

/** 헤더 하단 구분선(gray.40 #CED4DA) */
export const FM_VOLUME_TABLE_HEADER_BORDER = '1px solid #CED4DA'

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

/** Total 행 상단 구분선 - 이전 행 borderBottom과 겹치지 않도록 Total에만 적용 */
export const fmVolumeTableTotalRowCellSx: SystemStyleObject<Theme> = {
  borderTop: FM_VOLUME_TABLE_BORDER,
  borderBottom: FM_VOLUME_TABLE_BORDER,
  bgcolor: 'gray.5',
}

/** Global 표 본문 셀 border/배경(Total 직전 행 이중선 방지 포함) */
export const fmVolumeGlobalBodyCellSx = (isTotal: boolean, nextIsTotal: boolean): SystemStyleObject<Theme> => ({
  bgcolor: isTotal ? 'gray.5' : 'commonColor.White',
  ...(nextIsTotal ? { borderBottom: 'none' } : {}),
  ...(isTotal ? fmVolumeTableTotalRowCellSx : {}),
})

/** Trade 표 본문 셀(Total 행 포함) */
export const fmVolumeTradeBodyCellSx = (isTotal: boolean, nextIsTotal: boolean): SystemStyleObject<Theme> => ({
  bgcolor: isTotal ? 'gray.5' : 'commonColor.White',
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

/** Volumes Table 루트 프레임 */
export const fmVolumeTableFrameSx: SystemStyleObject<Theme> = {
  width: '100%',
  minWidth: FM_VOLUME_TABLE_MIN_W,
  bgcolor: 'commonColor.White',
  overflow: 'clip',
}

export const mergeVolumeTableSx = (...parts: Array<SystemStyleObject<Theme> | SxProps<Theme> | undefined>): SxProps<Theme> =>
  parts.filter((part): part is SystemStyleObject<Theme> | SxProps<Theme> => part !== null) as SxProps<Theme>
