import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import PercentRoundedIcon from '@mui/icons-material/PercentRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import { Dialog, DialogActions, DialogContent, Divider, Skeleton, Stack, Typography, type TypographyProps } from '@mui/material'
import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import MIInputErrorIcon from '@/components/common/input/MIInputErrorIcon'
import MIMenu from '@/components/common/menu/MIMenu'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import useSnackbar from '@/hooks/useSnackbar'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import {
  getScenarioDesignColumnDisplayValue,
  SCENARIO_DESIGN_REVIEW_DEFAULT_NARRATIVE,
  type ScenarioDesignColumn,
  type ScenarioDesignRow,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/scenarioDesignModel'

const SCENARIO_DESIGN_REVIEW_DEFAULT_GROUP_NAME = 'Agent에 의해 시나리오 그룹명이 생성'
const SCENARIO_DESIGN_REVIEW_DEFAULT_SIGNPOST_LABEL = '호르무즈 동향 건별 협의 재개 보도 지속'
const SCENARIO_DESIGN_REVIEW_CARD_DEFAULT_WIDTH = 400
const SCENARIO_DESIGN_REVIEW_CARD_MIN_WIDTH = 320
const SCENARIO_DESIGN_REVIEW_CARD_MAX_WIDTH = 720
const SCENARIO_DESIGN_REVIEW_SPLITTER_WIDTH = 12

type ScenarioDesignReviewSignpostImpact = 'veryHigh' | 'high' | 'medium' | 'low' | 'veryLow'

type ScenarioDesignReviewCreateValue = {
  scenarioGroupName: string
  scenarioGroupDescription: string
  scenarioNarratives: Array<{ rowId: number; narrative: string }>
  scenarioPossibilities: Array<{ rowId: number; possibility: number }>
}

const scenarioDesignReviewSignpostImpactItems: Array<{ value: ScenarioDesignReviewSignpostImpact; label: string }> = [
  { value: 'veryHigh', label: '매우 높음' },
  { value: 'high', label: '높음' },
  { value: 'medium', label: '중간' },
  { value: 'low', label: '낮음' },
  { value: 'veryLow', label: '매우 낮음' },
]

const createScenarioDesignReviewInitialPossibilities = (rows: ScenarioDesignRow[]) => {
  const nextPossibilities: Record<number, string> = {}
  if (rows.length === 0) return nextPossibilities

  const recommendedRow = rows.length > 1 ? rows.find((row) => row.recommended) : undefined
  const remainingRows = recommendedRow ? rows.filter((row) => row.id !== recommendedRow.id) : rows
  const remainingTotal = recommendedRow ? 70 : 100
  const basePossibility = Math.floor(remainingTotal / remainingRows.length)
  const remainder = remainingTotal % remainingRows.length

  remainingRows.forEach((row, index) => {
    nextPossibilities[row.id] = String(basePossibility + (index < remainder ? 1 : 0))
  })

  if (recommendedRow) {
    nextPossibilities[recommendedRow.id] = '30'
  }

  return nextPossibilities
}

const createScenarioDesignReviewInitialNarratives = (rows: ScenarioDesignRow[], narrative: string) => {
  const nextNarratives: Record<number, string> = {}

  rows.forEach((row) => {
    nextNarratives[row.id] = narrative
  })

  return nextNarratives
}

const createScenarioDesignReviewCardWidths = (rows: ScenarioDesignRow[], currentWidths: Record<number, number> = {}) => {
  const nextWidths: Record<number, number> = {}

  rows.forEach((row) => {
    nextWidths[row.id] = currentWidths[row.id] ?? SCENARIO_DESIGN_REVIEW_CARD_DEFAULT_WIDTH
  })

  return nextWidths
}

const getScenarioDesignReviewCardWidthChangeCapacity = (width: number, direction: number) =>
  direction > 0 ? SCENARIO_DESIGN_REVIEW_CARD_MAX_WIDTH - width : width - SCENARIO_DESIGN_REVIEW_CARD_MIN_WIDTH

const getScenarioDesignReviewCardWidthChangeCapacityTotal = (rows: ScenarioDesignRow[], widths: Record<number, number>, change: number) => {
  const direction = Math.sign(change)
  if (direction === 0) return 0

  return rows.reduce((total, row) => total + Math.max(getScenarioDesignReviewCardWidthChangeCapacity(widths[row.id], direction), 0), 0)
}

const applyScenarioDesignReviewCardWidthChange = (
  rows: ScenarioDesignRow[],
  sourceWidths: Record<number, number>,
  targetWidths: Record<number, number>,
  change: number,
) => {
  const direction = Math.sign(change)
  if (direction === 0) return

  let remainingChange = Math.abs(change)
  let adjustableRows = rows
    .map((row) => ({
      row,
      capacity: Math.max(getScenarioDesignReviewCardWidthChangeCapacity(sourceWidths[row.id], direction), 0),
    }))
    .filter(({ capacity }) => capacity > 0)

  while (remainingChange > 0.0001 && adjustableRows.length > 0) {
    const changePerRow = remainingChange / adjustableRows.length
    const nextAdjustableRows: Array<{ row: ScenarioDesignRow; capacity: number }> = []

    adjustableRows.forEach(({ row, capacity }) => {
      const appliedChange = Math.min(changePerRow, capacity)
      targetWidths[row.id] += direction * appliedChange
      remainingChange -= appliedChange

      const nextCapacity = capacity - appliedChange
      if (nextCapacity > 0.0001) {
        nextAdjustableRows.push({ row, capacity: nextCapacity })
      }
    })

    adjustableRows = nextAdjustableRows
  }
}

const roundScenarioDesignReviewCardWidths = (rows: ScenarioDesignRow[], widths: Record<number, number>, targetTotal: number) => {
  let assignedTotal = 0

  rows.forEach((row, index) => {
    const width = index === rows.length - 1 ? Math.round((targetTotal - assignedTotal) * 100) / 100 : Math.round(widths[row.id] * 100) / 100

    widths[row.id] = width
    assignedTotal += width
  })
}

const getScenarioDesignReviewResizedCardWidths = (
  rows: ScenarioDesignRow[],
  widths: Record<number, number>,
  splitterIndex: number,
  delta: number,
) => {
  const leftRows = rows.slice(0, splitterIndex + 1)
  const rightRows = rows.slice(splitterIndex + 1)
  if (leftRows.length === 0 || rightRows.length === 0) return widths

  const direction = Math.sign(delta)
  if (direction === 0) return widths

  const constrainedDelta =
    direction *
    Math.min(
      Math.abs(delta),
      getScenarioDesignReviewCardWidthChangeCapacityTotal(leftRows, widths, delta),
      getScenarioDesignReviewCardWidthChangeCapacityTotal(rightRows, widths, -delta),
    )
  const nextWidths = { ...widths }

  applyScenarioDesignReviewCardWidthChange(leftRows, widths, nextWidths, constrainedDelta)
  applyScenarioDesignReviewCardWidthChange(rightRows, widths, nextWidths, -constrainedDelta)
  roundScenarioDesignReviewCardWidths(
    leftRows,
    nextWidths,
    leftRows.reduce((total, row) => total + widths[row.id], constrainedDelta),
  )
  roundScenarioDesignReviewCardWidths(
    rightRows,
    nextWidths,
    rightRows.reduce((total, row) => total + widths[row.id], -constrainedDelta),
  )

  return nextWidths
}

const getScenarioDesignReviewPossibilityTotal = (possibilities: Record<number, string>) =>
  Object.values(possibilities).reduce((total, value) => total + (Number(value) || 0), 0)

const getScenarioDesignReviewPixelValue = (value?: string) => {
  const pixelValue = value ? Number.parseFloat(value) : Number.NaN
  return Number.isFinite(pixelValue) ? pixelValue : undefined
}

const getScenarioDesignReviewScrollThumbSizePercent = (clientWidth: number, scrollWidth: number) =>
  scrollWidth > 0 ? Math.max((clientWidth / scrollWidth) * 100, 8) : 0

const getScenarioDesignReviewScrollThumbPositionPercent = (
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
  thumbWidth: number,
) => (scrollWidth > clientWidth ? (scrollLeft / (scrollWidth - clientWidth)) * (100 - thumbWidth) : 0)

const useScenarioDesignReviewResizableHeight = (initialHeight: string, minResizeHeight: string, maxHeight?: string, resetKey?: number) => {
  const [height, setHeight] = useState(initialHeight)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    setHeight(initialHeight)
  }, [initialHeight, resetKey])

  const handleResizeStart = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const startY = event.clientY
    const startHeight = event.currentTarget.parentElement?.getBoundingClientRect().height ?? getScenarioDesignReviewPixelValue(height) ?? 0
    const minHeightValue = getScenarioDesignReviewPixelValue(minResizeHeight) ?? 0
    const maxHeightValue = getScenarioDesignReviewPixelValue(maxHeight)
    const previousUserSelect = document.body.style.userSelect

    setIsResizing(true)
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextHeight = startHeight + moveEvent.clientY - startY
      const clampedHeight = Math.max(minHeightValue, maxHeightValue ? Math.min(nextHeight, maxHeightValue) : nextHeight)

      setHeight(`${Math.round(clampedHeight)}px`)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return { height, isResizing, handleResizeStart }
}

