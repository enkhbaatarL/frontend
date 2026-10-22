import { Box, Divider, Stack, Typography } from '@mui/material'
import { forwardRef } from 'react'
import { createPortal } from 'react-dom'

import AdjustedLineIcon from '@/components/common/icons/AdjustedLineIcon'
import BaseCaseLineIcon from '@/components/common/icons/BaseCaseLineIcon'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import { formatValue } from '@/utils/number'

export interface ScenarioSummaryTooltipContent {
  label?: string
  labelDetail?: string
  value?: number
  color?: string
  date: string
  startDate?: string
  toFixed?: number
  isForecast?: boolean
  goodsDataSourceNo?: number
  visibilityKey?: string
  badge?: 'BC' | 'UA'
  displayOrder?: number
}

interface ScenarioSummaryChartTooltipProps {
  visible?: boolean
  top?: number
  left?: number
  content: Record<string, ScenarioSummaryTooltipContent>
  visibility?: 'visible' | 'hidden'
  targetLabel?: string
  highlightVisibilityKey?: string | string[] | null
}

const TOOLTIP_COLUMN_WIDTH = 252
const ITEMS_PER_COLUMN = 25
const COLUMN_GAP_PX = 10

type TooltipDisplayRow =
  | {
      type: 'divider'
    }
  | {
      type: 'item'
      item: ScenarioSummaryTooltipContent
    }

const chunkItems = <T,>(list: T[], size: number): T[][] => {
  if (size <= 0) return [list]
  const chunks: T[][] = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}

const isBaseTooltipItem = (item: ScenarioSummaryTooltipContent) => item.visibilityKey?.trim().startsWith('base:') === true

const isScenarioTooltipItem = (item: ScenarioSummaryTooltipContent) => item.visibilityKey?.trim().startsWith('scenario:') === true

const ScenarioSummaryTooltipBadge = ({ label, dimmed = false }: { label: 'BC' | 'UA'; dimmed?: boolean }) => (
  <Box
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
    height="16px"
    padding="0 4px"
    border="1px solid"
    borderColor="gray.70"
    borderRadius="4px"
    boxSizing="border-box"
    color="gray.70"
    sx={{ opacity: dimmed ? 0.5 : 1, transition: 'opacity 0.15s ease' }}
  >
    <Typography
      color="inherit"
      sx={{
        fontSize: '11px',
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: '-0.22px',
        fontVariantNumeric: 'lining-nums tabular-nums',
      }}
    >
      {label}
    </Typography>
  </Box>
)

const buildTooltipDisplayRows = (items: ScenarioSummaryTooltipContent[]): TooltipDisplayRow[] => {
  if (!items.some(isBaseTooltipItem) || !items.some(isScenarioTooltipItem)) {
    return items.map((item) => ({ type: 'item', item }))
  }

  const rows: TooltipDisplayRow[] = []
  let hasSeenBase = false
  let dividerInserted = false

  items.forEach((item) => {
    if (isBaseTooltipItem(item)) {
      hasSeenBase = true
    }
    if (hasSeenBase && !dividerInserted && isScenarioTooltipItem(item)) {
      rows.push({ type: 'divider' })
      dividerInserted = true
    }
    rows.push({ type: 'item', item })
  })

  return rows
}

