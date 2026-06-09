import { Box, Stack, Typography } from '@mui/material'
import { type GridColDef } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'

import type { IScenarioDimensionColumn, IScenarioGroupDetailRow, ScenarioJudgementStatus } from '@/service/mi/nextGenMI/scenarioGroup'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMITableBodyText, {
  NEXT_GEN_MI_TABLE_BODY_CELL_PY,
  NEXT_GEN_MI_TABLE_CELL_PX,
} from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioPossibilityGauge from '@/pages/mi/nextGenMI/components/common/ScenarioPossibilityGauge'

const SCENARIO_JUDGEMENT_ITEMS: { value: ScenarioJudgementStatus; label: string }[] = [
  { value: 'pending', label: '대기' },
  { value: 'realized', label: '실현' },
  { value: 'discarded', label: '폐기' },
]

interface ScenarioJudgementSelectProps {
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

interface JudgementConfirmCopy {
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

interface ScenarioJudgementConfirmDialogProps {
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
      width={440}
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

interface ScenarioGroupAssumptionSectionProps {
  dimensionColumns: IScenarioDimensionColumn[]
  scenarios: IScenarioGroupDetailRow[]
  judgementPendingScenarioId?: number
  loading?: boolean
  skeletonRowCount?: number
  onJudgementChange: (scenario: IScenarioGroupDetailRow, next: ScenarioJudgementStatus) => void
}

const ScenarioGroupAssumptionSection = ({
  dimensionColumns,
  scenarios,
  judgementPendingScenarioId,
  loading = false,
  skeletonRowCount = 4,
  onJudgementChange,
}: ScenarioGroupAssumptionSectionProps) => {
  const columns = useMemo<GridColDef<IScenarioGroupDetailRow>[]>(
    () => [
      {
        field: 'baseCase',
        headerName: '',
        width: 40,
        align: 'center',
        sortable: false,
        renderCell: ({ row }) => (row.baseCase ? <NextGenMIBaseCaseChip /> : null),
      },
      {
        field: 'scenarioName',
        headerName: '시나리오',
        flex: 1.4,
        sortable: false,
        renderCell: ({ row }) => (
          <NextGenMITableBodyText value={row.scenarioName} variant="body1SB16" color="contentText.Black" tooltipWhenTruncated />
        ),
      },
      ...dimensionColumns.map<GridColDef<IScenarioGroupDetailRow>>((column) => ({
        field: column.key,
        headerName: column.label,
        width: 160,
        sortable: false,
        renderCell: ({ row }) => {
          const dimension = row.dimensions.find((item) => item.key === column.key)
          return <NextGenMITableBodyText value={dimension?.valueLabel ?? '-'} color="contentText.Black" tooltipWhenTruncated />
        },
      })),
      {
        field: 'probability',
        headerName: '실행가능성',
        width: 100,
        align: 'center',
        sortable: false,
        renderCell: ({ row }) => (
          <Stack width="100%" alignItems="center">
            <ScenarioPossibilityGauge probability={row.probability} />
          </Stack>
        ),
      },
      {
        field: 'status',
        headerName: '상태',
        width: 100,
        align: 'center',
        sortable: false,
        renderCell: ({ row }) => (
          <ScenarioJudgementSelect
            value={row.status}
            disabled={judgementPendingScenarioId === row.scenarioId}
            onSelect={(next) => onJudgementChange(row, next)}
          />
        ),
      },
    ],
    [dimensionColumns, judgementPendingScenarioId, onJudgementChange],
  )

  return (
    <Box sx={{ position: 'relative' }}>
      <MIDataTableHeader<IScenarioGroupDetailRow>
        columns={columns}
        headerCellPx={NEXT_GEN_MI_TABLE_CELL_PX}
        headerLabelVariant="body2SB14"
        headerLabelColor="contentText.Black"
      />
      <MIDataTableBody<IScenarioGroupDetailRow>
        columns={columns}
        rows={scenarios}
        getRowKey={(row) => row.scenarioId}
        rowHeight={56}
        cellPx={NEXT_GEN_MI_TABLE_CELL_PX}
        cellPy={NEXT_GEN_MI_TABLE_BODY_CELL_PY}
        loading={loading}
        skeletonRowCount={skeletonRowCount}
        noRowMessage="조건에 맞는 시나리오가 없습니다."
      />
    </Box>
  )
}

export default ScenarioGroupAssumptionSection