const ScenarioDesignReviewResizeHandle = ({
  disabled,
  onMouseDown,
}: {
  disabled?: boolean
  onMouseDown: (event: ReactMouseEvent<HTMLElement>) => void
}) => (
  <Stack
    component="span"
    aria-hidden
    className="scenario-design-review-resize-handle"
    position="absolute"
    right="6px"
    bottom="4px"
    width="16px"
    height="16px"
    color={disabled ? '#CED4DA' : '#868E96'}
    onMouseDown={disabled ? undefined : onMouseDown}
    sx={{
      cursor: disabled ? 'default' : 'ns-resize',
      pointerEvents: disabled ? 'none' : 'auto',
      zIndex: 2,
    }}
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 10L10 14M14 5.33333L5.33333 14"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Stack>
)

const ScenarioDesignReviewResizableTextarea = ({
  value,
  maxLength,
  minHeight,
  minResizeHeight = minHeight,
  maxHeight,
  resetKey,
  disabled,
  ariaLabel,
  borderColor = 'contentBorder.Normal',
  bgcolor = 'commonColor.White',
  color = 'contentText.Normal',
  fontSize = '14px',
  fontWeight = 500,
  padding = '20px',
  hoverBgcolor,
  onBlur,
  onChange,
}: {
  value: string
  maxLength: number
  minHeight: string
  minResizeHeight?: string
  maxHeight?: string
  resetKey?: number
  disabled?: boolean
  ariaLabel?: string
  borderColor?: string
  bgcolor?: string
  color?: string
  fontSize?: string
  fontWeight?: number
  padding?: string
  hoverBgcolor?: string
  onBlur?: () => void
  onChange?: (value: string) => void
}) => {
  const { height, isResizing, handleResizeStart } = useScenarioDesignReviewResizableHeight(minHeight, minResizeHeight, maxHeight, resetKey)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollbarTrackRef = useRef<HTMLSpanElement | null>(null)
  const scrollbarSyncFrameRef = useRef(0)
  const [scrollbarState, setScrollbarState] = useState({ visible: false, thumbHeight: 0, thumbTop: 0 })
  const activeBgcolor = disabled ? bgcolor : 'gray.5'

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return undefined

    const syncScrollbar = () => {
      const scrollableHeight = textarea.scrollHeight - textarea.clientHeight
      const trackHeight = scrollbarTrackRef.current?.clientHeight ?? 0
      const visible = scrollableHeight > 1 && trackHeight > 0
      const thumbHeight = visible ? Math.max((textarea.clientHeight / textarea.scrollHeight) * trackHeight, 20) : 0
      const thumbTop = visible ? (textarea.scrollTop / scrollableHeight) * Math.max(trackHeight - thumbHeight, 0) : 0

      setScrollbarState((current) =>
        current.visible === visible && current.thumbHeight === thumbHeight && current.thumbTop === thumbTop
          ? current
          : { visible, thumbHeight, thumbTop },
      )
    }

    const scheduleSync = () => {
      if (scrollbarSyncFrameRef.current) return

      scrollbarSyncFrameRef.current = globalThis.requestAnimationFrame(() => {
        scrollbarSyncFrameRef.current = 0
        syncScrollbar()
      })
    }

    syncScrollbar()
    textarea.addEventListener('scroll', scheduleSync, { passive: true })
    const resizeObserver = new ResizeObserver(scheduleSync)
    resizeObserver.observe(textarea)

    return () => {
      if (scrollbarSyncFrameRef.current) {
        globalThis.cancelAnimationFrame(scrollbarSyncFrameRef.current)
        scrollbarSyncFrameRef.current = 0
      }
      textarea.removeEventListener('scroll', scheduleSync)
      resizeObserver.disconnect()
    }
  }, [height, value])

  const handleScrollbarThumbPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const textarea = textareaRef.current
    const track = scrollbarTrackRef.current
    if (!textarea || !track) return

    event.preventDefault()
    event.stopPropagation()

    const startY = event.clientY
    const startScrollTop = textarea.scrollTop
    const scrollableHeight = Math.max(0, textarea.scrollHeight - textarea.clientHeight)
    const maxThumbTop = Math.max(1, track.clientHeight - event.currentTarget.clientHeight)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      textarea.scrollTop = startScrollTop + ((moveEvent.clientY - startY) / maxThumbTop) * scrollableHeight
    }

    const handlePointerUp = () => {
      globalThis.removeEventListener('pointermove', handlePointerMove)
      globalThis.removeEventListener('pointerup', handlePointerUp)
    }

    globalThis.addEventListener('pointermove', handlePointerMove)
    globalThis.addEventListener('pointerup', handlePointerUp, { once: true })
  }

  return (
    <Stack
      className="scenario-design-review-resizable-textarea"
      position="relative"
      width="100%"
      height={height}
      minHeight={minResizeHeight}
      maxHeight={maxHeight}
      bgcolor={bgcolor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="10px"
      boxSizing="border-box"
      color={color}
      overflow="hidden"
      sx={{
        backgroundColor: isResizing ? activeBgcolor : undefined,
        '&:hover': {
          backgroundColor: isResizing ? activeBgcolor : disabled || !hoverBgcolor ? bgcolor : hoverBgcolor,
        },
        '&:focus-within': {
          backgroundColor: activeBgcolor,
          borderColor: disabled ? borderColor : 'contentBorder.Active',
        },
        '&:hover .scenario-design-review-resize-handle, &:focus-within .scenario-design-review-resize-handle': {
          color: disabled ? '#CED4DA' : '#343A40',
        },
      }}
    >
      <Stack
        ref={textareaRef}
        component="textarea"
        aria-label={ariaLabel}
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        onBlur={onBlur}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value)}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 0,
          border: 0,
          outline: 'none',
          bgcolor: 'transparent',
          boxSizing: 'border-box',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize,
          fontWeight,
          lineHeight: 1.5,
          overflow: 'auto',
          padding,
          paddingRight: `calc(${padding} + 16px)`,
          resize: 'none',
          scrollbarWidth: 'none',
          '&::placeholder': {
            color: 'contentText.Disabled',
          },
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      />
      <Stack
        component="span"
        ref={scrollbarTrackRef}
        aria-hidden
        position="absolute"
        top="4px"
        right="2px"
        bottom="24px"
        width="14px"
        sx={{
          opacity: scrollbarState.visible ? 1 : 0,
          pointerEvents: scrollbarState.visible ? 'auto' : 'none',
          transition: 'opacity 120ms ease',
        }}
      >
        <Stack
          component="span"
          onPointerDown={handleScrollbarThumbPointerDown}
          position="absolute"
          top={`${scrollbarState.thumbTop}px`}
          right="5px"
          width="4px"
          height={`${scrollbarState.thumbHeight}px`}
          borderRadius="4px"
          bgcolor="#CED4DA"
          sx={{
            cursor: 'grab',
            '&:hover': { bgcolor: '#ADB5BD' },
          }}
        />
      </Stack>
      <ScenarioDesignReviewResizeHandle disabled={disabled} onMouseDown={handleResizeStart} />
    </Stack>
  )
}