const ScenarioSummaryChartTooltip = forwardRef<HTMLDivElement, Readonly<ScenarioSummaryChartTooltipProps>>(
  ({ visible, top, left, content, visibility = 'visible', targetLabel, highlightVisibilityKey = null }, ref) => {
    if (!visible) return null

    const items = Object.entries(content)
      .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
      .map(([, value]) => value)
      .filter((item) => item.label)

    if (items.length === 0) return null

    const columns = chunkItems(buildTooltipDisplayRows(items), ITEMS_PER_COLUMN)
    const tooltipWidth = columns.length * TOOLTIP_COLUMN_WIDTH + Math.max(0, columns.length - 1) * COLUMN_GAP_PX + 16
    const highlightKeySet = new Set(
      (Array.isArray(highlightVisibilityKey) ? highlightVisibilityKey : highlightVisibilityKey ? [highlightVisibilityKey] : [])
        .map((key) => key.trim())
        .filter(Boolean),
    )

    const tooltipNode = (
      <Stack
        ref={ref}
        sx={{
          position: 'fixed',
          top,
          left,
          width: tooltipWidth,
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: 1600,
          gap: '4px',
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid',
          borderColor: 'contentBorder.Normal',
          bgcolor: 'commonColor.White',
          boxShadow: '0 0 2px 0 rgba(0, 0, 0, 0.1)',
          visibility,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent={targetLabel ? 'space-between' : 'flex-start'}
          sx={{
            width: '100%',
            boxSizing: 'border-box',
            gap: '8px',
            padding: '0 4px',
          }}
        >
          <Typography
            sx={{
              color: 'contentText.Normal',
              fontSize: '13px',
              fontWeight: 500,
              lineHeight: 1.4,
              letterSpacing: '-0.26px',
              fontVariantNumeric: 'lining-nums tabular-nums',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {items[0]?.date || '-'}
          </Typography>
          {targetLabel ? (
            <Typography
              sx={{
                color: 'contentText.Normal',
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: 1.4,
                letterSpacing: '-0.26px',
                fontVariantNumeric: 'lining-nums tabular-nums',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {targetLabel}
            </Typography>
          ) : null}
        </Stack>

        <Stack direction="row" width="100%" boxSizing="border-box" sx={{ gap: `${COLUMN_GAP_PX}px` }}>
          {columns.map((columnItems, columnIndex) => (
            <Stack
              key={`tooltip-col-${columnIndex}`}
              width={TOOLTIP_COLUMN_WIDTH}
              minWidth={0}
              boxSizing="border-box"
              gap="0px"
              sx={{ flex: `0 0 ${TOOLTIP_COLUMN_WIDTH}px` }}
            >
              {columnItems.map((row, rowIndexInColumn) => {
                const index = columnIndex * ITEMS_PER_COLUMN + rowIndexInColumn
                if (row.type === 'divider') {
                  return <Divider key={`tooltip-divider-${index}`} flexItem sx={{ borderColor: 'contentBorder.Normal', my: '4px' }} />
                }

                const item = row.item
                const hasActiveHighlight = highlightKeySet.size > 0
                const itemKey = typeof item.visibilityKey === 'string' ? item.visibilityKey.trim() : ''
                const isRowStrong = hasActiveHighlight && itemKey !== '' && highlightKeySet.has(itemKey)
                const rowDimmed = hasActiveHighlight && itemKey !== '' && !isRowStrong

                return (
                  <Stack
                    key={`${item.label}-${index}`}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap="8px"
                    padding="4px 6px"
                    width="100%"
                    minWidth={0}
                    boxSizing="border-box"
                    sx={{
                      opacity: rowDimmed ? 0.45 : 1,
                      transition: 'opacity 0.15s ease-in-out',
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap="4px" minWidth={0} flex="1 1 auto">
                      <Box
                        width="12px"
                        height="16px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        color={item.color ?? '#ADB5BD'}
                        sx={{ opacity: rowDimmed ? 0.5 : 1, transition: 'opacity 0.15s ease' }}
                      >
                        {item.badge === 'UA' ? <AdjustedLineIcon /> : <BaseCaseLineIcon />}
                      </Box>
                      {item.displayOrder !== undefined ? (
                        <NextGenMIDisplayOrderBadge value={item.displayOrder} height="16px" borderRadius="4px" />
                      ) : null}
                      {item.badge ? <ScenarioSummaryTooltipBadge label={item.badge} dimmed={rowDimmed} /> : null}
                      <Typography
                        color={rowDimmed ? 'contentText.Subtext' : 'contentText.Black'}
                        sx={{
                          fontSize: '13px',
                          fontWeight: isRowStrong ? 600 : 500,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        }}
                      >
                        {item.label}
                        {item.labelDetail ? (
                          <Box component="span" sx={{ color: rowDimmed ? 'inherit' : 'contentText.Subtext' }}>
                            {` ${item.labelDetail}`}
                          </Box>
                        ) : null}
                      </Typography>
                    </Stack>
                    <Typography
                      color={rowDimmed ? 'contentText.Subtext' : 'contentText.Black'}
                      sx={{
                        minWidth: '40px',
                        flexShrink: 0,
                        textAlign: 'right',
                        fontSize: '13px',
                        fontWeight: 500,
                        lineHeight: 1.4,
                        fontVariantNumeric: 'lining-nums tabular-nums',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.value === undefined ? '-' : formatValue(item.value, '', 'en-US', item.toFixed)}
                    </Typography>
                  </Stack>
                )
              })}
            </Stack>
          ))}
        </Stack>
      </Stack>
    )

    if (typeof document === 'undefined') return tooltipNode

    return createPortal(tooltipNode, document.body)
  },
)

ScenarioSummaryChartTooltip.displayName = 'ScenarioSummaryChartTooltip'

export default ScenarioSummaryChartTooltip
