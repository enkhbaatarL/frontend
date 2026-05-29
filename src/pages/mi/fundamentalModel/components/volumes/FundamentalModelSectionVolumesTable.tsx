import { Box, Stack, Typography } from '@mui/material'
import { memo, useCallback, useMemo, useRef } from 'react'

import type {
  FundamentalModelVolumesRegion,
  FundamentalModelVolumesRowKind,
  FundamentalModelVolumesType,
  IFundamentalModelVolumesColumn,
  IFundamentalModelVolumesRow,
} from '@/service/mi/fundamentalModel/case'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIFrozenColumnScrollLayout from '@/pages/mi/fundamentalModel/components/common/MIFrozenColumnScrollLayout'
import {
  FM_VOLUME_GLOBAL_COUNTRY_COL_W,
  FM_VOLUME_GLOBAL_FROZEN_W,
  FM_VOLUME_GLOBAL_SECTION_COL_W,
  FM_VOLUME_GLOBAL_TABLE_BODY_MAX_HEIGHT,
  FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H,
  FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
  FM_VOLUME_TABLE_BODY_H,
  FM_VOLUME_TABLE_BORDER,
  FM_VOLUME_TABLE_HEADER_H,
  fmVolumeGlobalBodyCellSx,
  fmVolumeHiddenHorizontalScrollbarSx,
  fmVolumeMonthColumnsWidth,
  fmVolumeResolvedMonthColumnWidth,
  fmVolumeTableBodyCellSx,
  fmVolumeTableFrameSx,
  fmVolumeTableHeaderCellSx,
  mergeVolumeTableSx,
  miThinScrollbarSx,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface FundamentalModelSectionVolumesTableProps {
  /** 시간축 컬럼(getVolumes columns) */
  columns: IFundamentalModelVolumesColumn[]
  /** 본문 행(getVolumes rows) - type 순서로 묶여서 응답되는 것을 가정 */
  rows: IFundamentalModelVolumesRow[]
}

/** type enum -> 섹션 표시용 라벨 (없으면 enum 자체를 노출) */
const VOLUME_TYPE_LABEL: Record<FundamentalModelVolumesType, string> = {
  DEMAND: 'Demand',
  PRODUCTION: 'Production',
  LNG_IMPORTS: 'LNG Imports',
  LNG_EXPORTS: 'LNG Exports',
  PIPELINE_IMPORTS: 'Pipeline Imports',
  PIPELINE_EXPORTS: 'Pipeline Exports',
}

/** region enum -> 표시 라벨(REGION_SUBTOTAL 행에서 사용) */
const VOLUME_REGION_LABEL: Record<FundamentalModelVolumesRegion, string> = {
  ASIA: 'Asia',
  EUROPE: 'Europe',
  NORTH_AMERICA: 'North America',
  MIDDLE_EAST: 'Middle East',
  AUSTRALIA: 'Australia',
  RUSSIA: 'Russia',
  AFRICA: 'Africa',
  SOUTH_AMERICA: 'South America',
}

const rowTypography = (kind: FundamentalModelVolumesRowKind) => {
  if (kind === 'COUNTRY') return { variant: 'body2R14' as const }
  return { variant: 'body2SB14' as const }
}

const formatVolumeCell = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return value.toFixed(1)
}

const resolveRowLabel = (row: IFundamentalModelVolumesRow): string => {
  if (row.rowKind === 'TYPE_TOTAL') return 'Total'
  if (row.rowKind === 'REGION_SUBTOTAL') return VOLUME_REGION_LABEL[row.region] ?? row.region
  return row.country ?? VOLUME_REGION_LABEL[row.region] ?? ''
}

interface SectionGroup {
  type: FundamentalModelVolumesType
  label: string
  rows: IFundamentalModelVolumesRow[]
}

interface SectionLabelLayout {
  labelRows: number
  totalRows: number
}

/** API rows를 type 순서대로 그룹핑(응답 순서 보존) */
const groupRowsByType = (rows: IFundamentalModelVolumesRow[]): SectionGroup[] => {
  const map = new Map<FundamentalModelVolumesType, SectionGroup>()
  const order: FundamentalModelVolumesType[] = []
  for (const row of rows) {
    if (!map.has(row.type)) {
      const label = VOLUME_TYPE_LABEL[row.type] ?? String(row.type)
      map.set(row.type, { type: row.type, label, rows: [] })
      order.push(row.type)
    }
    map.get(row.type)!.rows.push(row)
  }
  return order.map((type) => map.get(type)!)
}

/** 섹션 좌측 라벨 영역 - TYPE_TOTAL 직전까지가 라벨 표시 영역, 이후는 음영 처리 */
const getSectionLabelLayout = (sectionRows: IFundamentalModelVolumesRow[]): SectionLabelLayout => {
  if (sectionRows.length === 0) return { labelRows: 0, totalRows: 0 }
  const firstTotalIndex = sectionRows.findIndex((row) => row.rowKind === 'TYPE_TOTAL')
  if (firstTotalIndex < 0) return { labelRows: sectionRows.length, totalRows: 0 }
  const labelRows = firstTotalIndex === 0 ? 1 : firstTotalIndex
  const totalRows = Math.max(sectionRows.length - labelRows, 0)
  return { labelRows, totalRows }
}