const ScenarioDesignReviewResetButton = ({ disabled = true, onClick }: { disabled?: boolean; onClick?: () => void }) => (
  <MIBaseButton
    aria-label="초기화"
    variant="outlined"
    disabled={disabled}
    prefix={<ReplayRoundedIcon sx={{ fontSize: '16px', color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled' }} />}
    onClick={onClick}
    sx={{
      width: '26px',
      minWidth: '26px',
      height: '26px',
      padding: '0px',
      borderRadius: '8px',
      backgroundColor: disabled ? 'contentBG.Disabled' : 'commonColor.White',
      borderColor: disabled ? 'contentBorder.Disabled' : 'contentBorder.Normal',
      '&:hover:not(:disabled)': {
        backgroundColor: 'contentBG.Hover',
        borderColor: 'contentBorder.Hover',
      },
      '& > .MuiBox-root, & .MuiStack-root, & .MuiTypography-root': {
        alignItems: 'center',
        justifyContent: 'center',
      },
      '& .MuiTypography-root': {
        display: 'none',
      },
    }}
  >
    {''}
  </MIBaseButton>
)

const ScenarioDesignReviewModifiedBadge = () => (
  <Typography
    component="span"
    variant="body3SB12"
    color="contentText.Subtext"
    lineHeight={1.4}
    padding="2px 4px"
    bgcolor="gray.5"
    borderRadius="4px"
    flexShrink={0}
    noWrap
  >
    수정됨
  </Typography>
)

const ScenarioDesignReviewSectionHeader = ({
  title,
  modified,
  resetDisabled,
  showReset = true,
  onReset,
}: {
  title: string
  modified?: boolean
  resetDisabled?: boolean
  showReset?: boolean
  onReset?: () => void
}) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    gap="8px"
    height="34px"
    padding="4px 8px"
    width="100%"
    minWidth={0}
    boxSizing="border-box"
  >
    <Stack direction="row" alignItems="center" gap="6px" flex={1} minWidth={0} overflow="hidden">
      <Typography fontSize="16px" fontWeight={600} color="contentText.Black" lineHeight={1.4} flex={1} minWidth={0} noWrap>
        {title}
      </Typography>
      {modified && <ScenarioDesignReviewModifiedBadge />}
    </Stack>
    {showReset && <ScenarioDesignReviewResetButton disabled={!onReset || (resetDisabled ?? !modified)} onClick={onReset} />}
  </Stack>
)

const ScenarioDesignReviewParagraphField = ({
  value,
  maxLength,
  minHeight,
  minResizeHeight,
  maxHeight,
  fontSize = '14px',
  editable,
  loading,
  errorMessage,
  ariaLabel,
  resetKey,
  onBlur,
  onChange,
}: {
  value: string
  maxLength: number
  minHeight: string
  minResizeHeight?: string
  maxHeight?: string
  fontSize?: string
  editable?: boolean
  loading?: boolean
  errorMessage?: string
  ariaLabel?: string
  resetKey?: number
  onBlur?: () => void
  onChange?: (value: string) => void
}) => (
  <Stack gap="4px" width="100%" minWidth={0}>
    {loading ? (
      <Stack
        bgcolor="commonColor.White"
        border="1px solid"
        borderColor="contentBorder.Normal"
        borderRadius="10px"
        minHeight={minHeight}
        maxHeight={maxHeight}
        padding="20px"
        overflow="auto"
        boxSizing="border-box"
      >
        <Stack gap="8px">
          <Skeleton variant="rounded" width="100%" height="18px" />
          <Skeleton variant="rounded" width="84%" height="18px" />
        </Stack>
      </Stack>
    ) : editable ? (
      <ScenarioDesignReviewResizableTextarea
        ariaLabel={ariaLabel}
        value={value}
        maxLength={maxLength}
        minHeight={minHeight}
        minResizeHeight={minResizeHeight}
        maxHeight={maxHeight}
        resetKey={resetKey}
        borderColor={errorMessage ? 'contentBorder.Error' : 'contentBorder.Normal'}
        fontSize={fontSize}
        fontWeight={500}
        hoverBgcolor="contentBG.Hover"
        onBlur={onBlur}
        onChange={onChange}
      />
    ) : (
      <Stack
        bgcolor="commonColor.White"
        border="1px solid"
        borderColor="contentBorder.Normal"
        borderRadius="10px"
        minHeight={minHeight}
        maxHeight={maxHeight}
        padding="20px"
        overflow="auto"
        boxSizing="border-box"
      >
        <Typography fontSize={fontSize} fontWeight={500} color="contentText.Normal" lineHeight={1.5} whiteSpace="pre-wrap">
          {value || '-'}
        </Typography>
      </Stack>
    )}
    <Stack direction="row" alignItems="center" justifyContent="space-between" height="18px" padding="0 8px">
      {errorMessage ? (
        <Typography variant="body3M12" color="contentText.Error" lineHeight={1.5} noWrap>
          {errorMessage}
        </Typography>
      ) : value.length >= maxLength ? (
        <Typography variant="body3M12" color="contentText.Error" lineHeight={1.5} noWrap>
          최대 {maxLength}자까지 입력할 수 있습니다.
        </Typography>
      ) : (
        <Stack width="58px" height="18px" flexShrink={0} />
      )}
      <Typography
        variant="body3M12"
        color={errorMessage || value.length >= maxLength ? 'contentText.Error' : 'contentText.Subtext'}
        lineHeight={1.5}
        textAlign="right"
        noWrap
      >
        {loading ? 0 : value.length} / {maxLength}
      </Typography>
    </Stack>
  </Stack>
)

const ScenarioDesignReviewTextSection = ({
  title,
  value,
  maxLength,
  minHeight,
  modified,
  editable,
  loading,
  errorMessage,
  resetKey,
  onBlur,
  onChange,
  onReset,
}: {
  title: string
  value: string
  maxLength: number
  minHeight: string
  modified?: boolean
  editable?: boolean
  loading?: boolean
  errorMessage?: string
  resetKey?: number
  onBlur?: () => void
  onChange?: (value: string) => void
  onReset?: () => void
}) => (
  <Stack gap="4px" width="100%" minWidth={0} bgcolor="commonColor.White" borderRadius="10px" padding="12px" boxSizing="border-box">
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap="8px"
      height="34px"
      padding="4px 8px"
      minWidth={0}
      boxSizing="border-box"
    >
      <Stack direction="row" alignItems="center" gap="6px" flex={1} minWidth={0} overflow="hidden">
        <Typography fontSize="18px" fontWeight={600} color="contentText.Black" lineHeight={1.4} flex={1} minWidth={0} noWrap>
          {title}
        </Typography>
        {modified && <ScenarioDesignReviewModifiedBadge />}
      </Stack>
      <ScenarioDesignReviewResetButton disabled={!modified} onClick={onReset} />
    </Stack>
    <ScenarioDesignReviewParagraphField
      ariaLabel={title}
      value={value}
      maxLength={maxLength}
      minHeight={minHeight}
      minResizeHeight="68px"
      maxHeight="900px"
      resetKey={resetKey}
      fontSize="16px"
      editable={editable}
      loading={loading}
      errorMessage={errorMessage}
      onBlur={onBlur}
      onChange={onChange}
    />
  </Stack>
)

type ScenarioDesignReviewEllipsisTextProps = Omit<TypographyProps, 'children'> & {
  value: string
  tooltipTitle?: ReactNode
}

const ScenarioDesignReviewEllipsisText = ({ value, tooltipTitle, sx, ...typographyProps }: ScenarioDesignReviewEllipsisTextProps) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)

  const typography = (
    <Typography
      ref={ref}
      {...typographyProps}
      sx={[
        {
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
        {
          pointerEvents: isEllipsis ? 'auto' : 'none',
        },
      ]}
    >
      {value}
    </Typography>
  )

  return <NextGenMIFollowCursorTooltip title={tooltipTitle ?? value}>{typography}</NextGenMIFollowCursorTooltip>
}

const ScenarioDesignReviewCriteriaCard = ({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) => (
  <Stack
    gridColumn={fullWidth ? '1 / -1' : undefined}
    height="100%"
    minWidth={0}
    overflow="hidden"
    bgcolor="gray.5"
    borderRadius="10px"
    padding="8px 12px"
    boxSizing="border-box"
  >
    <ScenarioDesignReviewEllipsisText value={label} variant="body2SB14" color="contentText.Subtext" lineHeight={1.5} />
    <ScenarioDesignReviewEllipsisText value={value} variant="body2SB14" color="contentText.Normal" lineHeight={1.5} />
  </Stack>
)

const ScenarioDesignReviewPossibilityField = ({
  value,
  hasError,
  onChange,
}: {
  value: string
  hasError?: boolean
  onChange: (value: string) => void
}) => {
  const errorIcon = hasError ? (
    <NextGenMIFollowCursorTooltip
      title="각 시나리오 가능성의 합은 100을 초과할 수 없습니다"
      tooltipSx={{
        bgcolor: 'contentText.Error',
        color: 'contentText.White',
        padding: '8px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 400,
      }}
    >
      <Stack component="span" width="20px" height="20px" flexShrink={0}>
        <MIInputErrorIcon width="20px" height="20px" />
      </Stack>
    </NextGenMIFollowCursorTooltip>
  ) : null

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      minHeight="48px"
      bgcolor="gray.5"
      borderRadius="10px"
      padding="6px 12px"
      boxSizing="border-box"
      sx={{
        '&:hover': {
          bgcolor: 'contentBG.Hover',
        },
      }}
    >
      <Typography variant="body2SB14" color="contentText.Black" lineHeight={1.4} noWrap>
        시나리오 가능성
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="flex-end" gap="4px" minWidth={0}>
        {errorIcon}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          width="140px"
          minWidth={0}
          bgcolor="commonColor.White"
          border="1px solid"
          borderColor={hasError ? 'contentBorder.Error' : 'contentBorder.Normal'}
          borderRadius="10px"
          padding="8px 12px"
          boxSizing="border-box"
        >
          <Stack
            component="input"
            aria-label="시나리오 가능성"
            value={value}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
            sx={{
              width: '100%',
              minWidth: 0,
              border: 0,
              outline: 'none',
              bgcolor: 'transparent',
              color: 'contentText.Normal',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.4,
              padding: '0px',
            }}
          />
          <PercentRoundedIcon sx={{ fontSize: '16px', color: hasError ? 'contentIcon.Error' : 'contentIcon.Enabled', flexShrink: 0 }} />
        </Stack>
      </Stack>
    </Stack>
  )
}

const ScenarioDesignReviewPossibilityWarning = () => (
  <Stack direction="row" alignItems="center" gap="4px" minWidth={0} padding="4px 8px" borderRadius="8px">
    <MIInputErrorIcon width="16px" height="16px" />
    <Typography variant="body3SB12" color="contentText.Error" lineHeight={1.4} noWrap>
      가능성 합계를 100%로 맞춰 주세요
    </Typography>
  </Stack>
)

const ScenarioDesignReviewResetConfirmDialog = ({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    slotProps={{
      paper: {
        sx: {
          width: '450px',
          maxWidth: 'calc(100vw - 48px)',
          border: '1px solid',
          borderColor: 'contentBorder.Normal',
          borderRadius: '12px',
          boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
          margin: 0,
          overflow: 'hidden',
        },
      },
    }}
  >
    <DialogContent
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '20px 20px 30px',
        '&:last-of-type': {
          paddingBottom: '30px',
        },
      }}
    >
      <Stack direction="row" alignItems="center" width="100%" minWidth={0}>
        <Typography variant="body1" fontSize="16px" fontWeight={700} color="contentText.Normal" lineHeight={1.4} flex={1} noWrap>
          모든 수정 항목을 기본값으로 초기화하시겠습니까?
        </Typography>
        <MIBaseButton aria-label="닫기" variant="text" onClick={onClose} sx={{ height: '32px', padding: '6px' }}>
          <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
        </MIBaseButton>
      </Stack>
    </DialogContent>
    <DialogActions disableSpacing sx={{ padding: '30px 20px 20px', gap: '10px' }}>
      <MIBaseButton variant="outlined" onClick={onClose} sx={{ height: '34px', borderRadius: '6px' }}>
        취소
      </MIBaseButton>
      <MIBaseButton
        variant="contained"
        onClick={onConfirm}
        labelColor="contentText.White"
        sx={{
          height: '34px',
          borderRadius: '6px',
          backgroundColor: 'contentIcon.Error',
          '&:hover:not(:disabled)': {
            backgroundColor: 'contentIcon.Error',
          },
        }}
      >
        초기화
      </MIBaseButton>
    </DialogActions>
  </Dialog>
)

