import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded'
import PercentRoundedIcon from '@mui/icons-material/PercentRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import { Collapse, Dialog, DialogActions, DialogContent, Divider, Stack, Typography, type TypographyProps } from '@mui/material'
import {
  type ChangeEvent,
  type CompositionEvent as ReactCompositionEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { DesignConfirmSignpost, DesignScenarioRow, ScenarioSignpostStrength } from '@/service/mi/nextGenMI/scenarioDesign'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIInputErrorIcon from '@/components/common/input/MIInputErrorIcon'
import MIMenu from '@/components/common/menu/MIMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import useSnackbar from '@/hooks/useSnackbar'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import {
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING,
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS,
  NEXT_GEN_MI_SCROLL_EDGE_CLIP_PATH_BOTTOM,
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMIResizableTextarea from '@/pages/mi/nextGenMI/components/common/NextGenMIResizableTextarea'
import ScenarioRoleBadge from '@/pages/mi/nextGenMI/components/common/ScenarioRoleBadge'
import {
  getScenarioDesignColumnDisplayValue,
  getScenarioDesignRowId,
  type ScenarioDesignColumn,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/scenarioDesignModel'

const SCENARIO_DESIGN_REVIEW_CARD_DEFAULT_WIDTH = 400
const SCENARIO_DESIGN_REVIEW_CARD_MIN_WIDTH = 320
const SCENARIO_DESIGN_REVIEW_CARD_MAX_WIDTH = 720
const SCENARIO_DESIGN_REVIEW_SPLITTER_WIDTH = 12
const SCENARIO_DESIGN_REVIEW_SIGNPOST_LABEL_MAX_LENGTH = 100

type ScenarioDesignReviewCreateValue = {
  scenarioGroupName: string
  scenarioGroupSummary: string
  scenarioGroupDescription: string
  scenarioNarratives: Array<{ rowId: number; narrative: string }>
  scenarioPossibilities: Array<{ rowId: number; possibility: number }>
  scenarioSignposts: Array<{ rowId: number; signposts: DesignConfirmSignpost[] }>
}

const scenarioDesignReviewSignpostImpactItems: Array<{ value: ScenarioSignpostStrength; label: string }> = [
  { value: 'verystrong', label: '매우 높음' },
  { value: 'strong', label: '높음' },
  { value: 'medium', label: '중간' },
  { value: 'weak', label: '낮음' },
  { value: 'veryweak', label: '매우 낮음' },
]

const createScenarioDesignReviewInitialPossibilities = (rows: DesignScenarioRow[]) => {
  const nextPossibilities: Record<number, string> = {}

  rows.forEach((row, index) => {
    nextPossibilities[getScenarioDesignRowId(row, index + 1)] = String(row.probability ?? 0)
  })

  return nextPossibilities
}

const createScenarioDesignReviewInitialNarratives = (rows: DesignScenarioRow[]) => {
  const nextNarratives: Record<number, string> = {}

  rows.forEach((row, index) => {
    nextNarratives[getScenarioDesignRowId(row, index + 1)] = row.narrative ?? ''
  })

  return nextNarratives
}

const createScenarioDesignReviewInitialSignposts = (rows: DesignScenarioRow[]) => {
  const nextSignposts: Record<number, DesignConfirmSignpost[]> = {}

  rows.forEach((row, rowIndex) => {
    nextSignposts[getScenarioDesignRowId(row, rowIndex + 1)] = (row.signposts ?? []).map((signpost, index) => ({
      signpostId: signpost.signpostId ?? null,
      label: signpost.label ?? '',
      direction: signpost.direction ?? 'sup',
      rationale: signpost.rationale ?? '',
      strength: signpost.strength ?? 'medium',
      displayOrder: signpost.displayOrder ?? index + 1,
      used: true,
    }))
  })

  return nextSignposts
}

const createScenarioDesignReviewCardWidths = (rows: DesignScenarioRow[], currentWidths: Record<number, number> = {}) => {
  const nextWidths: Record<number, number> = {}

  rows.forEach((row, index) => {
    const rowId = getScenarioDesignRowId(row, index + 1)
    nextWidths[rowId] = currentWidths[rowId] ?? SCENARIO_DESIGN_REVIEW_CARD_DEFAULT_WIDTH
  })

  return nextWidths
}

const getScenarioDesignReviewCardWidthChangeCapacity = (width: number, direction: number) =>
  direction > 0 ? SCENARIO_DESIGN_REVIEW_CARD_MAX_WIDTH - width : width - SCENARIO_DESIGN_REVIEW_CARD_MIN_WIDTH

const getScenarioDesignReviewCardWidthChangeCapacityTotal = (rows: DesignScenarioRow[], widths: Record<number, number>, change: number) => {
  const direction = Math.sign(change)
  if (direction === 0) return 0

  return rows.reduce(
    (total, row, index) =>
      total + Math.max(getScenarioDesignReviewCardWidthChangeCapacity(widths[getScenarioDesignRowId(row, index + 1)], direction), 0),
    0,
  )
}

const applyScenarioDesignReviewCardWidthChange = (
  rows: DesignScenarioRow[],
  sourceWidths: Record<number, number>,
  targetWidths: Record<number, number>,
  change: number,
) => {
  const direction = Math.sign(change)
  if (direction === 0) return

  let remainingChange = Math.abs(change)
  let adjustableRows = rows
    .map((row, index) => ({
      row,
      rowId: getScenarioDesignRowId(row, index + 1),
      capacity: Math.max(
        getScenarioDesignReviewCardWidthChangeCapacity(sourceWidths[getScenarioDesignRowId(row, index + 1)], direction),
        0,
      ),
    }))
    .filter(({ capacity }) => capacity > 0)

  while (remainingChange > 0.0001 && adjustableRows.length > 0) {
    const changePerRow = remainingChange / adjustableRows.length
    const nextAdjustableRows: Array<{ row: DesignScenarioRow; rowId: number; capacity: number }> = []

    adjustableRows.forEach(({ row, rowId, capacity }) => {
      const appliedChange = Math.min(changePerRow, capacity)
      targetWidths[rowId] += direction * appliedChange
      remainingChange -= appliedChange

      const nextCapacity = capacity - appliedChange
      if (nextCapacity > 0.0001) {
        nextAdjustableRows.push({ row, rowId, capacity: nextCapacity })
      }
    })

    adjustableRows = nextAdjustableRows
  }
}

const roundScenarioDesignReviewCardWidths = (rows: DesignScenarioRow[], widths: Record<number, number>, targetTotal: number) => {
  let assignedTotal = 0

  rows.forEach((row, index) => {
    const rowId = getScenarioDesignRowId(row, index + 1)
    const width = index === rows.length - 1 ? Math.round((targetTotal - assignedTotal) * 100) / 100 : Math.round(widths[rowId] * 100) / 100

    widths[rowId] = width
    assignedTotal += width
  })
}

const getScenarioDesignReviewResizedCardWidths = (
  rows: DesignScenarioRow[],
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
    leftRows.reduce((total, row, index) => total + widths[getScenarioDesignRowId(row, index + 1)], constrainedDelta),
  )
  roundScenarioDesignReviewCardWidths(
    rightRows,
    nextWidths,
    rightRows.reduce((total, row, index) => total + widths[getScenarioDesignRowId(row, index + 1)], -constrainedDelta),
  )

  return nextWidths
}

const getScenarioDesignReviewPossibilityTotal = (possibilities: Record<number, string>) =>
  Object.values(possibilities).reduce((total, value) => total + (Number(value) || 0), 0)

const getScenarioDesignReviewSingleLineValue = (value: string) => value.replace(/[\r\n]+/g, ' ')

const getScenarioDesignReviewScrollThumbSizePercent = (clientWidth: number, scrollWidth: number) =>
  scrollWidth > 0 ? Math.max((clientWidth / scrollWidth) * 100, 8) : 0

const getScenarioDesignReviewScrollThumbPositionPercent = (
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
  thumbWidth: number,
) => (scrollWidth > clientWidth ? (scrollLeft / (scrollWidth - clientWidth)) * (100 - thumbWidth) : 0)

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
      <Typography fontSize="16px" fontWeight={600} color="contentText.Black" lineHeight={1.4} flex="0 1 auto" minWidth={0} noWrap>
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
  errorMessage,
  ariaLabel,
  resetKey,
  preventLineBreak,
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
  errorMessage?: string
  ariaLabel?: string
  resetKey?: number
  preventLineBreak?: boolean
  onBlur?: () => void
  onChange?: (value: string) => void
}) => (
  <Stack gap="4px" width="100%" minWidth={0}>
    {editable ? (
      <NextGenMIResizableTextarea
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
        preventLineBreak={preventLineBreak}
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
        {value.length} / {maxLength}
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
  errorMessage,
  resetKey,
  preventLineBreak,
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
  errorMessage?: string
  resetKey?: number
  preventLineBreak?: boolean
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
        <Typography fontSize="18px" fontWeight={600} color="contentText.Black" lineHeight={1.4} flex="0 1 auto" minWidth={0} noWrap>
          {title}
        </Typography>
        {modified && <ScenarioDesignReviewModifiedBadge />}
      </Stack>
      {editable && <ScenarioDesignReviewResetButton disabled={!modified} onClick={onReset} />}
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
      errorMessage={errorMessage}
      preventLineBreak={preventLineBreak}
      onBlur={onBlur}
      onChange={onChange}
    />
  </Stack>
)

const ScenarioDesignReviewDataLoadingState = () => (
  <Stack
    role="status"
    aria-live="polite"
    aria-label="데이터를 로드 중입니다"
    width="100%"
    minWidth={0}
    height="600px"
    padding="20px"
    alignItems="center"
    justifyContent="center"
    boxSizing="border-box"
  >
    <Stack width="336px" maxWidth="100%" alignItems="center" gap="10px">
      <MIAgentSpinner
        size={24}
        tone="gray"
        sx={{
          '& svg': {
            width: '24px',
            height: '24px',
          },
        }}
      />
      <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} textAlign="center" width="100%" sx={{ wordBreak: 'break-word' }}>
        데이터를 로드 중입니다
      </Typography>
    </Stack>
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
  disabled = false,
  onChange,
}: {
  value: string
  hasError?: boolean
  disabled?: boolean
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
            disabled={disabled}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
            sx={{
              width: '100%',
              minWidth: 0,
              border: 0,
              outline: 'none',
              bgcolor: 'transparent',
              color: disabled ? 'contentText.Disabled' : 'contentText.Normal',
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

const ScenarioDesignReviewLoadingOverlay = ({ visible, message }: { visible: boolean; message: string }) => (
  <Stack
    position="absolute"
    top={0}
    right={0}
    bottom={0}
    left={0}
    gap="10px"
    alignItems="center"
    justifyContent="center"
    zIndex={8}
    aria-live="polite"
    sx={{
      backgroundColor: 'rgba(255, 255, 255, 0.72)',
      opacity: visible ? 1 : 0,
      visibility: visible ? 'visible' : 'hidden',
      transition: 'opacity 160ms ease, visibility 160ms ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}
  >
    <MIAgentSpinner size={40} tone="gray" />
    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} noWrap>
      {message}
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
  value: ScenarioSignpostStrength
  disabled?: boolean
  onChange: (value: ScenarioSignpostStrength) => void
}) => {
  const selectedItem = scenarioDesignReviewSignpostImpactItems.find((item) => item.value === value)

  return (
    <MISelectMenu<ScenarioSignpostStrength>
      selected={value}
      onSelected={onChange}
      items={scenarioDesignReviewSignpostImpactItems}
      variant="outlined"
      disabled={disabled}
      selectionIconPosition="left"
      enableHoverBackground
      closeOnScroll
      maxHeight="220px"
      textLabel={
        <Typography variant="body2M14" color={disabled ? 'contentText.Disabled' : 'contentText.Normal'} lineHeight={1.4} noWrap>
          {selectedItem?.label ?? ''}
        </Typography>
      }
      paperProps={{
        elevation: 0,
        sx: {
          minWidth: '120px',
        },
      }}
      sx={{
        width: '120px',
        minWidth: '120px',
        height: '34px',
        borderRadius: '8px',
        backgroundColor: disabled ? 'contentBG.Disabled' : 'commonColor.White',
        boxSizing: 'border-box',
        flexShrink: 0,
        padding: '6px 6px 6px 10px',
        '&:disabled': {
          backgroundColor: 'contentBG.Disabled',
        },
        '& .MuiSvgIcon-root': {
          fontSize: '20px',
          flexShrink: 0,
        },
      }}
    />
  )
}

const ScenarioDesignReviewDirectionField = () => (
  <MISelectMenu<string>
    selected="possibilityStrengthen"
    onSelected={() => undefined}
    items={[{ value: 'possibilityStrengthen', label: '가능성 강화' }]}
    variant="outlined"
    disabled
    textLabel={
      <Typography variant="body2M14" color="contentText.Disabled" lineHeight={1.4} noWrap>
        가능성 강화
      </Typography>
    }
    sx={{
      width: '120px',
      minWidth: '120px',
      height: '34px',
      borderRadius: '8px',
      backgroundColor: 'contentBG.Disabled',
      boxSizing: 'border-box',
      flexShrink: 0,
      padding: '6px 6px 6px 10px',
      '&:disabled': {
        backgroundColor: 'contentBG.Disabled',
      },
      '& .MuiSvgIcon-root': {
        fontSize: '20px',
        flexShrink: 0,
      },
    }}
  />
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
  signpost,
  resetKey,
  rowResetKey,
  readOnly = false,
  onModifiedChange,
  onValueChange,
}: {
  rowId: number
  index: number
  signpost: DesignConfirmSignpost
  resetKey: number
  rowResetKey: number
  readOnly?: boolean
  onModifiedChange?: (rowId: number, index: number, modified: boolean) => void
  onValueChange: (rowId: number, index: number, value: DesignConfirmSignpost) => void
}) => {
  const initialEnabled = signpost.used !== false
  const initialLabel = signpost.label?.trim() || 'Signpost'
  const initialImpact = signpost.strength ?? 'medium'
  const [menuOpen, setMenuOpen] = useState(false)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [label, setLabel] = useState(initialLabel)
  const [impact, setImpact] = useState<ScenarioSignpostStrength>(initialImpact)
  const [draftEnabled, setDraftEnabled] = useState(enabled)
  const [draftLabel, setDraftLabel] = useState(label)
  const [draftImpact, setDraftImpact] = useState<ScenarioSignpostStrength>(impact)
  const [draftLabelMaxLengthExceeded, setDraftLabelMaxLengthExceeded] = useState(false)
  const impactLabel = scenarioDesignReviewSignpostImpactItems.find((item) => item.value === impact)?.label ?? '높음'
  const displayLabel = label.trim() || 'Signpost'
  const draftChanged = draftEnabled !== enabled || draftLabel !== label || draftImpact !== impact
  const applyDisabled = !draftChanged || (draftEnabled && draftLabel.trim().length === 0)

  useEffect(() => {
    setMenuOpen(false)
    setEnabled(initialEnabled)
    setLabel(initialLabel)
    setImpact(initialImpact)
    setDraftEnabled(initialEnabled)
    setDraftLabel(initialLabel)
    setDraftImpact(initialImpact)
    setDraftLabelMaxLengthExceeded(false)
    onModifiedChange?.(rowId, index, false)
    onValueChange(rowId, index, {
      signpostId: signpost.signpostId ?? null,
      label: initialLabel,
      direction: signpost.direction ?? 'sup',
      rationale: signpost.rationale ?? '',
      strength: initialImpact,
      displayOrder: signpost.displayOrder ?? index + 1,
      used: initialEnabled,
    })
  }, [index, initialEnabled, initialImpact, initialLabel, onModifiedChange, onValueChange, resetKey, rowId, rowResetKey, signpost])

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDraftEnabled(enabled)
      setDraftLabel(label)
      setDraftImpact(impact)
      setDraftLabelMaxLengthExceeded(false)
    }
    setMenuOpen(open)
  }

  const handleCancel = () => {
    setDraftEnabled(enabled)
    setDraftLabel(label)
    setDraftImpact(impact)
    setDraftLabelMaxLengthExceeded(false)
    setMenuOpen(false)
  }

  const handleApply = () => {
    if (applyDisabled) return
    const nextLabel = draftLabel.trim() || 'Signpost'

    setEnabled(draftEnabled)
    setLabel(nextLabel)
    setImpact(draftImpact)
    setDraftLabelMaxLengthExceeded(false)
    onModifiedChange?.(rowId, index, draftEnabled !== initialEnabled || nextLabel !== initialLabel || draftImpact !== initialImpact)
    onValueChange(rowId, index, {
      signpostId: signpost.signpostId ?? null,
      label: nextLabel,
      direction: signpost.direction ?? 'sup',
      rationale: signpost.rationale ?? '',
      strength: draftImpact,
      displayOrder: signpost.displayOrder ?? index + 1,
      used: draftEnabled,
    })
    setMenuOpen(false)
  }

  const handleDraftLabelKeyDownCapture = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (
      !(event.target instanceof HTMLTextAreaElement) ||
      event.nativeEvent.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.key.length !== 1
    ) {
      return
    }

    const selectionLength = event.target.selectionEnd - event.target.selectionStart
    if (event.target.value.length - selectionLength >= SCENARIO_DESIGN_REVIEW_SIGNPOST_LABEL_MAX_LENGTH) {
      setDraftLabelMaxLengthExceeded(true)
    }
  }

  const handleDraftLabelCompositionStartCapture = (event: ReactCompositionEvent<HTMLElement>) => {
    if (!(event.target instanceof HTMLTextAreaElement)) return

    const selectionLength = event.target.selectionEnd - event.target.selectionStart
    if (event.target.value.length - selectionLength >= SCENARIO_DESIGN_REVIEW_SIGNPOST_LABEL_MAX_LENGTH) {
      setDraftLabelMaxLengthExceeded(true)
    }
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
          disabled={readOnly}
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
                <ScenarioDesignReviewSwitch
                  checked={draftEnabled}
                  onClick={() => {
                    setDraftEnabled((current) => !current)
                    setDraftLabelMaxLengthExceeded(false)
                  }}
                />
              </Stack>
              <ScenarioDesignReviewPanelDivider />

              <Stack gap="8px" width="100%" padding="4px 12px" borderRadius="10px" boxSizing="border-box">
                <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4} noWrap>
                  Signpost Label
                </Typography>
                <Stack gap="4px" width="100%">
                  <Stack
                    onCompositionStartCapture={handleDraftLabelCompositionStartCapture}
                    onKeyDownCapture={handleDraftLabelKeyDownCapture}
                    sx={
                      draftLabelMaxLengthExceeded
                        ? {
                          '& .next-gen-mi-resizable-textarea, & .next-gen-mi-resizable-textarea:focus-within': {
                            borderColor: 'contentBorder.Error',
                          },
                        }
                        : undefined
                    }
                  >
                    <NextGenMIResizableTextarea
                      ariaLabel="Signpost Label"
                      value={draftLabel}
                      maxLength={SCENARIO_DESIGN_REVIEW_SIGNPOST_LABEL_MAX_LENGTH}
                      minHeight="64px"
                      minResizeHeight="48px"
                      maxHeight="900px"
                      resetKey={resetKey}
                      disabled={!draftEnabled}
                      borderColor={
                        !draftEnabled
                          ? 'contentBorder.Disabled'
                          : draftLabelMaxLengthExceeded
                            ? 'contentBorder.Error'
                            : 'contentBorder.Normal'
                      }
                      bgcolor={draftEnabled ? 'commonColor.White' : 'contentBG.Disabled'}
                      color={draftEnabled ? 'contentText.Normal' : 'contentText.Disabled'}
                      padding="12px"
                      hoverBgcolor="contentBG.Hover"
                      onChange={(value) => {
                        setDraftLabel(value)
                        if (value.length < SCENARIO_DESIGN_REVIEW_SIGNPOST_LABEL_MAX_LENGTH) {
                          setDraftLabelMaxLengthExceeded(false)
                        }
                      }}
                      onMaxLengthExceeded={() => setDraftLabelMaxLengthExceeded(true)}
                    />
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" height="18px" padding="0 8px">
                    {draftLabelMaxLengthExceeded ? (
                      <Typography variant="body3M12" color="contentText.Error" lineHeight={1.5} noWrap>
                        최대 {SCENARIO_DESIGN_REVIEW_SIGNPOST_LABEL_MAX_LENGTH}자 입력 가능
                      </Typography>
                    ) : (
                      <Stack width="58px" height="18px" flexShrink={0} />
                    )}
                    <Typography
                      variant="body3M12"
                      color={
                        !draftEnabled ? 'contentText.Disabled' : draftLabelMaxLengthExceeded ? 'contentText.Error' : 'contentText.Subtext'
                      }
                      lineHeight={1.5}
                      noWrap
                    >
                      {draftLabel.length} / {SCENARIO_DESIGN_REVIEW_SIGNPOST_LABEL_MAX_LENGTH}
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
  rowId,
  row,
  columns,
  signposts,
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
  readOnly = false,
  onNarrativeBlur,
  onNarrativeChange,
  onNarrativeReset,
  onCardRef,
  onSplitterKeyDown,
  onSplitterPointerDown,
  onPossibilityChange,
  onPossibilityReset,
  onSignpostModifiedChange,
  onSignpostValueChange,
  onSignpostReset,
}: {
  rowId: number
  row: DesignScenarioRow
  columns: ScenarioDesignColumn[]
  signposts: DesignConfirmSignpost[]
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
  readOnly?: boolean
  onNarrativeBlur: () => void
  onNarrativeChange: (value: string) => void
  onNarrativeReset: () => void
  onCardRef: (element: HTMLDivElement | null) => void
  onSplitterKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void
  onSplitterPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  onPossibilityChange: (value: string) => void
  onPossibilityReset: () => void
  onSignpostModifiedChange: (rowId: number, index: number, modified: boolean) => void
  onSignpostValueChange: (rowId: number, index: number, value: DesignConfirmSignpost) => void
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
      <Stack data-scenario-design-review-card-title="true" gap="6px" padding="6px 8px 12px" minHeight="95px">
        <Stack direction="row" alignItems="center" gap="4px">
          {row.displayOrder !== undefined && <NextGenMIDisplayOrderBadge value={row.displayOrder} height="21px" />}
          {row.baseCase && <NextGenMIBaseCaseChip height="21px" padding="2px 6px" />}
          {!row.baseCase && (row.scenarioRole || row.scenarioRoleLabel || row.scenarioType) && (
            <ScenarioRoleBadge role={row.scenarioRole} label={row.scenarioRoleLabel} type={row.scenarioType} />
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
          {row.scenarioName ?? ''}
        </Typography>
      </Stack>
      <Divider />

      <Stack gap="6px" padding="24px 0">
        <ScenarioDesignReviewSectionHeader
          title="시나리오 내러티브"
          modified={narrativeModified}
          resetDisabled={!narrativeModified}
          showReset={!readOnly}
          onReset={onNarrativeReset}
        />
        <ScenarioDesignReviewParagraphField
          ariaLabel={`${row.scenarioName || '시나리오'} 내러티브`}
          value={narrative}
          maxLength={500}
          minHeight="194px"
          minResizeHeight="120px"
          maxHeight="600px"
          editable={!readOnly}
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
              value={getScenarioDesignColumnDisplayValue(column, row)}
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
          showReset={!readOnly}
          onReset={onPossibilityReset}
        />
        <ScenarioDesignReviewPossibilityField
          value={possibility}
          hasError={possibilityError}
          disabled={readOnly}
          onChange={onPossibilityChange}
        />
      </Stack>
      <Divider />

      <Stack gap="6px" padding="24px 0 0">
        <ScenarioDesignReviewSectionHeader
          title="주요 Signpost"
          modified={signpostModified}
          resetDisabled={!signpostModified}
          showReset={!readOnly}
          onReset={onSignpostReset}
        />
        <Stack gap="8px">
          {signposts.length === 0 ? (
            <Typography variant="body2M14" color="contentText.Subtext" lineHeight={1.5} padding="10px 12px">
              Signpost 데이터가 없습니다.
            </Typography>
          ) : (
            signposts.map((signpost, index) => (
              <ScenarioDesignReviewSignpost
                key={signpost.signpostId ?? signpost.displayOrder ?? index}
                rowId={rowId}
                index={index}
                signpost={signpost}
                resetKey={resetKey}
                rowResetKey={signpostResetKey}
                readOnly={readOnly}
                onModifiedChange={onSignpostModifiedChange}
                onValueChange={onSignpostValueChange}
              />
            ))
          )}
        </Stack>
      </Stack>
    </Stack>
    {showSplitter && !readOnly && (
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
  rows: DesignScenarioRow[]
  columns: ScenarioDesignColumn[]
  groupName: string
  groupSummary: string
  groupDescription: string
  loading: boolean
  readOnly?: boolean
  creatingScenarioGroup?: boolean
  onCancel: () => void
  onCreate: (value: ScenarioDesignReviewCreateValue) => void
}

const ScenarioDesignOneViewStep = ({
  rows,
  columns,
  groupName,
  groupSummary,
  groupDescription,
  loading,
  readOnly = false,
  creatingScenarioGroup = false,
  onCancel,
  onCreate,
}: ScenarioDesignOneViewStepProps) => {
  const { showSnackbar } = useSnackbar()
  const defaultScenarioPossibilities = useMemo(() => createScenarioDesignReviewInitialPossibilities(rows), [rows])
  const defaultScenarioNarratives = useMemo(() => createScenarioDesignReviewInitialNarratives(rows), [rows])
  const defaultScenarioSignposts = useMemo(() => createScenarioDesignReviewInitialSignposts(rows), [rows])
  const defaultScenarioGroupName = useMemo(() => getScenarioDesignReviewSingleLineValue(groupName), [groupName])
  const previousGroupNameRef = useRef(defaultScenarioGroupName)
  const previousGroupDescriptionRef = useRef(groupDescription)
  const [scenarioGroupName, setScenarioGroupName] = useState(defaultScenarioGroupName)
  const [scenarioGroupDescription, setScenarioGroupDescription] = useState(groupDescription)
  const [scenarioNarratives, setScenarioNarratives] = useState<Record<number, string>>(() => defaultScenarioNarratives)
  const [scenarioPossibilities, setScenarioPossibilities] = useState<Record<number, string>>(() => defaultScenarioPossibilities)
  const [scenarioSignposts, setScenarioSignposts] = useState<Record<number, DesignConfirmSignpost[]>>(() => defaultScenarioSignposts)
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
  const scenarioReviewActionBarRef = useRef<HTMLDivElement | null>(null)
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
  const scenarioGroupNameModified = scenarioGroupName !== defaultScenarioGroupName
  const scenarioGroupDescriptionModified = scenarioGroupDescription !== groupDescription
  const scenarioReviewResetDisabled = useMemo(
    () =>
      !scenarioGroupNameModified &&
      !scenarioGroupDescriptionModified &&
      rows.every((row, index) => {
        const rowId = getScenarioDesignRowId(row, index + 1)
        return (scenarioNarratives[rowId] ?? '') === (defaultScenarioNarratives[rowId] ?? '')
      }) &&
      rows.every((row, index) => {
        const rowId = getScenarioDesignRowId(row, index + 1)
        return (scenarioPossibilities[rowId] ?? '0') === (defaultScenarioPossibilities[rowId] ?? '0')
      }) &&
      rows.every(
        (row, index) =>
          (scenarioCardWidths[getScenarioDesignRowId(row, index + 1)] ?? SCENARIO_DESIGN_REVIEW_CARD_DEFAULT_WIDTH) ===
          SCENARIO_DESIGN_REVIEW_CARD_DEFAULT_WIDTH,
      ) &&
      !Object.values(signpostModifiedRows).some((modifiedRows) => Object.values(modifiedRows).some(Boolean)),
    [
      defaultScenarioNarratives,
      defaultScenarioPossibilities,
      rows,
      scenarioCardWidths,
      scenarioGroupDescriptionModified,
      scenarioGroupNameModified,
      scenarioNarratives,
      scenarioPossibilities,
      signpostModifiedRows,
    ],
  )
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
    () => rows.every((row, index) => (scenarioNarratives[getScenarioDesignRowId(row, index + 1)] ?? '').trim().length > 0),
    [rows, scenarioNarratives],
  )
  const hasScenarioNarrativeError = useMemo(
    () =>
      rows.some((row, index) => {
        const rowId = getScenarioDesignRowId(row, index + 1)
        return touchedScenarioNarrativeRows[rowId] && (scenarioNarratives[rowId] ?? '').trim().length === 0
      }),
    [rows, scenarioNarratives, touchedScenarioNarrativeRows],
  )
  const possibilityTotal = useMemo(() => getScenarioDesignReviewPossibilityTotal(scenarioPossibilities), [scenarioPossibilities])
  const canCreateScenarioPossibilities = possibilityTotal === 100 && possibilityErrorRowId === null
  const interactionDisabled = loading || creatingScenarioGroup || readOnly

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
    const previousGroupName = previousGroupNameRef.current
    const previousGroupDescription = previousGroupDescriptionRef.current

    setScenarioGroupName((currentName) => {
      if (currentName !== previousGroupName) return currentName
      return defaultScenarioGroupName
    })
    setScenarioGroupDescription((currentDescription) => {
      if (currentDescription !== previousGroupDescription) return currentDescription
      return groupDescription
    })
    setScenarioNarratives((currentNarratives) => {
      const nextNarratives: Record<number, string> = {}

      rows.forEach((row, index) => {
        const rowId = getScenarioDesignRowId(row, index + 1)
        const currentNarrative = currentNarratives[rowId]
        const defaultNarrative = defaultScenarioNarratives[rowId] ?? ''
        nextNarratives[rowId] = currentNarrative === undefined ? defaultNarrative : currentNarrative
      })

      return nextNarratives
    })
    setScenarioSignposts((currentSignposts) => {
      const nextSignposts: Record<number, DesignConfirmSignpost[]> = {}

      rows.forEach((row, index) => {
        const rowId = getScenarioDesignRowId(row, index + 1)
        nextSignposts[rowId] = currentSignposts[rowId] ?? defaultScenarioSignposts[rowId] ?? []
      })

      return nextSignposts
    })
    previousGroupNameRef.current = defaultScenarioGroupName
    previousGroupDescriptionRef.current = groupDescription
  }, [defaultScenarioGroupName, defaultScenarioNarratives, defaultScenarioSignposts, groupDescription, rows])

  useEffect(() => {
    setScenarioPossibilities((currentPossibilities) => {
      const nextPossibilities: Record<number, string> = {}
      rows.forEach((row, index) => {
        const rowId = getScenarioDesignRowId(row, index + 1)
        nextPossibilities[rowId] = currentPossibilities[rowId] ?? defaultScenarioPossibilities[rowId] ?? '0'
      })
      return nextPossibilities
    })

    setPossibilityErrorRowId(null)
    setTouchedScenarioNarrativeRows((currentRows) => {
      const rowIds = new Set(rows.map((row, index) => getScenarioDesignRowId(row, index + 1)))
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
    const rowIds = new Set(rows.map((row, index) => getScenarioDesignRowId(row, index + 1)))
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
  }, [columns.length, loading, rows.length])

  useLayoutEffect(() => {
    const actionBar = scenarioReviewActionBarRef.current
    if (!actionBar) return undefined

    const scrollContainer = document.getElementById('main-scroll-wrapper')
    let rafId: number | null = null

    const updateActionBarStickyState = () => {
      rafId = null

      const scrollContainerRect = scrollContainer?.getBoundingClientRect()
      const scrollBottom = scrollContainerRect?.bottom ?? window.innerHeight
      const actionBarStickyTop = scrollBottom - actionBar.offsetHeight
      const reviewCardTitle = scenarioReviewRootRef.current?.querySelector('[data-scenario-design-review-card-title]')
      const reviewCardTitleBottom =
        reviewCardTitle instanceof HTMLElement ? reviewCardTitle.getBoundingClientRect().bottom : actionBarStickyTop
      const offsetY = Math.max(0, Math.ceil(reviewCardTitleBottom - actionBarStickyTop))
      const previousElement = actionBar.previousElementSibling
      const parentStyle = actionBar.parentElement ? getComputedStyle(actionBar.parentElement) : null
      const parentRowGap = parentStyle ? Number.parseFloat(parentStyle.rowGap) || 0 : 0
      const actionBarNaturalTop =
        previousElement instanceof HTMLElement
          ? previousElement.getBoundingClientRect().bottom + parentRowGap
          : actionBar.getBoundingClientRect().top

      actionBar.style.setProperty('--scenario-design-review-action-bar-y', `${offsetY}px`)
      actionBar.toggleAttribute('data-scenario-design-action-bar-sticky', actionBarNaturalTop > actionBarStickyTop + offsetY + 0.5)
    }

    const scheduleActionBarStickyStateUpdate = () => {
      if (rafId !== null) return

      rafId = requestAnimationFrame(updateActionBarStickyState)
    }

    const resizeObserver = new ResizeObserver(scheduleActionBarStickyStateUpdate)
    resizeObserver.observe(actionBar)
    if (actionBar.parentElement) resizeObserver.observe(actionBar.parentElement)
    if (scenarioReviewRootRef.current) resizeObserver.observe(scenarioReviewRootRef.current)
    if (scrollContainer) resizeObserver.observe(scrollContainer)

    const scrollTarget: HTMLElement | Window = scrollContainer ?? window
    scrollTarget.addEventListener('scroll', scheduleActionBarStickyStateUpdate, { passive: true })
    window.addEventListener('resize', scheduleActionBarStickyStateUpdate)
    scheduleActionBarStickyStateUpdate()

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      scrollTarget.removeEventListener('scroll', scheduleActionBarStickyStateUpdate)
      window.removeEventListener('resize', scheduleActionBarStickyStateUpdate)
      actionBar.style.removeProperty('--scenario-design-review-action-bar-y')
      actionBar.removeAttribute('data-scenario-design-action-bar-sticky')
    }
  }, [loading, rows.length])

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
      [rowId]: defaultScenarioNarratives[rowId] ?? '',
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

  const handleSignpostValueChange = useCallback((rowId: number, index: number, value: DesignConfirmSignpost) => {
    setScenarioSignposts((currentRows) => {
      const nextRows = { ...currentRows }
      const nextSignposts = [...(nextRows[rowId] ?? [])]

      if (JSON.stringify(nextSignposts[index]) === JSON.stringify(value)) return currentRows

      nextSignposts[index] = value
      nextRows[rowId] = nextSignposts
      return nextRows
    })
  }, [])

  const handleSignpostReset = (rowId: number) => {
    setSignpostResetKeys((currentKeys) => ({ ...currentKeys, [rowId]: (currentKeys[rowId] ?? 0) + 1 }))
    setScenarioSignposts((currentRows) => ({
      ...currentRows,
      [rowId]: defaultScenarioSignposts[rowId] ?? [],
    }))
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
    setScenarioGroupName(defaultScenarioGroupName)
    setScenarioGroupDescription(groupDescription)
    setScenarioNarratives(defaultScenarioNarratives)
    setScenarioPossibilities(defaultScenarioPossibilities)
    setScenarioSignposts(defaultScenarioSignposts)
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

    rows.forEach((row, index) => {
      nextTouchedScenarioNarrativeRows[getScenarioDesignRowId(row, index + 1)] = true
    })

    setTouchedFieldNames({
      scenarioGroupName: true,
      scenarioGroupDescription: true,
    })
    setTouchedScenarioNarrativeRows(nextTouchedScenarioNarrativeRows)

    if (!canCreateScenarioGroup || !canCreateScenarioNarratives || !canCreateScenarioPossibilities) return

    onCreate({
      scenarioGroupName: getScenarioDesignReviewSingleLineValue(scenarioGroupName).trim(),
      scenarioGroupSummary: groupSummary,
      scenarioGroupDescription: scenarioGroupDescription.trim(),
      scenarioNarratives: rows.map((row, index) => {
        const rowId = getScenarioDesignRowId(row, index + 1)
        return {
          rowId,
          narrative: (scenarioNarratives[rowId] ?? '').trim(),
        }
      }),
      scenarioPossibilities: rows.map((row, index) => {
        const rowId = getScenarioDesignRowId(row, index + 1)
        return {
          rowId,
          possibility: Number(scenarioPossibilities[rowId]) || 0,
        }
      }),
      scenarioSignposts: rows.map((row, index) => ({
        rowId: getScenarioDesignRowId(row, index + 1),
        signposts: scenarioSignposts[getScenarioDesignRowId(row, index + 1)] ?? [],
      })),
    })
  }

  const showScenarioReviewScrollbars = isScenarioReviewScrollHovered || isScenarioReviewScrollbarDragging

  return (
    <>
      <Stack position="relative" width="100%" minWidth={0}>
        <Stack padding="24px 0">
          <Collapse
            in={loading}
            timeout={{ enter: 220, exit: 240 }}
            unmountOnExit
            sx={{ width: '100%', '& .MuiCollapse-wrapperInner': { width: '100%' } }}
          >
            <ScenarioDesignReviewDataLoadingState />
          </Collapse>
          <Collapse
            in={!loading}
            timeout={{ enter: 520, exit: 160 }}
            mountOnEnter
            unmountOnExit
            sx={{ width: '100%', '& .MuiCollapse-wrapperInner': { width: '100%' } }}
          >
            <Stack
              gap="24px"
              sx={{
                animation: 'scenarioDesignReviewContentReveal 360ms ease 120ms both',
                '@keyframes scenarioDesignReviewContentReveal': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(8px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0px)',
                  },
                },
              }}
            >
              <ScenarioDesignReviewTextSection
                title="시나리오 그룹명"
                value={scenarioGroupName}
                maxLength={100}
                minHeight="68px"
                modified={scenarioGroupNameModified}
                editable={!readOnly}
                errorMessage={scenarioGroupNameErrorMessage}
                resetKey={resetKey}
                preventLineBreak
                onBlur={() => setTouchedFieldNames((current) => ({ ...current, scenarioGroupName: true }))}
                onChange={(value) => setScenarioGroupName(getScenarioDesignReviewSingleLineValue(value))}
                onReset={() => {
                  setScenarioGroupName(defaultScenarioGroupName)
                  setTouchedFieldNames((current) => ({ ...current, scenarioGroupName: false }))
                }}
              />

              <ScenarioDesignReviewTextSection
                title="시나리오 그룹 설명"
                value={scenarioGroupDescription}
                maxLength={500}
                minHeight="160px"
                modified={scenarioGroupDescriptionModified}
                editable={!readOnly}
                errorMessage={scenarioGroupDescriptionErrorMessage}
                resetKey={resetKey}
                onBlur={() => setTouchedFieldNames((current) => ({ ...current, scenarioGroupDescription: true }))}
                onChange={setScenarioGroupDescription}
                onReset={() => {
                  setScenarioGroupDescription(groupDescription)
                  setTouchedFieldNames((current) => ({ ...current, scenarioGroupDescription: false }))
                }}
              />

              <Stack gap="12px" width="100%" minWidth={0} padding="12px">
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
                      const rowId = getScenarioDesignRowId(row, index + 1)
                      const scenarioNarrative = scenarioNarratives[rowId] ?? ''
                      const defaultScenarioNarrative = defaultScenarioNarratives[rowId] ?? ''
                      const scenarioNarrativeErrorMessage =
                        touchedScenarioNarrativeRows[rowId] && scenarioNarrative.trim().length === 0
                          ? '최소 1자 이상 입력해야 합니다.'
                          : undefined

                      return (
                        <ScenarioDesignReviewScenarioCard
                          key={rowId}
                          rowId={rowId}
                          row={row}
                          columns={columns}
                          signposts={defaultScenarioSignposts[rowId] ?? []}
                          narrative={scenarioNarrative}
                          cardWidth={scenarioCardWidths[rowId] ?? SCENARIO_DESIGN_REVIEW_CARD_DEFAULT_WIDTH}
                          showSplitter={index < rows.length - 1}
                          cardResizeDragging={activeScenarioCardSplitterIndex !== null}
                          splitterActive={activeScenarioCardSplitterIndex === index}
                          narrativeModified={scenarioNarrative !== defaultScenarioNarrative}
                          narrativeErrorMessage={scenarioNarrativeErrorMessage}
                          possibility={scenarioPossibilities[rowId] ?? '0'}
                          possibilityModified={(scenarioPossibilities[rowId] ?? '0') !== (defaultScenarioPossibilities[rowId] ?? '0')}
                          possibilityError={possibilityErrorRowId === rowId}
                          resetKey={resetKey}
                          signpostResetKey={signpostResetKeys[rowId] ?? 0}
                          signpostModified={Object.values(signpostModifiedRows[rowId] ?? {}).some(Boolean)}
                          readOnly={readOnly}
                          onNarrativeBlur={() => setTouchedScenarioNarrativeRows((currentRows) => ({ ...currentRows, [rowId]: true }))}
                          onNarrativeChange={(value) => handleScenarioNarrativeChange(rowId, value)}
                          onNarrativeReset={() => handleScenarioNarrativeReset(rowId)}
                          onCardRef={(element) => {
                            scenarioCardRefs.current[rowId] = element
                          }}
                          onSplitterKeyDown={(event) => handleScenarioCardSplitterKeyDown(index, event)}
                          onSplitterPointerDown={(event) => handleScenarioCardSplitterPointerDown(index, event)}
                          onPossibilityChange={(value) => handlePossibilityChange(rowId, value)}
                          onPossibilityReset={() => handlePossibilityReset(rowId)}
                          onSignpostModifiedChange={handleSignpostModifiedChange}
                          onSignpostValueChange={handleSignpostValueChange}
                          onSignpostReset={() => handleSignpostReset(rowId)}
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

                <Stack
                  ref={scenarioReviewActionBarRef}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  minHeight="60px"
                  position="sticky"
                  bottom="0px"
                  zIndex={8}
                  bgcolor="commonColor.White"
                  sx={{
                    transform: 'translateY(var(--scenario-design-review-action-bar-y, 0px))',
                    boxShadow: 'none',
                    clipPath: NEXT_GEN_MI_SCROLL_EDGE_CLIP_PATH_BOTTOM,
                    transition: `box-shadow ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS}ms ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING}`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      height: '1px',
                      bgcolor: '#DEE2E6',
                      opacity: 0,
                      pointerEvents: 'none',
                      zIndex: 1,
                      transition: `opacity ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS}ms ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING}`,
                    },
                    '&[data-scenario-design-action-bar-sticky]': {
                      boxShadow: NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
                    },
                    '&[data-scenario-design-action-bar-sticky]::before': {
                      opacity: 1,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" gap="12px" minWidth={0}>
                    <MIBaseButton
                      variant="outlined"
                      prefix={<ReplayRoundedIcon sx={{ fontSize: '20px' }} />}
                      disabled={interactionDisabled || scenarioReviewResetDisabled}
                      onClick={() => setResetConfirmOpen(true)}
                      gap="4px"
                      sx={{ height: '36px', borderRadius: '8px', flexShrink: 0 }}
                    >
                      전체 초기화
                    </MIBaseButton>
                    {!interactionDisabled && !canCreateScenarioPossibilities && <ScenarioDesignReviewPossibilityWarning />}
                  </Stack>

                  <Stack direction="row" alignItems="center" gap="8px">
                    <MIBaseButton variant="outlined" disabled={readOnly} onClick={onCancel} sx={{ height: '36px', borderRadius: '8px' }}>
                      취소
                    </MIBaseButton>
                    <MIBaseButton
                      variant="contained"
                      suffix={<ChevronRightRoundedIcon sx={{ fontSize: '20px' }} />}
                      disabled={Boolean(
                        interactionDisabled ||
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
          </Collapse>
        </Stack>
        <ScenarioDesignReviewLoadingOverlay visible={creatingScenarioGroup} message="시나리오 그룹을 생성하고 있습니다" />
      </Stack>
      <ScenarioDesignReviewResetConfirmDialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} onConfirm={handleReset} />
    </>
  )
}

export default ScenarioDesignOneViewStep
