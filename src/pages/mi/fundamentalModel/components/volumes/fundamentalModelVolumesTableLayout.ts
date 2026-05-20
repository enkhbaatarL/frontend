import type { SxProps } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import type { SystemStyleObject } from '@mui/system'

/** Volumes Table 컴포넌트 최소 너비 */
export const FM_VOLUME_TABLE_MIN_W = 960

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

export const fmVolumeMonthColumnsWidth = (monthCount: number) => monthCount * FM_VOLUME_MONTH_COL_W

/** 가로 스크롤바 숨김(하단 트랙만 표시할 때) */
export const fmVolumeHiddenHorizontalScrollbarSx: SystemStyleObject<Theme> = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
}

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