const volumeBodyScrollWrapperProps = {
  maxHeight: FM_VOLUME_GLOBAL_TABLE_BODY_MAX_HEIGHT,
  scrollbarGap: 0,
  thumbInsetTop: 6,
  thumbInsetBottom: 6,
  thumbWidth: 4,
  showScrollbarOnHover: true,
  showScrollEdgeShadow: true,
  sx: {
    flex: '0 1 auto',
    width: '100%',
    minWidth: 0,
  },
  styScroll: { borderRadius: '1000px' },
} as const

/**
 * Global/LNG 세부 표(섹션+국가 고정열, 월 가로 스크롤)
 * - 데이터: getVolumes columns/rows API 직결
 * - 세로: ScrollWrapper(maxHeight), 콘텐츠 높이만큼만 차지
 * - 가로: 본문 바로 아래 트랙(표 프레임 내부), max-height 900px 초과 시 본문만 세로 스크롤
 */
const FundamentalModelSectionVolumesTable = memo(({ columns, rows }: FundamentalModelSectionVolumesTableProps) => {
  const sections = useMemo(() => groupRowsByType(rows), [rows])
  const monthLabels = useMemo(() => columns.map((column) => column.periodLabel), [columns])

  const monthColWidth = fmVolumeResolvedMonthColumnWidth(monthLabels.length, FM_VOLUME_GLOBAL_FROZEN_W)
  const monthScrollWidth = fmVolumeMonthColumnsWidth(monthLabels.length, monthColWidth)

  const headerMonthScrollRef = useRef<HTMLDivElement>(null)
  const bodyMonthScrollRef = useRef<HTMLDivElement>(null)
  const footerMonthScrollRef = useRef<HTMLDivElement>(null)
  const syncingHorizontalRef = useRef(false)

  const syncHorizontalScroll = useCallback((source: 'header' | 'body' | 'footer') => {
    if (syncingHorizontalRef.current) return
    const headerEl = headerMonthScrollRef.current
    const bodyEl = bodyMonthScrollRef.current
    const footerEl = footerMonthScrollRef.current
    if (!headerEl || !bodyEl || !footerEl) return

    syncingHorizontalRef.current = true
    const scrollLeft = source === 'footer' ? footerEl.scrollLeft : source === 'header' ? headerEl.scrollLeft : bodyEl.scrollLeft
    headerEl.scrollLeft = scrollLeft
    bodyEl.scrollLeft = scrollLeft
    footerEl.scrollLeft = scrollLeft
    syncingHorizontalRef.current = false
  }, [])

  const headerFrozen = (
    <Stack direction="row" sx={{ flexShrink: 0 }}>
      <Box sx={{ width: FM_VOLUME_GLOBAL_SECTION_COL_W, flexShrink: 0 }}>
        <Box sx={fmVolumeTableHeaderCellSx} />
      </Box>
      <Box sx={{ width: FM_VOLUME_GLOBAL_COUNTRY_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER }}>
        <Box sx={fmVolumeTableHeaderCellSx}>
          <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
            국가
          </Typography>
        </Box>
      </Box>
    </Stack>
  )

  const headerMonthColumns = (
    <Stack direction="row" alignItems="flex-start">
      {monthLabels.map((month, colIdx) => (
        <Stack key={`${month}-${colIdx}`} sx={{ width: monthColWidth, flexShrink: 0 }}>
          <Box sx={[fmVolumeTableHeaderCellSx, { justifyContent: 'flex-end' }]}>
            <Typography variant="tableHeaderSemibold" color="gray.60" noWrap sx={{ lineHeight: 1.4 }}>
              {month}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  )

  // 섹션 평탄화 - 행 인덱스 기반 nextIsTotal 판단을 위해 한 번 만들어 둠
  const flatRows: { sectionType: FundamentalModelVolumesType; row: IFundamentalModelVolumesRow }[] = []
  sections.forEach((section) => {
    section.rows.forEach((row) => flatRows.push({ sectionType: section.type, row }))
  })

  const bodyFrozenColumns = (
    <Stack direction="row" alignItems="flex-start" sx={{ flexShrink: 0 }}>
      <Stack sx={{ width: FM_VOLUME_GLOBAL_SECTION_COL_W, flexShrink: 0 }}>
        {sections.map((section) => {
          const layout = getSectionLabelLayout(section.rows)
          return (
            <Box key={section.type}>
              {layout.labelRows > 0 && (
                <Box
                  sx={{
                    height: layout.labelRows * FM_VOLUME_TABLE_BODY_H,
                    px: '12px',
                    py: '10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    bgcolor: 'commonColor.White',
                    borderBottom: layout.totalRows > 0 ? 'none' : FM_VOLUME_TABLE_BORDER,
                    boxSizing: 'border-box',
                  }}
                >
                  <Typography variant="body2SB14" color="gray.90" sx={{ whiteSpace: 'pre-wrap' }}>
                    {section.label}
                  </Typography>
                </Box>
              )}
              {Array.from({ length: layout.totalRows }).map((_, idx) => (
                <Box
                  key={`${section.type}-total-${idx}`}
                  sx={{
                    height: FM_VOLUME_TABLE_BODY_H,
                    bgcolor: 'gray.5',
                    borderTop: FM_VOLUME_TABLE_BORDER,
                    borderBottom: idx === layout.totalRows - 1 ? FM_VOLUME_TABLE_BORDER : 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ))}
            </Box>
          )
        })}
      </Stack>

      <Stack sx={{ width: FM_VOLUME_GLOBAL_COUNTRY_COL_W, flexShrink: 0, borderRight: FM_VOLUME_TABLE_BORDER, overflow: 'clip' }}>
        {flatRows.map(({ sectionType, row }, rowIdx) => {
          const nextIsTotal = flatRows[rowIdx + 1]?.row.rowKind === 'TYPE_TOTAL'
          const isTotal = row.rowKind === 'TYPE_TOTAL'
          return (
            <Box
              key={`${sectionType}-${row.region}-${row.rowKind}-${row.country ?? 'NA'}-${rowIdx}`}
              sx={[fmVolumeTableBodyCellSx, fmVolumeGlobalBodyCellSx(isTotal, nextIsTotal)]}
            >
              <Typography {...rowTypography(row.rowKind)} color="gray.90" noWrap sx={{ width: '100%' }}>
                {resolveRowLabel(row)}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Stack>
  )

  const bodyMonthColumns = (
    <Stack direction="row" alignItems="flex-start">
      {monthLabels.map((month, colIdx) => (
        <Stack key={`${month}-${colIdx}`} sx={{ width: monthColWidth, flexShrink: 0 }}>
          {flatRows.map(({ sectionType, row }, rowIdx) => {
            const nextIsTotal = flatRows[rowIdx + 1]?.row.rowKind === 'TYPE_TOTAL'
            const isTotal = row.rowKind === 'TYPE_TOTAL'
            return (
              <Box
                key={`${sectionType}-${row.region}-${row.rowKind}-${row.country ?? 'NA'}-${rowIdx}-${colIdx}`}
                sx={[fmVolumeTableBodyCellSx, fmVolumeGlobalBodyCellSx(isTotal, nextIsTotal), { justifyContent: 'flex-end' }]}
              >
                <Typography {...rowTypography(row.rowKind)} color="gray.90" noWrap sx={{ width: '100%', textAlign: 'right' }}>
                  {formatVolumeCell(row.values[colIdx])}
                </Typography>
              </Box>
            )
          })}
        </Stack>
      ))}
    </Stack>
  )

  const hiddenMonthScrollBoxProps = {
    sx: fmVolumeHiddenHorizontalScrollbarSx,
  } as const

  const tableBodyAreaMaxHeight = FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT - FM_VOLUME_TABLE_HEADER_H

  return (
    <Box
      sx={mergeVolumeTableSx(fmVolumeTableFrameSx, {
        maxHeight: FM_VOLUME_GLOBAL_TABLE_MAX_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      })}
    >
      <Box sx={{ flexShrink: 0 }}>
        <MIFrozenColumnScrollLayout
          frozen={headerFrozen}
          scrollable={headerMonthColumns}
          horizontalScrollRef={headerMonthScrollRef}
          scrollBoxProps={{
            ...hiddenMonthScrollBoxProps,
            onScroll: () => syncHorizontalScroll('header'),
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: tableBodyAreaMaxHeight,
        }}
      >
        <ScrollWrapper {...volumeBodyScrollWrapperProps} contentKey={flatRows.length}>
          <MIFrozenColumnScrollLayout
            frozen={bodyFrozenColumns}
            scrollable={bodyMonthColumns}
            horizontalScrollRef={bodyMonthScrollRef}
            scrollBoxProps={{
              ...hiddenMonthScrollBoxProps,
              onScroll: () => syncHorizontalScroll('body'),
            }}
          />
        </ScrollWrapper>

        <Box
          ref={footerMonthScrollRef}
          onScroll={() => syncHorizontalScroll('footer')}
          sx={mergeVolumeTableSx(
            {
              flexShrink: 0,
              height: FM_VOLUME_GLOBAL_TABLE_FOOTER_SCROLL_H,
              marginLeft: `${FM_VOLUME_GLOBAL_FROZEN_W}px`,
              overflowX: 'auto',
              overflowY: 'hidden',
            },
            miThinScrollbarSx,
          )}
        >
          <Box sx={{ width: monthScrollWidth, height: 1 }} aria-hidden />
        </Box>
      </Box>
    </Box>
  )
})

FundamentalModelSectionVolumesTable.displayName = 'FundamentalModelSectionVolumesTable'

export default FundamentalModelSectionVolumesTable
