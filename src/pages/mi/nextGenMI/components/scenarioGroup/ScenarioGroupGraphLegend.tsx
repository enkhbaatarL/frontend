import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import type {
  ScenarioGroupGraphFilter,
  ScenarioGroupGraphLegendItem,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'

import VisibilityOffIcon from '@/components/common/icons/VisibilityOffIcon'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioGroupGraphFilterMenu from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupGraphFilterMenu'

interface ScenarioGroupGraphLegendProps {
  baseItems: ScenarioGroupGraphLegendItem[]
  scenarioItems: ScenarioGroupGraphLegendItem[]
  visibilityMap: Map<string, boolean>
  hoveredKey: string[] | null
  filter: ScenarioGroupGraphFilter
  onToggle: (toggleKeys: string[]) => void
  onFilterChange: (filter: ScenarioGroupGraphFilter) => void
  onHover: (visibilityKeys: string[] | null) => void
  onExecute: (scenarioId: number) => void
  executingScenarioIds: Set<number>
}

const DiscardedSwatch = () => (
  <Box component="svg" width="26px" height="4px" viewBox="0 0 26 4" sx={{ display: 'block' }} aria-hidden>
    <path d="M6.90723 4H3C1.34315 4 0 3.10457 0 2C0 0.895431 1.34315 0 3 0H12.9062L6.90723 4Z" fill="#CED4DA" />
    <path d="M23 0C24.6569 0 26 0.895431 26 2C26 3.10457 24.6569 4 23 4H13.3594L19.3594 0H23Z" fill="#CED4DA" />
  </Box>
)

const LegendItemLabel = ({
  name,
  detail,
  color,
  detailColor = 'contentText.Subtext',
}: {
  name: string
  detail?: string
  color: string
  detailColor?: string
}) => {
  const fullText = detail ? `${name} ${detail}` : name
  const { ref, isEllipsis } = useEllipsisDetection(fullText)
  const text = (
    <Typography
      ref={ref}
      variant="body1M16"
      noWrap
      color={color}
      sx={{ flex: '1 1 0%', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
    >
      {name}
      {detail ? (
        <Box component="span" sx={{ color: detailColor }}>
          {` ${detail}`}
        </Box>
      ) : null}
    </Typography>
  )

  if (!isEllipsis) return text

  return (
    <NextGenMIFollowCursorTooltip title={fullText}>
      <Box component="span" display="flex" minWidth={0} flex="1 1 0%">
        {text}
      </Box>
    </NextGenMIFollowCursorTooltip>
  )
}

const LegendIndicator = ({ item }: { item: ScenarioGroupGraphLegendItem }) => {
  if (item.variant === 'discarded') {
    return (
      <Stack width="26px" height="26px" alignItems="center" justifyContent="center" flexShrink={0}>
        <DiscardedSwatch />
      </Stack>
    )
  }

  if (item.variant === 'nonExecuted') {
    return (
      <Stack width="26px" height="26px" alignItems="center" justifyContent="center" flexShrink={0}>
        <Box width="26px" height="4px" borderRadius="100px" border="1px solid" borderColor="gray.40" sx={{ boxSizing: 'border-box' }} />
      </Stack>
    )
  }

  return (
    <Stack width="26px" height="26px" alignItems="center" justifyContent="center" flexShrink={0}>
      <Box width="26px" height="4px" borderRadius="100px" bgcolor={item.color} />
    </Stack>
  )
}

const StatusBadge = ({ label, tone }: { label: string; tone: 'nonExecuted' | 'discarded' | 'realized' }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
    padding="2px 6px"
    borderRadius="8px"
    border="1px solid"
    bgcolor={tone === 'discarded' ? 'gray.10' : 'gray.5'}
    borderColor={tone === 'realized' ? 'mari.Primary' : tone === 'discarded' ? 'contentBorder.Disabled' : 'contentBorder.Normal'}
  >
    <Typography
      color={tone === 'realized' ? 'mari.Primary' : 'contentText.Disabled'}
      sx={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4, letterSpacing: '-0.26px', whiteSpace: 'nowrap' }}
    >
      {label}
    </Typography>
  </Stack>
)

const ExecuteButton = ({ onClick }: { onClick: () => void }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      height: '22px',
      minWidth: '46px',
      padding: '4px 6px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: 'commonColor.Primary',
      cursor: 'pointer',
    }}
  >
    <Typography
      sx={{
        fontSize: '13px',
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: '-0.26px',
        color: 'commonColor.White',
        whiteSpace: 'nowrap',
      }}
    >
      실행
    </Typography>
  </Box>
)

const ExecutingBadge = () => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="center"
    gap="4px"
    flexShrink={0}
    height="22px"
    padding="2px 6px"
    borderRadius="8px"
    border="1px solid"
    bgcolor="gray.10"
    borderColor="contentBorder.Disabled"
  >
    <CircularProgress size={14} sx={{ color: 'contentText.Disabled' }} />
    <Typography
      sx={{
        fontSize: '13px',
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: '-0.26px',
        color: 'contentText.Disabled',
        whiteSpace: 'nowrap',
      }}
    >
      실행 중
    </Typography>
  </Stack>
)

