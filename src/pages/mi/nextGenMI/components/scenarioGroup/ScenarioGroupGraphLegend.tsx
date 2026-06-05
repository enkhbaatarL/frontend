import { Box, Stack, Typography } from '@mui/material'

import type { ScenarioGroupGraphLegendItem } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'

interface ScenarioGroupGraphLegendProps {
  baseItems: ScenarioGroupGraphLegendItem[]
  scenarioItems: ScenarioGroupGraphLegendItem[]
  visibilityMap: Map<string, boolean>
  hoveredKey: string | null
  onToggle: (visibilityKey: string) => void
  onHover: (visibilityKey: string | null) => void
}

const LegendSwatch = ({ color, isDashed, dimmed }: { color: string; isDashed: boolean; dimmed: boolean }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    width="26px"
    height="26px"
    flexShrink={0}
    sx={{ opacity: dimmed ? 0.5 : 1, transition: 'opacity 0.2s ease-in-out' }}
  >
    {isDashed ? (
      <Stack direction="row" alignItems="center" gap="2px">
        {[0, 1, 2].map((dot) => (
          <Box key={dot} width="5px" height="7px" borderRadius="100px" bgcolor={color} />
        ))}
      </Stack>
    ) : (
      <Box width="26px" height="6px" borderRadius="100px" bgcolor={color} />
    )}
  </Stack>
)

const ScenarioGroupGraphLegend = ({
  baseItems,
  scenarioItems,
  visibilityMap,
  hoveredKey,
  onToggle,
  onHover,
}: ScenarioGroupGraphLegendProps) => {
  const hasActiveHover = hoveredKey !== null

  const renderGroup = (title: string, items: ScenarioGroupGraphLegendItem[]) => {
    if (items.length === 0) return null

    return (
      <Stack width="100%" minWidth={0}>
        <Typography variant="body2SB14" color="contentText.Normal">
          {title}
        </Typography>
        {items.map((item) => {
          const isShow = item.executed && visibilityMap.get(item.visibilityKey) !== false
          const isHighlighted = hoveredKey === item.visibilityKey
          const dimmed = hasActiveHover && isShow && !isHighlighted

          return (
            <Stack
              key={item.visibilityKey}
              direction="row"
              alignItems="center"
              gap="8px"
              padding="6px"
              width="100%"
              minWidth={0}
              onMouseEnter={() => onHover(item.executed && isShow ? item.visibilityKey : null)}
              onMouseLeave={() => onHover(null)}
              onClick={() => item.executed && onToggle(item.visibilityKey)}
              sx={{
                cursor: item.executed ? 'pointer' : 'default',
                borderRadius: '8px',
                boxSizing: 'border-box',
                opacity: !item.executed ? 0.35 : isShow ? 1 : 0.35,
                transition: 'background-color 0.15s ease, opacity 0.2s ease-in-out',
                ...(item.executed &&
                  isShow && {
                  ...(isHighlighted ? { bgcolor: 'gray.10' } : {}),
                  '&:hover': { bgcolor: 'gray.10' },
                }),
              }}
            >
              <LegendSwatch color={item.color} isDashed={item.isDashed} dimmed={dimmed} />
              <Typography
                variant="body1M16"
                color={item.executed ? 'commonColor.Black' : 'contentText.Disabled'}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '1 1 0%' }}
              >
                {item.name}
              </Typography>
            </Stack>
          )
        })}
      </Stack>
    )
  }

  return (
    <Stack gap="12px" width="100%" minWidth={0}>
      {renderGroup('Base', baseItems)}
      {renderGroup('Scenarios', scenarioItems)}
    </Stack>
  )
}

export default ScenarioGroupGraphLegend