const ScenarioDesignReviewSwitch = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
  <Stack
    component="button"
    type="button"
    aria-pressed={checked}
    onClick={onClick}
    width="32px"
    height="20px"
    alignItems={checked ? 'flex-end' : 'flex-start'}
    justifyContent="center"
    padding="2px"
    border="0px"
    borderRadius="16px"
    bgcolor={checked ? 'contentIcon.ActivePrimary' : 'gray.50'}
    flexShrink={0}
    sx={{ cursor: 'pointer' }}
  >
    <Stack width="16px" height="16px" bgcolor="commonColor.White" borderRadius="16px" />
  </Stack>
)

const ScenarioDesignReviewPanelDivider = () => <Divider />

const ScenarioDesignReviewSignpostSelectBox = ({
  value,
  disabled,
  onChange,
}: {
  value: ScenarioDesignReviewSignpostImpact
  disabled?: boolean
  onChange: (value: ScenarioDesignReviewSignpostImpact) => void
}) => (
  <Stack position="relative" width="120px" flexShrink={0}>
    <Stack
      component="select"
      value={value}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as ScenarioDesignReviewSignpostImpact)}
      sx={{
        width: '120px',
        height: '34px',
        border: '1px solid',
        borderColor: disabled ? 'contentBorder.Disabled' : 'contentBorder.Normal',
        borderRadius: '8px',
        bgcolor: disabled ? 'contentBG.Disabled' : 'commonColor.White',
        boxSizing: 'border-box',
        color: disabled ? 'contentText.Disabled' : 'contentText.Normal',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: 1.4,
        outline: 'none',
        padding: '6px 30px 6px 10px',
        appearance: 'none',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {scenarioDesignReviewSignpostImpactItems.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </Stack>
    <KeyboardArrowDownRoundedIcon
      sx={{
        position: 'absolute',
        top: '7px',
        right: '6px',
        fontSize: '20px',
        color: disabled ? 'contentIcon.Disabled' : 'contentIcon.Enabled',
        pointerEvents: 'none',
      }}
    />
  </Stack>
)

const ScenarioDesignReviewDirectionField = () => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    width="120px"
    height="34px"
    border="1px solid"
    borderColor="contentBorder.Disabled"
    borderRadius="8px"
    bgcolor="contentBG.Disabled"
    padding="6px 6px 6px 10px"
    boxSizing="border-box"
    flexShrink={0}
  >
    <Typography variant="body2M14" color="contentText.Disabled" lineHeight={1.4} noWrap>
      가능성 강화
    </Typography>
    <KeyboardArrowDownRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Disabled', flexShrink: 0 }} />
  </Stack>
)

const ScenarioDesignReviewSignpostPanelRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <Stack direction="row" alignItems="center" gap="8px" width="100%" padding="4px 12px" borderRadius="10px" boxSizing="border-box">
    <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4} flex={1} minWidth={0} noWrap>
      {label}
    </Typography>
    {children}
  </Stack>
)

const ScenarioDesignReviewUnusedBadge = () => (
  <Stack
    alignItems="center"
    justifyContent="center"
    width="40px"
    height="20px"
    padding="0 4px"
    bgcolor="gray.5"
    border="1px solid"
    borderColor="contentBorder.Normal"
    borderRadius="4px"
    boxSizing="border-box"
    flexShrink={0}
  >
    <Typography variant="body3M12" color="contentText.Subtext" lineHeight={1.4} noWrap>
      미사용
    </Typography>
  </Stack>
)

const ScenarioDesignReviewSignpost = ({
  rowId,
  index,
  initialDisabled,
  initialLabel = 'Signpost',
  resetKey,
  rowResetKey,
  onModifiedChange,
}: {
  rowId: number
  index: number
  initialDisabled?: boolean
  initialLabel?: string
  resetKey: number
  rowResetKey: number
  onModifiedChange?: (rowId: number, index: number, modified: boolean) => void
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [enabled, setEnabled] = useState(!initialDisabled)
  const [label, setLabel] = useState(initialLabel)
  const [impact, setImpact] = useState<ScenarioDesignReviewSignpostImpact>('high')
  const [draftEnabled, setDraftEnabled] = useState(enabled)
  const [draftLabel, setDraftLabel] = useState(label)
  const [draftImpact, setDraftImpact] = useState<ScenarioDesignReviewSignpostImpact>(impact)
  const impactLabel = scenarioDesignReviewSignpostImpactItems.find((item) => item.value === impact)?.label ?? '높음'
  const displayLabel = label.trim() || 'Signpost'
  const draftChanged = draftEnabled !== enabled || draftLabel !== label || draftImpact !== impact
  const applyDisabled = !draftChanged || (draftEnabled && draftLabel.trim().length === 0)

  useEffect(() => {
    const nextEnabled = !initialDisabled

    setMenuOpen(false)
    setEnabled(nextEnabled)
    setLabel(initialLabel)
    setImpact('high')
    setDraftEnabled(nextEnabled)
    setDraftLabel(initialLabel)
    setDraftImpact('high')
    onModifiedChange?.(rowId, index, false)
  }, [index, initialDisabled, initialLabel, onModifiedChange, resetKey, rowId, rowResetKey])

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDraftEnabled(enabled)
      setDraftLabel(label)
      setDraftImpact(impact)
    }
    setMenuOpen(open)
  }

  const handleCancel = () => {
    setDraftEnabled(enabled)
    setDraftLabel(label)
    setDraftImpact(impact)
    setMenuOpen(false)
  }

  const handleApply = () => {
    if (applyDisabled) return
    const nextLabel = draftLabel.trim() || 'Signpost'

    setEnabled(draftEnabled)
    setLabel(nextLabel)
    setImpact(draftImpact)
    onModifiedChange?.(rowId, index, draftEnabled !== !initialDisabled || nextLabel !== initialLabel || draftImpact !== 'high')
    setMenuOpen(false)
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      minHeight="62px"
      padding="10px 12px"
      bgcolor={enabled ? 'gray.5' : 'contentBG.Disabled'}
      borderRadius="10px"
      minWidth={0}
      sx={{
        '&:hover': {
          bgcolor: enabled ? 'contentBG.Hover' : 'contentBG.Disabled',
        },
      }}
    >
      <Stack alignItems="flex-start" flex={1} minWidth={0} overflow="hidden">
        <Stack direction="row" alignItems="center" gap="4px" width="100%" minWidth={0}>
          {!enabled && <ScenarioDesignReviewUnusedBadge />}
          <ScenarioDesignReviewEllipsisText
            className="scenario-design-signpost-label"
            value={displayLabel}
            variant="body2SB14"
            color={enabled ? 'contentText.Black' : 'contentText.Disabled'}
            lineHeight={1.5}
            flex={1}
          />
        </Stack>
        <ScenarioDesignReviewEllipsisText
          value={`가능성 강화 · ${impactLabel}`}
          variant="body2M14"
          color={enabled ? 'contentText.Normal' : 'contentText.Disabled'}
          lineHeight={1.5}
          width="100%"
        />
      </Stack>
      <Stack className="scenario-design-signpost-action" flexShrink={0}>
        <MIMenu
          open={menuOpen}
          onOpenChange={handleOpenChange}
          placement="bottom-end"
          menuPositionOffset={{ top: 8 }}
          variant="outlined"
          aria-label="Signpost 수정"
          label={
            <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: '16px', color: menuOpen ? 'contentIcon.Active' : 'contentIcon.Enabled' }} />
          }
          enableHoverBackground
          paperProps={{ sx: { width: '280px', overflow: 'hidden' } }}
          sx={{
            width: '26px',
            minWidth: '26px',
            height: '26px',
            padding: '0px',
            borderRadius: '8px',
            backgroundColor: menuOpen ? 'contentBG.Active' : 'commonColor.White',
            borderColor: menuOpen ? 'contentBorder.Active' : 'contentBorder.Normal',
            '&:hover:not(:disabled)': {
              backgroundColor: 'contentBG.Hover',
              borderColor: menuOpen ? 'contentBorder.Active' : 'contentBorder.Hover',
            },
            '& > .MuiBox-root, & .MuiStack-root, & .MuiTypography-root': {
              alignItems: 'center',
              justifyContent: 'center',
            },
            '& .MuiTypography-root': {
              display: 'flex',
            },
          }}
        >
          <Stack alignItems="flex-end" gap="4px" padding="8px" width="100%" boxSizing="border-box">
            <Stack gap="4px" width="100%">
              <Stack direction="row" alignItems="center" width="100%" padding="8px 12px" borderRadius="10px" boxSizing="border-box">
                <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4} flex={1} minWidth={0} noWrap>
                  Signpost 사용
                </Typography>
                <ScenarioDesignReviewSwitch checked={draftEnabled} onClick={() => setDraftEnabled((current) => !current)} />
              </Stack>
              <ScenarioDesignReviewPanelDivider />

              <Stack gap="8px" width="100%" padding="4px 12px" borderRadius="10px" boxSizing="border-box">
                <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4} noWrap>
                  Signpost Label
                </Typography>
                <Stack gap="4px" width="100%">
                  <ScenarioDesignReviewResizableTextarea
                    ariaLabel="Signpost Label"
                    value={draftLabel}
                    maxLength={100}
                    minHeight="64px"
                    minResizeHeight="48px"
                    maxHeight="900px"
                    resetKey={resetKey}
                    disabled={!draftEnabled}
                    borderColor={draftEnabled ? 'contentBorder.Normal' : 'contentBorder.Disabled'}
                    bgcolor={draftEnabled ? 'commonColor.White' : 'contentBG.Disabled'}
                    color={draftEnabled ? 'contentText.Normal' : 'contentText.Disabled'}
                    padding="12px"
                    hoverBgcolor="contentBG.Hover"
                    onChange={setDraftLabel}
                  />
                  <Stack direction="row" alignItems="center" justifyContent="space-between" height="18px" padding="0 8px">
                    <Stack width="58px" height="18px" flexShrink={0} />
                    <Typography
                      variant="body3M12"
                      color={draftEnabled ? 'contentText.Subtext' : 'contentText.Disabled'}
                      lineHeight={1.5}
                      noWrap
                    >
                      {draftLabel.length} / 100
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
              <ScenarioDesignReviewPanelDivider />

              <ScenarioDesignReviewSignpostPanelRow label="방향">
                <ScenarioDesignReviewDirectionField />
              </ScenarioDesignReviewSignpostPanelRow>
              <ScenarioDesignReviewPanelDivider />

              <ScenarioDesignReviewSignpostPanelRow label="영향도">
                <ScenarioDesignReviewSignpostSelectBox value={draftImpact} disabled={!draftEnabled} onChange={setDraftImpact} />
              </ScenarioDesignReviewSignpostPanelRow>
              <ScenarioDesignReviewPanelDivider />
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" padding="8px" boxSizing="border-box">
              <Stack width="32px" height="20px" sx={{ opacity: 0 }} />
              <Stack direction="row" alignItems="center" gap="8px">
                <MIBaseButton variant="outlined" onClick={handleCancel} sx={{ height: '36px', padding: '8px 10px', borderRadius: '8px' }}>
                  취소
                </MIBaseButton>
                <MIBaseButton
                  variant="contained"
                  disabled={applyDisabled}
                  onClick={handleApply}
                  labelColor={applyDisabled ? 'contentText.Disabled' : 'contentText.White'}
                  sx={{
                    height: '36px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: applyDisabled ? 'contentBG.Disabled' : 'contentIcon.ActivePrimary',
                    '&:hover:not(:disabled)': {
                      backgroundColor: 'contentIcon.ActivePrimary',
                    },
                  }}
                >
                  적용
                </MIBaseButton>
              </Stack>
            </Stack>
          </Stack>
        </MIMenu>
      </Stack>
    </Stack>
  )
}

