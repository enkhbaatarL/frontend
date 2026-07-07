import { Stack, Typography } from '@mui/material'
import { memo, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { IScenarioDimension, IScenarioDimensionColumn, ScenarioJudgementStatus } from '@/service/mi/nextGenMI/scenarioGroup'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import { NextGenMIBaseCaseChip, NextGenMIDiscardedBadge } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
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
    title: '이 시나리오를 실현 처리하시겠습니까?',
    body: '이 시나리오가 실현 상태로 변경되며, 같은 그룹의 다른 시나리오는 모두 폐기됩니다. 이 작업은 되돌릴 수 없습니다.',
    confirmLabel: '실현',
  },
  discarded: {
    title: '시나리오를 폐기하시겠습니까?',
    body: '폐기 후에는 상태를 다시 변경할 수 없습니다. 해당 시나리오는 목록에서 비활성화 처리됩니다.',
    confirmLabel: '폐기',
  },
}

const isDiscardedScenario = (status?: ScenarioJudgementStatus) => status === 'discarded'
const isRealizedScenario = (status?: ScenarioJudgementStatus) => status === 'realized'
const isJudgementLockedScenario = (status?: ScenarioJudgementStatus) => isDiscardedScenario(status) || isRealizedScenario(status)

export const isLastRemainingScenarioDiscard = (
  scenarios: Array<{ scenarioId: number; status?: ScenarioJudgementStatus }>,
  targetScenarioId: number,
) => {
  const nonDiscardedScenarios = scenarios.filter((scenario) => scenario.status !== 'discarded')

  return nonDiscardedScenarios.length === 1 && nonDiscardedScenarios[0]?.scenarioId === targetScenarioId
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
  const isDiscardConfirm = targetStatus === 'discarded'

  return (
    <MIConfirm
      open={open}
      title={copy?.title ?? ''}
      width="450px"
      handleClose={onCancel}
      disableClose={pending}
      actions={[
        { label: '취소', variant: 'outlined', color: 'gray', disabled: pending, onClick: onCancel },
        {
          label: copy?.confirmLabel ?? '확인',
          variant: 'filled',
          color: isDiscardConfirm ? 'red' : 'primary',
          disabled: pending,
          onClick: onConfirm,
        },
      ]}
    >
      <Typography variant="body1M16" color="contentText.Normal" lineHeight={1.6}>
        {copy?.body ?? ''}
      </Typography>
    </MIConfirm>
  )
}

