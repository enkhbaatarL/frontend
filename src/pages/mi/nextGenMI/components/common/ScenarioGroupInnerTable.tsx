import { Box, Stack, Typography } from '@mui/material'
import { memo, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { IScenarioDimension, IScenarioDimensionColumn, ScenarioJudgementStatus } from '@/service/mi/nextGenMI/scenarioGroup'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioPossibilityGauge from '@/pages/mi/nextGenMI/components/common/ScenarioPossibilityGauge'
import { getNextGenMIScenarioGroupDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

const SCENARIO_JUDGEMENT_ITEMS: { value: ScenarioJudgementStatus; label: string }[] = [
  { value: 'pending', label: '대기' },
  { value: 'realized', label: '실현' },
  { value: 'discarded', label: '폐기' },
]

const getScenarioJudgementLabel = (status?: ScenarioJudgementStatus, statusLabel?: string) =>
  statusLabel?.trim() || SCENARIO_JUDGEMENT_ITEMS.find((item) => item.value === status)?.label || '-'

const getScenarioJudgementTextColor = (status?: ScenarioJudgementStatus) => {
  if (status === 'discarded') return 'contentText.Disabled'
  if (status === 'realized') return 'mari.Primary'
  return 'contentText.Black'
}

const ScenarioTableBadge = ({ label, disabled = false }: { label: string; disabled?: boolean }) => (
  <Box
    component="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    padding="2px 6px"
    borderRadius="8px"
    boxSizing="border-box"
    bgcolor={disabled ? (label === 'BC' ? 'contentIcon.Disabled' : 'contentBG.Disabled') : 'mari.Primary'}
    color={disabled && label !== 'BC' ? 'contentText.Disabled' : 'commonColor.White'}
  >
    <Typography component="span" color="inherit" fontSize="12px" fontWeight={600} lineHeight={1.4} noWrap>
      {label}
    </Typography>
  </Box>
)

const DisabledScenarioPossibilityGauge = () => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" width="36px" height="6px">
    {[0, 1, 2, 3, 4].map((index) => (
      <Box key={index} width="6px" height="6px" borderRadius="2px" bgcolor="contentIcon.Disabled" />
    ))}
  </Stack>
)

const ScenarioJudgementText = ({ status, label }: { status?: ScenarioJudgementStatus; label?: string }) => (
  <Stack height="32px" alignItems="center" justifyContent="center" padding="0 10px" borderRadius="8px">
    <Typography variant="body2M14" color={getScenarioJudgementTextColor(status)} noWrap>
      {getScenarioJudgementLabel(status, label)}
    </Typography>
  </Stack>
)

type ScenarioJudgementSelectProps = {
  value: ScenarioJudgementStatus
  disabled?: boolean
  onSelect: (next: ScenarioJudgementStatus) => void
}

const ScenarioJudgementSelect = ({ value, disabled = false, onSelect }: ScenarioJudgementSelectProps) => {
  const [open, setOpen] = useState(false)
  const currentLabel = SCENARIO_JUDGEMENT_ITEMS.find((item) => item.value === value)?.label ?? '대기'

  return (
    <MISelectMenu<ScenarioJudgementStatus>
      variant="outlined"
      selectionIconPosition="left"
      selected={value}
      onSelected={(next: ScenarioJudgementStatus) => {
        if (next !== value) onSelect(next)
      }}
      items={SCENARIO_JUDGEMENT_ITEMS.map(({ value: itemValue, label }) => ({ value: itemValue, label }))}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      placement="bottom-end"
      closeOnScroll
      paperProps={{ sx: { width: '152px' } }}
      textLabel={
        <Typography variant="body2M14" color="contentText.Black" noWrap>
          {currentLabel}
        </Typography>
      }
      sx={{
        height: '32px',
        minWidth: '72px',
        padding: '0 6px 0 10px',
        borderRadius: '8px',
        backgroundColor: open ? 'gray.5' : 'commonColor.White',
        borderColor: open ? 'contentBorder.Active' : 'contentBorder.Normal',
        '&:hover:not(:disabled)': { backgroundColor: 'gray.5', borderColor: 'contentBorder.Active' },
        '& .MuiSvgIcon-root': { fontSize: '20px' },
      }}
    />
  )
}

type JudgementConfirmCopy = {
  title: string
  body: string
  confirmLabel: string
}

const JUDGEMENT_CONFIRM_COPY: Record<ScenarioJudgementStatus, JudgementConfirmCopy> = {
  pending: {
    title: '대기로 변경하시겠습니까?',
    body: '이 시나리오는 아직 실현 또는 폐기로 판정되지 않은 상태로 유지됩니다.',
    confirmLabel: '대기로 변경',
  },
  realized: {
    title: '실현으로 판정하시겠습니까?',
    body: '이 시나리오는 해당 이벤트의 실제 전개로 기록됩니다.',
    confirmLabel: '실현으로 판정',
  },
  discarded: {
    title: '폐기하시겠습니까?',
    body: '이 시나리오는 후보에서 제외됩니다. 모든 시나리오가 폐기되면 새 시나리오를 설계할 수 있습니다.',
    confirmLabel: '폐기',
  },
}

type ScenarioJudgementConfirmDialogProps = {
  open: boolean
  targetStatus: ScenarioJudgementStatus | null
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ScenarioJudgementConfirmDialog = ({
  open,
  targetStatus,
  pending = false,
  onConfirm,
  onCancel,
}: ScenarioJudgementConfirmDialogProps) => {
  const copy = targetStatus ? JUDGEMENT_CONFIRM_COPY[targetStatus] : null

  return (
    <MIConfirm
      open={open}
      title={copy?.title ?? ''}
      width="440px"
      handleClose={onCancel}
      disableClose={pending}
      actions={[
        { label: '취소', variant: 'outlined', color: 'gray', disabled: pending, onClick: onCancel },
        { label: copy?.confirmLabel ?? '확인', variant: 'filled', color: 'primary', disabled: pending, onClick: onConfirm },
      ]}
    >
      <Typography variant="body1M16" color="contentText.Normal" lineHeight={1.6}>
        {copy?.body ?? ''}
      </Typography>
    </MIConfirm>
  )
}

export type ScenarioGroupInnerTableRow = {
  scenarioId: string | number
  scenarioName: string
  baseCase: boolean
  dimensions?: IScenarioDimension[]
  probability: number
  status?: ScenarioJudgementStatus
  statusLabel?: string
}

type ScenarioGroupInnerTableProps<TRow extends ScenarioGroupInnerTableRow> = {
  scenarioGroupId?: string | number
  dimensionColumns: IScenarioDimensionColumn[]
  scenarios: TRow[]
  backgroundColor?: string
  showStatusColumn?: boolean
  judgementPendingScenarioId?: string | number
  loading?: boolean
  skeletonRowCount?: number
  noRowMessage?: string
  onScenarioClick?: (row: TRow) => void
  onJudgementChange?: (scenario: TRow, next: ScenarioJudgementStatus) => void
}

const getDimensionCellValue = <TRow extends ScenarioGroupInnerTableRow>(row: TRow, column: IScenarioDimensionColumn) => {
  const dimensionValue = row.dimensions?.find((item) => item.key === column.key)?.valueLabel
  if (dimensionValue !== null && dimensionValue !== undefined) return dimensionValue

  return '-'
}

const isScenarioDiscarded = (row: ScenarioGroupInnerTableRow) => row.status === 'discarded'

const ScenarioGroupInnerTableComponent = <TRow extends ScenarioGroupInnerTableRow>({
  scenarioGroupId,
  dimensionColumns,
  scenarios,
  backgroundColor = 'commonColor.White',
  showStatusColumn = false,
  judgementPendingScenarioId,
  loading = false,
  skeletonRowCount = 8,
  noRowMessage = '조건에 맞는 시나리오가 없습니다.',
  onScenarioClick,
  onJudgementChange,
}: ScenarioGroupInnerTableProps<TRow>) => {
  const navigate = useNavigate()

  const columns = useMemo<NextGenMIStickyTableColumn<TRow>[]>(() => {
    const tableCellSx = { bgcolor: backgroundColor } as const
    const statusColumns: NextGenMIStickyTableColumn<TRow>[] = []

    if (showStatusColumn) {
      statusColumns.push({
        field: 'status',
        headerName: '상태',
        width: '100px',
        align: 'center',
        headerCellSx: tableCellSx,
        cellSx: tableCellSx,
        renderCell: ({ row }: { row: TRow }) => {
          if (row.status === 'pending' && onJudgementChange) {
            return (
              <Stack width="100%" alignItems="center">
                <ScenarioJudgementSelect
                  value={row.status}
                  disabled={judgementPendingScenarioId === row.scenarioId}
                  onSelect={(next) => onJudgementChange(row, next)}
                />
              </Stack>
            )
          }

          return (
            <Stack width="100%" alignItems="center">
              <ScenarioJudgementText status={row.status} label={row.statusLabel} />
            </Stack>
          )
        },
      })
    }

    return [
      {
        field: 'baseCase',
        headerName: '',
        width: '48px',
        align: 'right',
        headerCellSx: tableCellSx,
        cellSx: { ...tableCellSx },
        renderCell: ({ row }) => (
          <Stack width="100%" alignItems="center" justifyContent="center">
            {isScenarioDiscarded(row) ? (
              <ScenarioTableBadge label={row.baseCase ? 'BC' : getScenarioJudgementLabel(row.status, row.statusLabel)} disabled />
            ) : (
              row.baseCase && <NextGenMIBaseCaseChip />
            )}
          </Stack>
        ),
      },
      {
        field: 'scenario',
        headerName: '시나리오',
        width: '300px',
        align: 'left',
        headerCellSx: tableCellSx,
        cellSx: tableCellSx,
        renderCell: ({ row }) => {
          const disabled = isScenarioDiscarded(row)
          const handleScenarioClick = disabled
            ? undefined
            : onScenarioClick
              ? () => onScenarioClick(row)
              : scenarioGroupId
                ? () => navigate(getNextGenMIScenarioGroupDetailPath(scenarioGroupId, row.scenarioId))
                : undefined

          if (handleScenarioClick) {
            return <NextGenMIHoverLinkCell value={row.scenarioName} onClick={handleScenarioClick} />
          }

          return (
            <NextGenMITableBodyText
              value={row.scenarioName}
              variant="body1SB16"
              color={disabled ? 'contentText.Disabled' : 'contentText.Black'}
              tooltipWhenTruncated
            />
          )
        },
      },
      ...dimensionColumns.map(
        (column): NextGenMIStickyTableColumn<TRow> => ({
          field: column.key,
          headerName: column.label,
          width: '160px',
          align: 'left',
          headerCellSx: tableCellSx,
          cellSx: tableCellSx,
          renderCell: ({ row }) => (
            <NextGenMITableBodyText
              value={getDimensionCellValue(row, column)}
              color={isScenarioDiscarded(row) ? 'contentText.Disabled' : 'contentText.Black'}
              tooltipWhenTruncated
            />
          ),
        }),
      ),
      {
        field: 'probability',
        headerName: '실행가능성',
        width: '100px',
        align: 'center',
        headerCellSx: tableCellSx,
        cellSx: tableCellSx,
        renderCell: ({ row }) => (
          <Stack width="100%" alignItems="center">
            {isScenarioDiscarded(row) ? <DisabledScenarioPossibilityGauge /> : <ScenarioPossibilityGauge probability={row.probability} />}
          </Stack>
        ),
      },
      ...statusColumns,
    ]
  }, [
    backgroundColor,
    dimensionColumns,
    judgementPendingScenarioId,
    navigate,
    onJudgementChange,
    onScenarioClick,
    scenarioGroupId,
    showStatusColumn,
  ])
  const fixedLeftColumnIndexes = useMemo(
    () =>
      columns.flatMap((column, index) => {
        if (column.field === 'baseCase' || column.field === 'scenario') return [index]
        return []
      }),
    [columns],
  )
  const fixedRightColumnIndexes = useMemo(
    () =>
      columns.flatMap((column, index) => {
        if (column.field === 'probability' || column.field === 'status') return [index]
        return []
      }),
    [columns],
  )

  return (
    <Stack width="100%" minWidth={0} maxWidth="100%">
      <NextGenMIStickyTable<TRow>
        columns={columns}
        rows={scenarios}
        getRowKey={(row) => row.scenarioId}
        fixedLeftColumnIndexes={fixedLeftColumnIndexes}
        fixedRightColumnIndexes={fixedRightColumnIndexes}
        loading={loading}
        skeletonRowCount={skeletonRowCount}
        noRowMessage={noRowMessage}
        rowHeight="48px"
        headerFontSize="13px"
        containerShell={false}
      />
    </Stack>
  )
}

const ScenarioGroupInnerTable = memo(ScenarioGroupInnerTableComponent) as typeof ScenarioGroupInnerTableComponent

export default ScenarioGroupInnerTable