const ScenarioDesignReviewScenarioCard = ({
  row,
  columns,
  narrative,
  cardWidth,
  showSplitter,
  cardResizeDragging,
  splitterActive,
  narrativeModified,
  narrativeErrorMessage,
  possibility,
  possibilityModified,
  possibilityError,
  resetKey,
  signpostResetKey,
  signpostModified,
  onNarrativeBlur,
  onNarrativeChange,
  onNarrativeReset,
  onCardRef,
  onSplitterKeyDown,
  onSplitterPointerDown,
  onPossibilityChange,
  onPossibilityReset,
  onSignpostModifiedChange,
  onSignpostReset,
}: {
  row: ScenarioDesignRow
  columns: ScenarioDesignColumn[]
  narrative: string
  cardWidth: number
  showSplitter?: boolean
  cardResizeDragging?: boolean
  splitterActive?: boolean
  narrativeModified?: boolean
  narrativeErrorMessage?: string
  possibility: string
  possibilityModified?: boolean
  possibilityError?: boolean
  resetKey: number
  signpostResetKey: number
  signpostModified?: boolean
  onNarrativeBlur: () => void
  onNarrativeChange: (value: string) => void
  onNarrativeReset: () => void
  onCardRef: (element: HTMLDivElement | null) => void
  onSplitterKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void
  onSplitterPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  onPossibilityChange: (value: string) => void
  onPossibilityReset: () => void
  onSignpostModifiedChange: (rowId: number, index: number, modified: boolean) => void
  onSignpostReset: () => void
}) => (
  <Stack
    ref={onCardRef}
    position="relative"
    width={`calc(var(--scenario-design-card-width) + ${showSplitter ? SCENARIO_DESIGN_REVIEW_SPLITTER_WIDTH : 0}px)`}
    flex={`0 0 calc(var(--scenario-design-card-width) + ${showSplitter ? SCENARIO_DESIGN_REVIEW_SPLITTER_WIDTH : 0}px)`}
    minWidth={0}
    style={{ '--scenario-design-card-width': `${cardWidth}px` } as CSSProperties}
    sx={{
      transition: cardResizeDragging ? 'none' : 'width 180ms ease, flex-basis 180ms ease',
    }}
  >
    <Stack
      width="var(--scenario-design-card-width)"
      flex="0 0 var(--scenario-design-card-width)"
      bgcolor="commonColor.White"
      border="1px solid"
      borderColor="contentBorder.Normal"
      borderRadius="10px"
      padding="12px"
      boxSizing="border-box"
      sx={{
        transition: cardResizeDragging ? 'none' : 'width 180ms ease, flex-basis 180ms ease',
      }}
    >
      <Stack gap="6px" padding="6px 8px 12px" minHeight="95px">
        <Stack direction="row" alignItems="center" gap="4px">
          <MIChip label="시나리오" color="gray" size="h20" disableHover sx={{ padding: '2px 6px', borderRadius: '8px' }} />
          {row.recommended && (
            <MIChip
              label="BC"
              color="purple"
              size="h20"
              disableHover
              sx={{
                padding: '2px 6px',
                borderRadius: '8px',
                backgroundColor: 'mari.Primary',
                color: 'contentText.White',
              }}
            />
          )}
        </Stack>
        <Typography
          fontSize="18px"
          fontWeight={600}
          color="contentText.Black"
          lineHeight={1.4}
          height="50px"
          overflow="hidden"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {row.scenarioName}
        </Typography>
      </Stack>
      <Divider />

      <Stack gap="6px" padding="24px 0">
        <ScenarioDesignReviewSectionHeader
          title="시나리오 내러티브"
          modified={narrativeModified}
          resetDisabled={!narrativeModified}
          onReset={onNarrativeReset}
        />
        <ScenarioDesignReviewParagraphField
          ariaLabel={`${row.scenarioName || '시나리오'} 내러티브`}
          value={narrative}
          maxLength={500}
          minHeight="194px"
          minResizeHeight="120px"
          maxHeight="600px"
          editable
          errorMessage={narrativeErrorMessage}
          resetKey={resetKey}
          onBlur={onNarrativeBlur}
          onChange={onNarrativeChange}
        />
      </Stack>
      <Divider />

      <Stack gap="6px" padding="24px 0">
        <ScenarioDesignReviewSectionHeader title="시나리오 특화 분기" showReset={false} />
        <Stack display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" alignItems="stretch" gap="8px" width="100%" minWidth={0}>
          {columns.map((column, index) => (
            <ScenarioDesignReviewCriteriaCard
              key={column.key}
              label={column.label}
              value={getScenarioDesignColumnDisplayValue(column.key, row[column.key])}
              fullWidth={columns.length % 2 === 1 && index === columns.length - 1}
            />
          ))}
        </Stack>
      </Stack>
      <Divider />

      <Stack gap="6px" padding="24px 0">
        <ScenarioDesignReviewSectionHeader
          title="시나리오 가능성"
          modified={possibilityModified}
          resetDisabled={!possibilityModified}
          onReset={onPossibilityReset}
        />
        <ScenarioDesignReviewPossibilityField value={possibility} hasError={possibilityError} onChange={onPossibilityChange} />
      </Stack>
      <Divider />

      <Stack gap="6px" padding="24px 0 0">
        <ScenarioDesignReviewSectionHeader
          title="주요 Signpost"
          modified={signpostModified}
          resetDisabled={!signpostModified}
          onReset={onSignpostReset}
        />
        <Stack gap="8px">
          {Array.from({ length: 6 }).map((_, index) => (
            <ScenarioDesignReviewSignpost
              key={index}
              rowId={row.id}
              index={index}
              initialDisabled={index === 5 || (row.recommended === true && index === 1)}
              initialLabel={index === 0 ? SCENARIO_DESIGN_REVIEW_DEFAULT_SIGNPOST_LABEL : undefined}
              resetKey={resetKey}
              rowResetKey={signpostResetKey}
              onModifiedChange={onSignpostModifiedChange}
            />
          ))}
        </Stack>
      </Stack>
    </Stack>
    {showSplitter && (
      <Stack
        role="separator"
        aria-label={`${row.scenarioName || '시나리오'} 카드 너비 조절`}
        aria-orientation="vertical"
        tabIndex={0}
        position="absolute"
        top="0px"
        right="0px"
        bottom="0px"
        width="12px"
        alignItems="center"
        justifyContent="center"
        onPointerDown={onSplitterPointerDown}
        onKeyDown={onSplitterKeyDown}
        sx={{
          cursor: 'col-resize',
          outline: 'none',
          touchAction: 'none',
          zIndex: 4,
          '&:hover .scenario-design-card-splitter-track, &:focus-visible .scenario-design-card-splitter-track': {
            opacity: 1,
          },
        }}
      >
        <Stack
          className="scenario-design-card-splitter-track"
          width="100%"
          height="100%"
          padding="10px 0"
          alignItems="center"
          justifyContent="center"
          boxSizing="border-box"
          sx={{
            opacity: splitterActive ? 1 : 0,
            transition: 'opacity 120ms ease',
          }}
        >
          <Stack
            width="4px"
            flex={1}
            minHeight={0}
            sx={(theme) => ({
              background: `linear-gradient(0deg, transparent 0%, ${theme.palette.mari.Primary} 50%, transparent 100%)`,
            })}
          />
        </Stack>
      </Stack>
    )}
  </Stack>
)