type ScenarioLastDiscardConfirmDialogProps = {
  open: boolean
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ScenarioLastDiscardConfirmDialog = ({ open, pending = false, onConfirm, onCancel }: ScenarioLastDiscardConfirmDialogProps) => (
  <MIConfirm
    open={open}
    title="마지막 시나리오를 폐기하시겠습니까?"
    width="450px"
    handleClose={onCancel}
    disableClose={pending}
    actions={[
      { label: '취소', variant: 'outlined', color: 'gray', disabled: pending, onClick: onCancel },
      { label: '폐기 후 그룹 삭제', variant: 'filled', color: 'red', disabled: pending, onClick: onConfirm },
    ]}
  >
    <Typography variant="body2R14" color="contentText.Normal" lineHeight={1.6}>
      이 시나리오를 폐기하면 남은 시나리오가 없어져 시나리오 그룹이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
    </Typography>
  </MIConfirm>
)

export type ScenarioGroupInnerTableRow = {
  scenarioId: string | number
  scenarioName: string
  baseCase: boolean
  displayOrder: number
  dimensions?: IScenarioDimension[]
  probability: number
  adjustedProbability?: number
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
  pageStickyHeaderTop?: number | string
  onScenarioClick?: (row: TRow) => void
  onJudgementChange?: (scenario: TRow, next: ScenarioJudgementStatus) => void
}

const getDimensionCellValue = <TRow extends ScenarioGroupInnerTableRow>(row: TRow, column: IScenarioDimensionColumn) => {
  const dimensionValue = row.dimensions?.find((item) => item.key === column.key)?.valueLabel
  if (dimensionValue !== null && dimensionValue !== undefined) return dimensionValue

  return '-'
}

const getDimensionSortValue = <TRow extends ScenarioGroupInnerTableRow>(row: TRow, column: IScenarioDimensionColumn) =>
  row.dimensions?.find((item) => item.key === column.key)?.valueLabel

const compareDimensionCellValue = <TRow extends ScenarioGroupInnerTableRow>(
  firstRow: TRow,
  secondRow: TRow,
  column: IScenarioDimensionColumn,
) => {
  const firstValue = getDimensionSortValue(firstRow, column)
  const secondValue = getDimensionSortValue(secondRow, column)

  if (firstValue === secondValue) return 0
  if (firstValue === null || firstValue === undefined) return 1
  if (secondValue === null || secondValue === undefined) return -1

  return firstValue.localeCompare(secondValue, 'ko', { numeric: true, sensitivity: 'base' })
}

const ScenarioJudgementStatusLabel = ({ label, realized = false }: { label: string; realized?: boolean }) => (
  <Typography variant="body2M14" color={realized ? 'mari.Primary' : 'contentText.Disabled'} noWrap>
    {label}
  </Typography>
)

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
  pageStickyHeaderTop,
  onScenarioClick,
  onJudgementChange,
}: ScenarioGroupInnerTableProps<TRow>) => {
  const navigate = useNavigate()

  const columns = useMemo<NextGenMIStickyTableColumn<TRow>[]>(() => {
    const tableCellSx = { bgcolor: backgroundColor } as const

    return [
      {
        field: 'baseCase',
        headerName: '',
        width: '48px',
        align: 'right',
        headerCellSx: tableCellSx,
        cellSx: { ...tableCellSx },
        renderCell: ({ row }) => {
          const discarded = isDiscardedScenario(row.status)

          return (
            <Stack width="100%" alignItems="center" justifyContent="center">
              {row.baseCase ? <NextGenMIBaseCaseChip disabled={discarded} /> : discarded && <NextGenMIDiscardedBadge />}
            </Stack>
          )
        },
      },
      {
        field: 'scenario',
        headerName: '시나리오',
        width: '300px',
        align: 'left',
        headerCellSx: tableCellSx,
        cellSx: tableCellSx,
        renderCell: ({ row }) => {
          const discarded = isDiscardedScenario(row.status)
          const textColor = discarded ? 'contentText.Disabled' : 'contentText.Black'
          const handleScenarioClick = onScenarioClick
            ? () => onScenarioClick(row)
            : scenarioGroupId
              ? () => navigate(getNextGenMIScenarioGroupDetailPath(scenarioGroupId, row.scenarioId))
              : undefined

          return (
            <Stack direction="row" alignItems="center" gap="8px" minWidth={0} maxWidth="100%">
              <NextGenMIDisplayOrderBadge value={row.displayOrder} disabled={discarded} />
              {handleScenarioClick && !discarded ? (
                <NextGenMIHoverLinkCell value={row.scenarioName} onClick={handleScenarioClick} />
              ) : (
                <NextGenMITableBodyText value={row.scenarioName} variant="body1SB16" color={textColor} tooltipWhenTruncated />
              )}
            </Stack>
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
          // sortable: true,
          sortComparator: (firstRow, secondRow) => compareDimensionCellValue(firstRow, secondRow, column),
          tooltipWhenHeaderTruncated: true,
          renderCell: ({ row }) => {
            const discarded = isDiscardedScenario(row.status)

            return (
              <NextGenMITableBodyText
                value={getDimensionCellValue(row, column)}
                color={discarded ? 'contentText.Disabled' : 'contentText.Black'}
                tooltipWhenTruncated
              />
            )
          },
        }),
      ),
      {
        field: 'probability',
        headerName: '실행가능성',
        width: '100px',
        align: 'center',
        headerCellSx: tableCellSx,
        cellSx: tableCellSx,
        // sortable: true,
        sortComparator: (firstRow, secondRow) =>
          (firstRow.adjustedProbability ?? firstRow.probability) - (secondRow.adjustedProbability ?? secondRow.probability),
        renderCell: ({ row }) => (
          <Stack width="100%" alignItems="center">
            <ScenarioPossibilityGauge probability={row.adjustedProbability ?? row.probability} disabled={isDiscardedScenario(row.status)} />
          </Stack>
        ),
      },
      ...(showStatusColumn
        ? [
          {
            field: 'status',
            headerName: '상태',
            width: '100px',
            align: 'center' as const,
            headerCellSx: tableCellSx,
            cellSx: tableCellSx,
            renderCell: ({ row }: { row: TRow }) => {
              if (!row.status || !onJudgementChange) {
                return <NextGenMITableBodyText value={row.statusLabel ?? '-'} color="contentText.Black" tooltipWhenTruncated />
              }

              if (isJudgementLockedScenario(row.status)) {
                return (
                  <Stack width="100%" alignItems="center">
                    <ScenarioJudgementStatusLabel
                      label={row.statusLabel ?? (isRealizedScenario(row.status) ? '실현' : '폐기')}
                      realized={isRealizedScenario(row.status)}
                    />
                  </Stack>
                )
              }

              return (
                <Stack width="100%" alignItems="center">
                  <ScenarioJudgementSelect
                    value={row.status}
                    disabled={judgementPendingScenarioId === row.scenarioId}
                    onSelect={(next) => onJudgementChange(row, next)}
                  />
                </Stack>
              )
            },
          },
        ]
        : []),
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
        pageStickyHeaderTop={pageStickyHeaderTop}
      />
    </Stack>
  )
}

const ScenarioGroupInnerTable = memo(ScenarioGroupInnerTableComponent) as typeof ScenarioGroupInnerTableComponent

export default ScenarioGroupInnerTable
