import { Box, Stack, Typography } from '@mui/material'
import { forwardRef } from 'react'
import { createPortal } from 'react-dom'

import { formatValue } from '@/utils/number'

export interface ScenarioSummaryTooltipContent {
  label?: string
  value?: number
  color?: string
  date: string
  startDate?: string
  toFixed?: number
  isForecast?: boolean
  goodsDataSourceNo?: number
  visibilityKey?: string
}

interface ScenarioSummaryChartTooltipProps {
  visible?: boolean
  top?: number
  left?: number
  content: Record<string, ScenarioSummaryTooltipContent>
  visibility?: 'visible' | 'hidden'
  targetLabel?: string
  highlightVisibilityKey?: string | null
}

const TOOLTIP_COLUMN_WIDTH = 240
const ITEMS_PER_COLUMN = 25
const COLUMN_GAP_PX = 10

const chunkItems = <T,>(list: T[], size: number): T[][] => {
  if (size <= 0) return [list]
  const chunks: T[][] = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}

const ScenarioSummaryChartTooltip = forwardRef<HTMLDivElement, Readonly<ScenarioSummaryChartTooltipProps>>(
  ({ visible, top, left, content, visibility = 'visible', targetLabel, highlightVisibilityKey = null }, ref) => {
    if (!visible) return null

    const items = Object.entries(content)
      .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB))
      .map(([, value]) => value)
      .filter((item) => item.label)

    if (items.length === 0) return null

    const columns = chunkItems(items, ITEMS_PER_COLUMN)
    const tooltipWidth = columns.length * TOOLTIP_COLUMN_WIDTH + Math.max(0, columns.length - 1) * COLUMN_GAP_PX

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
          borderRadius: '4px',
          border: '1px solid',
          borderColor: 'contentBorder.Normal',
          bgcolor: 'commonColor.White',
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
            height: 30,
            px: '12px',
            color: 'contentText.Black',
          }}
        >
          <Typography
            variant="body3SB12"
            color="inherit"
            sx={{
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
              variant="body3SB12"
              color="inherit"
              sx={{
                fontVariantNumeric: 'lining-nums tabular-nums',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                ml: '8px',
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
              gap="4px"
              px="12px"
              py="6px"
              sx={{ flex: `0 0 ${TOOLTIP_COLUMN_WIDTH}px` }}
            >
              {columnItems.map((item, rowIndexInColumn) => {
                const index = columnIndex * ITEMS_PER_COLUMN + rowIndexInColumn
                const highlightKey = highlightVisibilityKey?.trim() ?? ''
                const hasActiveHighlight = highlightKey !== ''
                const itemKey = typeof item.visibilityKey === 'string' ? item.visibilityKey.trim() : ''
                const rowDimmed = hasActiveHighlight && itemKey !== '' && itemKey !== highlightKey
                const isRowStrong = hasActiveHighlight && itemKey !== '' && itemKey === highlightKey

                return (
                  <Stack
                    key={`${item.label}-${index}`}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                    minWidth={0}
                    sx={{
                      opacity: rowDimmed ? 0.45 : 1,
                      transition: 'opacity 0.15s ease-in-out',
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap="8px" minWidth={0} flex="1 1 auto">
                      <Box width={18} height={26} display="flex" alignItems="center" flexShrink={0}>
                        <Box
                          width={18}
                          height={isRowStrong ? 5 : 4}
                          borderRadius="100px"
                          bgcolor={item.color ?? 'gray.50'}
                          sx={{ opacity: rowDimmed ? 0.5 : 1, transition: 'height 0.15s ease, opacity 0.15s ease' }}
                        />
                      </Box>
                      <Typography
                        variant={isRowStrong ? 'body3SB12' : 'body3M12'}
                        color={rowDimmed ? 'contentText.Subtext' : 'contentText.Normal'}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body3M12"
                      color={rowDimmed ? 'contentText.Subtext' : 'commonColor.Black'}
                      sx={{
                        width: 40,
                        flexShrink: 0,
                        textAlign: 'right',
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