type ScenarioDesignOneViewStepProps = {
  rows: ScenarioDesignRow[]
  columns: ScenarioDesignColumn[]
  narrative: string
  loading: boolean
  onCancel: () => void
  onCreate: (value: ScenarioDesignReviewCreateValue) => void
}

const ScenarioDesignOneViewStep = ({ rows, columns, narrative, loading, onCancel, onCreate }: ScenarioDesignOneViewStepProps) => {
  const { showSnackbar } = useSnackbar()
  const reviewNarrative = narrative || SCENARIO_DESIGN_REVIEW_DEFAULT_NARRATIVE
  const defaultScenarioPossibilities = useMemo(() => createScenarioDesignReviewInitialPossibilities(rows), [rows])
  const defaultScenarioNarratives = useMemo(
    () => createScenarioDesignReviewInitialNarratives(rows, reviewNarrative),
    [reviewNarrative, rows],
  )
  const previousReviewNarrativeRef = useRef(reviewNarrative)
  const [scenarioGroupName, setScenarioGroupName] = useState(SCENARIO_DESIGN_REVIEW_DEFAULT_GROUP_NAME)
  const [scenarioGroupDescription, setScenarioGroupDescription] = useState(reviewNarrative)
  const [scenarioNarratives, setScenarioNarratives] = useState<Record<number, string>>(() => defaultScenarioNarratives)
  const [scenarioPossibilities, setScenarioPossibilities] = useState<Record<number, string>>(() => defaultScenarioPossibilities)
  const [possibilityErrorRowId, setPossibilityErrorRowId] = useState<number | null>(null)
  const [touchedFieldNames, setTouchedFieldNames] = useState<Partial<Record<'scenarioGroupName' | 'scenarioGroupDescription', boolean>>>({})
  const [touchedScenarioNarrativeRows, setTouchedScenarioNarrativeRows] = useState<Record<number, boolean>>({})
  const [resetKey, setResetKey] = useState(0)
  const [signpostResetKeys, setSignpostResetKeys] = useState<Record<number, number>>({})
  const [signpostModifiedRows, setSignpostModifiedRows] = useState<Record<number, Record<number, boolean>>>({})
  const [scenarioCardWidths, setScenarioCardWidths] = useState<Record<number, number>>({})
  const [activeScenarioCardSplitterIndex, setActiveScenarioCardSplitterIndex] = useState<number | null>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const scenarioReviewRootRef = useRef<HTMLDivElement | null>(null)
  const scenarioReviewScrollRef = useRef<HTMLDivElement | null>(null)
  const scenarioReviewScrollAnimationFrameRef = useRef(0)
  const scenarioCardRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const scenarioCardWidthDraftAnimationFrameRef = useRef(0)
  const scenarioCardWidthDraftRef = useRef<Record<number, number>>({})
  const [scenarioReviewScrollLayoutState, setScenarioReviewScrollLayoutState] = useState({
    horizontal: false,
    scrollWidth: 0,
    clientWidth: 0,
  })
  const scenarioReviewScrollLayoutStateRef = useRef(scenarioReviewScrollLayoutState)
  const [isScenarioReviewScrollHovered, setIsScenarioReviewScrollHovered] = useState(false)
  const [isScenarioReviewScrollbarDragging, setIsScenarioReviewScrollbarDragging] = useState(false)
  const scenarioGroupNameModified = scenarioGroupName !== SCENARIO_DESIGN_REVIEW_DEFAULT_GROUP_NAME
  const scenarioGroupDescriptionModified = scenarioGroupDescription !== reviewNarrative
  const scenarioGroupNameErrorMessage =
    touchedFieldNames.scenarioGroupName && scenarioGroupName.trim().length === 0 ? '최소 1자 이상 입력해야 합니다.' : undefined
  const scenarioGroupDescriptionErrorMessage =
    touchedFieldNames.scenarioGroupDescription && scenarioGroupDescription.trim().length === 0
      ? '최소 1자 이상 입력해야 합니다.'
      : undefined
  const canCreateScenarioGroup = useMemo(
    () => scenarioGroupName.trim().length > 0 && scenarioGroupDescription.trim().length > 0,
    [scenarioGroupDescription, scenarioGroupName],
  )
  const canCreateScenarioNarratives = useMemo(
    () => rows.every((row) => (scenarioNarratives[row.id] ?? reviewNarrative).trim().length > 0),
    [reviewNarrative, rows, scenarioNarratives],
  )
  const hasScenarioNarrativeError = useMemo(
    () => rows.some((row) => touchedScenarioNarrativeRows[row.id] && (scenarioNarratives[row.id] ?? reviewNarrative).trim().length === 0),
    [reviewNarrative, rows, scenarioNarratives, touchedScenarioNarrativeRows],
  )
  const possibilityTotal = useMemo(() => getScenarioDesignReviewPossibilityTotal(scenarioPossibilities), [scenarioPossibilities])
  const canCreateScenarioPossibilities = possibilityTotal === 100 && possibilityErrorRowId === null

  useEffect(
    () => () => {
      if (scenarioCardWidthDraftAnimationFrameRef.current) {
        globalThis.cancelAnimationFrame(scenarioCardWidthDraftAnimationFrameRef.current)
        scenarioCardWidthDraftAnimationFrameRef.current = 0
      }
    },
    [],
  )

  useEffect(() => {
    const previousReviewNarrative = previousReviewNarrativeRef.current

    setScenarioGroupDescription((currentDescription) => {
      if (currentDescription !== previousReviewNarrative) return currentDescription
      return reviewNarrative
    })
    setScenarioNarratives((currentNarratives) => {
      const nextNarratives: Record<number, string> = {}

      rows.forEach((row) => {
        const currentNarrative = currentNarratives[row.id]
        nextNarratives[row.id] =
          currentNarrative === undefined || currentNarrative === previousReviewNarrative ? reviewNarrative : currentNarrative
      })

      return nextNarratives
    })
    previousReviewNarrativeRef.current = reviewNarrative
  }, [reviewNarrative, rows])

  useEffect(() => {
    setScenarioPossibilities((currentPossibilities) => {
      const nextPossibilities: Record<number, string> = {}
      rows.forEach((row) => {
        nextPossibilities[row.id] = currentPossibilities[row.id] ?? defaultScenarioPossibilities[row.id] ?? '0'
      })
      return nextPossibilities
    })

    setPossibilityErrorRowId(null)
    setTouchedScenarioNarrativeRows((currentRows) => {
      const rowIds = new Set(rows.map((row) => row.id))
      const nextRows: Record<number, boolean> = {}

      Object.entries(currentRows).forEach(([rowId, touched]) => {
        const numericRowId = Number(rowId)
        if (rowIds.has(numericRowId)) nextRows[numericRowId] = touched
      })

      return nextRows
    })
    setSignpostResetKeys({})
    setSignpostModifiedRows({})
    setScenarioCardWidths((currentWidths) => createScenarioDesignReviewCardWidths(rows, currentWidths))
    setActiveScenarioCardSplitterIndex(null)
    const rowIds = new Set(rows.map((row) => row.id))
    Object.keys(scenarioCardRefs.current).forEach((rowId) => {
      const numericRowId = Number(rowId)
      if (!rowIds.has(numericRowId)) delete scenarioCardRefs.current[numericRowId]
    })
  }, [defaultScenarioPossibilities, rows])

  useEffect(() => {
    const el = scenarioReviewScrollRef.current
    const root = scenarioReviewRootRef.current
    if (!el || !root) return undefined

    const sync = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      const maxLeft = Math.max(0, scrollWidth - clientWidth)
      const horizontal = maxLeft > 1
      const left = horizontal && scrollLeft > 1
      const right = horizontal && scrollLeft < maxLeft - 1
      const thumbWidth = horizontal ? getScenarioDesignReviewScrollThumbSizePercent(clientWidth, scrollWidth) : 0
      const next = { horizontal, scrollWidth, clientWidth }

      root.style.setProperty('--scenario-design-review-scroll-left-edge-opacity', left ? '1' : '0')
      root.style.setProperty('--scenario-design-review-scroll-right-edge-opacity', right ? '1' : '0')
      root.style.setProperty('--scenario-design-review-horizontal-thumb-width', `${thumbWidth}%`)
      root.style.setProperty(
        '--scenario-design-review-horizontal-thumb-left',
        `${getScenarioDesignReviewScrollThumbPositionPercent(scrollLeft, clientWidth, scrollWidth, thumbWidth)}%`,
      )

      const prev = scenarioReviewScrollLayoutStateRef.current
      if (prev.horizontal === next.horizontal && prev.scrollWidth === next.scrollWidth && prev.clientWidth === next.clientWidth) return

      scenarioReviewScrollLayoutStateRef.current = next
      setScenarioReviewScrollLayoutState(next)
    }

    const scheduleSync = () => {
      if (scenarioReviewScrollAnimationFrameRef.current) return

      scenarioReviewScrollAnimationFrameRef.current = globalThis.requestAnimationFrame(() => {
        scenarioReviewScrollAnimationFrameRef.current = 0
        sync()
      })
    }

    sync()
    el.addEventListener('scroll', scheduleSync, { passive: true })
    const resizeObserver = new ResizeObserver(scheduleSync)
    resizeObserver.observe(el)
    Array.from(el.children).forEach((child) => resizeObserver.observe(child))

    return () => {
      if (scenarioReviewScrollAnimationFrameRef.current) {
        globalThis.cancelAnimationFrame(scenarioReviewScrollAnimationFrameRef.current)
        scenarioReviewScrollAnimationFrameRef.current = 0
      }
      el.removeEventListener('scroll', scheduleSync)
      resizeObserver.disconnect()
    }
  }, [columns.length, rows.length])

  const handlePossibilityChange = (rowId: number, value: string) => {
    if (!/^\d{0,3}$/.test(value)) return

    const nextPossibilities = {
      ...scenarioPossibilities,
      [rowId]: value,
    }
    const nextTotal = getScenarioDesignReviewPossibilityTotal(nextPossibilities)

    setScenarioPossibilities(nextPossibilities)
    setPossibilityErrorRowId(nextTotal > 100 ? rowId : null)
  }

  const handlePossibilityReset = (rowId: number) => {
    const nextPossibilities = {
      ...scenarioPossibilities,
      [rowId]: defaultScenarioPossibilities[rowId] ?? '0',
    }
    const nextTotal = getScenarioDesignReviewPossibilityTotal(nextPossibilities)

    setScenarioPossibilities(nextPossibilities)
    setPossibilityErrorRowId(nextTotal > 100 ? possibilityErrorRowId : null)
  }

  const handleScenarioNarrativeChange = (rowId: number, value: string) => {
    setScenarioNarratives((currentNarratives) => ({
      ...currentNarratives,
      [rowId]: value,
    }))
  }

  const handleScenarioNarrativeReset = (rowId: number) => {
    setScenarioNarratives((currentNarratives) => ({
      ...currentNarratives,
      [rowId]: defaultScenarioNarratives[rowId] ?? reviewNarrative,
    }))
    setTouchedScenarioNarrativeRows((currentRows) => ({
      ...currentRows,
      [rowId]: false,
    }))
  }

  const applyScenarioCardDraftWidths = useCallback((widths: Record<number, number>) => {
    scenarioCardWidthDraftRef.current = widths
    if (scenarioCardWidthDraftAnimationFrameRef.current) return

    scenarioCardWidthDraftAnimationFrameRef.current = globalThis.requestAnimationFrame(() => {
      scenarioCardWidthDraftAnimationFrameRef.current = 0

      Object.entries(scenarioCardWidthDraftRef.current).forEach(([rowId, width]) => {
        scenarioCardRefs.current[Number(rowId)]?.style.setProperty('--scenario-design-card-width', `${width}px`)
      })
    })
  }, [])

  const commitScenarioCardWidths = useCallback((widths: Record<number, number>) => {
    if (scenarioCardWidthDraftAnimationFrameRef.current) {
      globalThis.cancelAnimationFrame(scenarioCardWidthDraftAnimationFrameRef.current)
      scenarioCardWidthDraftAnimationFrameRef.current = 0
    }

    Object.entries(widths).forEach(([rowId, width]) => {
      scenarioCardRefs.current[Number(rowId)]?.style.setProperty('--scenario-design-card-width', `${width}px`)
    })
    scenarioCardWidthDraftRef.current = widths
    setScenarioCardWidths(widths)
  }, [])

  const handleScenarioCardSplitterPointerDown = (splitterIndex: number, event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidths = createScenarioDesignReviewCardWidths(rows, scenarioCardWidths)
    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor

    scenarioCardWidthDraftRef.current = startWidths
    setActiveScenarioCardSplitterIndex(splitterIndex)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    const handlePointerMove = (moveEvent: PointerEvent) => {
      applyScenarioCardDraftWidths(
        getScenarioDesignReviewResizedCardWidths(rows, startWidths, splitterIndex, Math.round(moveEvent.clientX - startX)),
      )
    }

    const finishScenarioCardResize = () => {
      commitScenarioCardWidths(scenarioCardWidthDraftRef.current)
      setActiveScenarioCardSplitterIndex(null)
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
      globalThis.removeEventListener('pointermove', handlePointerMove)
      globalThis.removeEventListener('pointerup', finishScenarioCardResize)
      globalThis.removeEventListener('pointercancel', finishScenarioCardResize)
    }

    globalThis.addEventListener('pointermove', handlePointerMove, { passive: true })
    globalThis.addEventListener('pointerup', finishScenarioCardResize, { once: true })
    globalThis.addEventListener('pointercancel', finishScenarioCardResize, { once: true })
  }

  const handleScenarioCardSplitterKeyDown = (splitterIndex: number, event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

    event.preventDefault()
    commitScenarioCardWidths(
      getScenarioDesignReviewResizedCardWidths(
        rows,
        createScenarioDesignReviewCardWidths(rows, scenarioCardWidths),
        splitterIndex,
        event.key === 'ArrowRight' ? 20 : -20,
      ),
    )
  }

  const handleSignpostModifiedChange = useCallback((rowId: number, index: number, modified: boolean) => {
    setSignpostModifiedRows((currentRows) => {
      if (Boolean(currentRows[rowId]?.[index]) === modified) return currentRows

      const nextRows = { ...currentRows }
      const nextRow = { ...(currentRows[rowId] ?? {}) }

      if (modified) {
        nextRow[index] = true
        nextRows[rowId] = nextRow
        return nextRows
      }

      delete nextRow[index]
      if (Object.values(nextRow).some(Boolean)) {
        nextRows[rowId] = nextRow
      } else {
        delete nextRows[rowId]
      }

      return nextRows
    })
  }, [])

  const handleSignpostReset = (rowId: number) => {
    setSignpostResetKeys((currentKeys) => ({ ...currentKeys, [rowId]: (currentKeys[rowId] ?? 0) + 1 }))
    setSignpostModifiedRows((currentRows) => {
      if (!currentRows[rowId]) return currentRows

      const nextRows = { ...currentRows }
      delete nextRows[rowId]
      return nextRows
    })
  }

  const handleScenarioReviewScrollbarPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const el = scenarioReviewScrollRef.current
    const track = event.currentTarget.parentElement
    if (!el || !track) return

    event.preventDefault()
    event.stopPropagation()
    setIsScenarioReviewScrollbarDragging(true)

    const startX = event.clientX
    const startScrollLeft = el.scrollLeft
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    const maxThumbTravel = Math.max(1, track.clientWidth - event.currentTarget.clientWidth)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      el.scrollLeft = startScrollLeft + ((moveEvent.clientX - startX) / maxThumbTravel) * maxScrollLeft
    }

    const handlePointerUp = () => {
      setIsScenarioReviewScrollbarDragging(false)
      globalThis.removeEventListener('pointermove', handlePointerMove)
      globalThis.removeEventListener('pointerup', handlePointerUp)
    }

    globalThis.addEventListener('pointermove', handlePointerMove)
    globalThis.addEventListener('pointerup', handlePointerUp, { once: true })
  }

  const handleReset = () => {
    setScenarioGroupName(SCENARIO_DESIGN_REVIEW_DEFAULT_GROUP_NAME)
    setScenarioGroupDescription(reviewNarrative)
    setScenarioNarratives(defaultScenarioNarratives)
    setScenarioPossibilities(defaultScenarioPossibilities)
    setPossibilityErrorRowId(null)
    setTouchedFieldNames({})
    setTouchedScenarioNarrativeRows({})
    setResetKey((currentKey) => currentKey + 1)
    setSignpostResetKeys({})
    setSignpostModifiedRows({})
    setScenarioCardWidths({})
    setResetConfirmOpen(false)
    showSnackbar('모든 항목이 기본값으로 초기화되었습니다.', { variant: 'success' })
  }

  const handleCreate = () => {
    const nextTouchedScenarioNarrativeRows: Record<number, boolean> = {}

    rows.forEach((row) => {
      nextTouchedScenarioNarrativeRows[row.id] = true
    })

    setTouchedFieldNames({
      scenarioGroupName: true,
      scenarioGroupDescription: true,
    })
    setTouchedScenarioNarrativeRows(nextTouchedScenarioNarrativeRows)

    if (!canCreateScenarioGroup || !canCreateScenarioNarratives || !canCreateScenarioPossibilities) return

    onCreate({
      scenarioGroupName: scenarioGroupName.trim(),
      scenarioGroupDescription: scenarioGroupDescription.trim(),
      scenarioNarratives: rows.map((row) => ({
        rowId: row.id,
        narrative: (scenarioNarratives[row.id] ?? reviewNarrative).trim(),
      })),
      scenarioPossibilities: rows.map((row) => ({
        rowId: row.id,
        possibility: Number(scenarioPossibilities[row.id]) || 0,
      })),
    })
  }

  const showScenarioReviewScrollbars = isScenarioReviewScrollHovered || isScenarioReviewScrollbarDragging

  return (
    <>
      <Stack gap="24px" padding="24px 0">
        <ScenarioDesignReviewTextSection
          title="시나리오 그룹명"
          value={scenarioGroupName}
          maxLength={100}
          minHeight="68px"
          modified={scenarioGroupNameModified}
          editable
          loading={loading}
          errorMessage={scenarioGroupNameErrorMessage}
          resetKey={resetKey}
          onBlur={() => setTouchedFieldNames((current) => ({ ...current, scenarioGroupName: true }))}
          onChange={setScenarioGroupName}
          onReset={() => {
            setScenarioGroupName(SCENARIO_DESIGN_REVIEW_DEFAULT_GROUP_NAME)
            setTouchedFieldNames((current) => ({ ...current, scenarioGroupName: false }))
          }}
        />

        <ScenarioDesignReviewTextSection
          title="시나리오 그룹 설명"
          value={scenarioGroupDescription}
          maxLength={500}
          minHeight="160px"
          modified={scenarioGroupDescriptionModified}
          editable
          loading={loading}
          errorMessage={scenarioGroupDescriptionErrorMessage}
          resetKey={resetKey}
          onBlur={() => setTouchedFieldNames((current) => ({ ...current, scenarioGroupDescription: true }))}
          onChange={setScenarioGroupDescription}
          onReset={() => {
            setScenarioGroupDescription(reviewNarrative)
            setTouchedFieldNames((current) => ({ ...current, scenarioGroupDescription: false }))
          }}
        />

        <Stack gap="12px" width="100%" minWidth={0}>
          <Typography fontSize="18px" fontWeight={600} color="contentText.Black" lineHeight={1.4} padding="4px 8px">
            시나리오 검토
          </Typography>
          <Stack
            ref={scenarioReviewRootRef}
            position="relative"
            width="100%"
            minWidth={0}
            overflow="hidden"
            onMouseEnter={() => setIsScenarioReviewScrollHovered(true)}
            onMouseLeave={() => setIsScenarioReviewScrollHovered(false)}
            sx={{
              '--scenario-design-review-scroll-left-edge-opacity': 0,
              '--scenario-design-review-scroll-right-edge-opacity': 0,
              '--scenario-design-review-horizontal-thumb-left': '0%',
              '--scenario-design-review-horizontal-thumb-width': '0%',
            }}
          >
            <Stack
              ref={scenarioReviewScrollRef}
              direction="row"
              gap="0px"
              width="100%"
              minWidth={0}
              overflow="auto hidden"
              paddingBottom={scenarioReviewScrollLayoutState.horizontal ? '18px' : '0px'}
              sx={{
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              {rows.map((row, index) => {
                const scenarioNarrative = scenarioNarratives[row.id] ?? reviewNarrative
                const defaultScenarioNarrative = defaultScenarioNarratives[row.id] ?? reviewNarrative
                const scenarioNarrativeErrorMessage =
                  touchedScenarioNarrativeRows[row.id] && scenarioNarrative.trim().length === 0
                    ? '최소 1자 이상 입력해야 합니다.'
                    : undefined

                return (
                  <ScenarioDesignReviewScenarioCard
                    key={row.id}
                    row={row}
                    columns={columns}
                    narrative={scenarioNarrative}
                    cardWidth={scenarioCardWidths[row.id] ?? SCENARIO_DESIGN_REVIEW_CARD_DEFAULT_WIDTH}
                    showSplitter={index < rows.length - 1}
                    cardResizeDragging={activeScenarioCardSplitterIndex !== null}
                    splitterActive={activeScenarioCardSplitterIndex === index}
                    narrativeModified={scenarioNarrative !== defaultScenarioNarrative}
                    narrativeErrorMessage={scenarioNarrativeErrorMessage}
                    possibility={scenarioPossibilities[row.id] ?? '0'}
                    possibilityModified={(scenarioPossibilities[row.id] ?? '0') !== (defaultScenarioPossibilities[row.id] ?? '0')}
                    possibilityError={possibilityErrorRowId === row.id}
                    resetKey={resetKey}
                    signpostResetKey={signpostResetKeys[row.id] ?? 0}
                    signpostModified={Object.values(signpostModifiedRows[row.id] ?? {}).some(Boolean)}
                    onNarrativeBlur={() => setTouchedScenarioNarrativeRows((currentRows) => ({ ...currentRows, [row.id]: true }))}
                    onNarrativeChange={(value) => handleScenarioNarrativeChange(row.id, value)}
                    onNarrativeReset={() => handleScenarioNarrativeReset(row.id)}
                    onCardRef={(element) => {
                      scenarioCardRefs.current[row.id] = element
                    }}
                    onSplitterKeyDown={(event) => handleScenarioCardSplitterKeyDown(index, event)}
                    onSplitterPointerDown={(event) => handleScenarioCardSplitterPointerDown(index, event)}
                    onPossibilityChange={(value) => handlePossibilityChange(row.id, value)}
                    onPossibilityReset={() => handlePossibilityReset(row.id)}
                    onSignpostModifiedChange={handleSignpostModifiedChange}
                    onSignpostReset={() => handleSignpostReset(row.id)}
                  />
                )
              })}
            </Stack>
            <Stack
              aria-hidden
              position="absolute"
              top={0}
              left={0}
              bottom={scenarioReviewScrollLayoutState.horizontal ? '18px' : '0px'}
              width="100px"
              sx={{
                pointerEvents: 'none',
                background: 'linear-gradient(to right, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
                opacity: 'var(--scenario-design-review-scroll-left-edge-opacity)',
                transition: 'opacity 180ms ease',
                zIndex: 5,
              }}
            />
            <Stack
              aria-hidden
              position="absolute"
              top={0}
              right={0}
              bottom={scenarioReviewScrollLayoutState.horizontal ? '18px' : '0px'}
              width="100px"
              sx={{
                pointerEvents: 'none',
                background: 'linear-gradient(to left, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
                opacity: 'var(--scenario-design-review-scroll-right-edge-opacity)',
                transition: 'opacity 180ms ease',
                zIndex: 5,
              }}
            />
            {scenarioReviewScrollLayoutState.horizontal && (
              <Stack
                aria-hidden
                position="absolute"
                left={0}
                right={0}
                bottom="4px"
                height="10px"
                borderRadius="10px"
                bgcolor="transparent"
                sx={{
                  opacity: showScenarioReviewScrollbars ? 1 : 0,
                  pointerEvents: showScenarioReviewScrollbars ? 'auto' : 'none',
                  transition: 'opacity 120ms ease',
                  zIndex: 6,
                }}
              >
                <Stack
                  onPointerDown={handleScenarioReviewScrollbarPointerDown}
                  position="absolute"
                  top="2px"
                  bottom="2px"
                  left="var(--scenario-design-review-horizontal-thumb-left)"
                  width="var(--scenario-design-review-horizontal-thumb-width)"
                  borderRadius="10px"
                  bgcolor={isScenarioReviewScrollbarDragging ? '#868E96' : '#ADB5BD'}
                  sx={{
                    cursor: isScenarioReviewScrollbarDragging ? 'grabbing' : 'grab',
                    '&:hover': { bgcolor: '#868E96' },
                  }}
                />
              </Stack>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" minHeight="60px" padding="12px 0">
            <Stack direction="row" alignItems="center" gap="12px" minWidth={0}>
              <MIBaseButton
                variant="outlined"
                prefix={<ReplayRoundedIcon sx={{ fontSize: '20px' }} />}
                onClick={() => setResetConfirmOpen(true)}
                gap="4px"
                sx={{ height: '36px', borderRadius: '8px', flexShrink: 0 }}
              >
                전체 초기화
              </MIBaseButton>
              {!canCreateScenarioPossibilities && <ScenarioDesignReviewPossibilityWarning />}
            </Stack>

            <Stack direction="row" alignItems="center" gap="8px">
              <MIBaseButton variant="outlined" onClick={onCancel} sx={{ height: '36px', borderRadius: '8px' }}>
                취소
              </MIBaseButton>
              <MIBaseButton
                variant="contained"
                suffix={<ChevronRightRoundedIcon sx={{ fontSize: '20px' }} />}
                disabled={Boolean(
                  scenarioGroupNameErrorMessage ||
                    scenarioGroupDescriptionErrorMessage ||
                    hasScenarioNarrativeError ||
                    !canCreateScenarioPossibilities,
                )}
                onClick={handleCreate}
                labelColor="contentText.White"
                sx={{
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'mari.Primary',
                  '&:hover:not(:disabled)': {
                    backgroundColor: 'mari.Primary',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#C3CAEE',
                  },
                  '&.Mui-disabled .MuiTypography-root, &.Mui-disabled svg': {
                    color: 'contentText.White',
                  },
                }}
              >
                시나리오 그룹 생성
              </MIBaseButton>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      <ScenarioDesignReviewResetConfirmDialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} onConfirm={handleReset} />
    </>
  )
}

export default ScenarioDesignOneViewStep