const ScenarioGroupGraphLegend = ({
  baseItems,
  scenarioItems,
  visibilityMap,
  hoveredKey: _hoveredKey,
  filter,
  onToggle,
  onFilterChange,
  onHover,
  onExecute,
  executingScenarioIds,
}: ScenarioGroupGraphLegendProps) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const renderItems = (items: ScenarioGroupGraphLegendItem[]) =>
    items.map((item) => {
      const interactive = item.variant === 'line'
      const isNonExecuted = item.variant === 'nonExecuted'
      const isHidden = interactive && item.toggleKeys.length > 0 && item.toggleKeys.every((key) => visibilityMap.get(key) === false)
      const isHovered = hoveredRow === item.visibilityKey
      const showEye = interactive && ((isHovered && hoveredIcon === item.visibilityKey) || isHidden)
      const executing = item.scenarioId !== undefined && executingScenarioIds.has(item.scenarioId)
      const showExecuteButton = isNonExecuted && hoveredAction === item.visibilityKey && !executing
      const itemTextEnabled = interactive || (isNonExecuted && isHovered && !executing)

      return (
        <Stack
          key={item.visibilityKey}
          direction="row"
          alignItems="center"
          gap="8px"
          padding="6px"
          width="100%"
          minWidth={0}
          onMouseEnter={() => {
            setHoveredRow(item.visibilityKey)
            setHoveredIcon(null)
            setHoveredAction(null)
            if (interactive && !isHidden) onHover(item.toggleKeys)
          }}
          onMouseLeave={() => {
            setHoveredRow(null)
            setHoveredIcon(null)
            setHoveredAction(null)
            onHover(null)
          }}
          sx={{
            borderRadius: '10px',
            boxSizing: 'border-box',
            opacity: isHidden ? 0.45 : 1,
            transition: 'background-color 0.15s ease, opacity 0.2s ease-in-out',
            bgcolor: (interactive || isNonExecuted) && isHovered ? 'gray.20' : 'transparent',
          }}
        >
          <Stack
            width="26px"
            height="26px"
            flexShrink={0}
            alignItems="center"
            justifyContent="center"
            onMouseEnter={() => {
              if (interactive) setHoveredIcon(item.visibilityKey)
            }}
            onMouseLeave={() => setHoveredIcon((current) => (current === item.visibilityKey ? null : current))}
          >
            {showEye ? (
              <Box
                component="button"
                type="button"
                aria-label={`${item.detail ? `${item.name} ${item.detail}` : item.name} 표시 전환`}
                onClick={() => onToggle(item.toggleKeys)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <VisibilityOffIcon width={24} height={24} />
              </Box>
            ) : (
              <LegendIndicator item={item} />
            )}
          </Stack>
          <Stack direction="row" alignItems="center" gap="8px" minWidth={0} sx={{ flex: '1 1 0%', userSelect: 'none' }}>
            {item.displayOrder !== undefined && <NextGenMIDisplayOrderBadge value={item.displayOrder} disabled={!itemTextEnabled} />}
            {item.detail ? (
              <LegendItemLabel
                name={item.name}
                detail={item.detail}
                color={itemTextEnabled ? (interactive ? 'contentText.Black' : 'contentText.Normal') : 'contentText.Disabled'}
                detailColor={itemTextEnabled ? 'contentText.Subtext' : 'contentText.Disabled'}
              />
            ) : (
              <NextGenMITableBodyText
                value={item.name}
                variant="body1M16"
                color={itemTextEnabled ? (interactive ? 'contentText.Black' : 'contentText.Normal') : 'contentText.Disabled'}
                tooltipWhenTruncated
                sx={{ flex: '1 1 0%' }}
              />
            )}
          </Stack>
          {executing ? (
            <ExecutingBadge />
          ) : isNonExecuted ? (
            <Stack
              flexShrink={0}
              onMouseEnter={() => setHoveredAction(item.visibilityKey)}
              onMouseLeave={() => setHoveredAction((current) => (current === item.visibilityKey ? null : current))}
            >
              {showExecuteButton ? (
                <ExecuteButton onClick={() => item.scenarioId !== undefined && onExecute(item.scenarioId)} />
              ) : (
                <StatusBadge label="미실행" tone="nonExecuted" />
              )}
            </Stack>
          ) : (
            item.statusLabel && <StatusBadge label={item.statusLabel} tone={item.realized ? 'realized' : 'discarded'} />
          )}
        </Stack>
      )
    })

  return (
    <Stack gap="12px" width="100%" minWidth={0}>
      {baseItems.length > 0 && (
        <Stack width="100%" minWidth={0}>
          <Typography variant="body2SB14" color="contentText.Normal" sx={{ padding: '4px 8px' }}>
            Base
          </Typography>
          {renderItems(baseItems)}
        </Stack>
      )}

      <Stack width="100%" minWidth={0}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap="8px"
          width="100%"
          sx={{ padding: '4px 8px', boxSizing: 'border-box' }}
        >
          <Typography variant="body2SB14" color="contentText.Normal">
            Scenarios
          </Typography>
          <ScenarioGroupGraphFilterMenu filter={filter} onChange={onFilterChange} />
        </Stack>
        {renderItems(scenarioItems)}
      </Stack>
    </Stack>
  )
}

export default ScenarioGroupGraphLegend
