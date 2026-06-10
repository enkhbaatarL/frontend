import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { type GridColDef, type GridRenderCellParams, type GridRowModel } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { memo, type ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { useMIMorphingPopupContext } from '@/components/mi/MIMorphingPopupContext'
import nextGenMIScenarioService, {
  type IModelExecutionParameterTable,
  type IModelExecutionSubmitReq,
} from '@/service/mi/nextGenMI/scenario'

const PARAMETER_TABLE_HEADER_HEIGHT_PX = 36
const PARAMETER_TABLE_ROW_HEIGHT_PX = 42
const PARAMETER_TABLE_TARGET_WIDTH_PX = 260
const PARAMETER_TABLE_PERIOD_WIDTH_PX = 100
const PARAMETER_TABLE_ROW_HEADER = { colIndex: 0, zIndex: 6 } as const

type DraftModelExecutionTableRow = {
  rowId: string
  target: string
  values: Record<string, string>
}

type DraftModelExecutionTable = Omit<IModelExecutionParameterTable, 'rows'> & {
  rows: DraftModelExecutionTableRow[]
}

type ModelExecutionParameterRowModel = GridRowModel & DraftModelExecutionTableRow

interface ScenarioModelExecutionPopupContentProps {
  scenarioId?: string
  shouldFetch: boolean
  disabled?: boolean
  onSubmit: (payload: IModelExecutionSubmitReq) => Promise<void>
}

const numberInputPattern = /^-?\d*\.?\d*$/

const formatCount = (value: number) => new Intl.NumberFormat('ko-KR').format(value)

const formatTimePeriod = (period: string) => {
  const value = period.trim()
  const yearMonth = /^(\d{4})[-./]?(\d{2})$/.exec(value)
  if (yearMonth) return `${yearMonth[1]}.${yearMonth[2]}`
  if (/^\d{4}$/.test(value)) return `${value}년`
  return value
}

const toDraftTables = (tables: IModelExecutionParameterTable[] = []): DraftModelExecutionTable[] =>
  tables.map((table) => ({
    ...table,
    rows: table.rows.map((row) => ({
      rowId: row.rowId,
      target: row.target,
      values: Object.fromEntries(Object.entries(row.values ?? {}).map(([key, value]) => [key, String(value ?? '')])),
    })),
  }))

const buildSubmitPayload = (tables: DraftModelExecutionTable[]): IModelExecutionSubmitReq => ({
  tables: tables.map((table) => ({
    tableId: table.tableId,
    rows: table.rows.map((row) => ({
      rowId: row.rowId,
      values: Object.fromEntries(table.timePeriods.map((period) => [period, Number(row.values[period])])) as Record<string, number>,
    })),
  })),
})

const hasInvalidValue = (tables: DraftModelExecutionTable[]) =>
  tables.some((table) =>
    table.rows.some((row) =>
      table.timePeriods.some((period) => {
        const value = row.values[period]
        return value === undefined || value.trim() === '' || !Number.isFinite(Number(value))
      }),
    ),
  )

const ParameterTableSkeleton = () => (
  <Box flex={1} minHeight={0} px="38px" py="24px" boxSizing="border-box">
    <Skeleton variant="rounded" height="100%" sx={{ borderRadius: '10px' }} />
  </Box>
)

interface ParameterValueInputProps {
  value: string
  disabled: boolean
  invalid: boolean
  label: string
  tableId: string
  rowId: string
  period: string
  onValueChange: (tableId: string, rowId: string, period: string, value: string) => void
}

const ParameterValueInput = memo(({ value, disabled, invalid, label, tableId, rowId, period, onValueChange }: ParameterValueInputProps) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value
      if (!numberInputPattern.test(nextValue)) return
      onValueChange(tableId, rowId, period, nextValue)
    },
    [onValueChange, period, rowId, tableId],
  )

  return (
    <Box
      component="input"
      value={value}
      disabled={disabled}
      type="text"
      inputMode="decimal"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      onChange={handleChange}
      sx={{
        width: '100%',
        height: '36px',
        boxSizing: 'border-box',
        border: '1px solid',
        borderColor: invalid ? 'error.main' : 'contentBorder.Normal',
        borderRadius: '10px',
        bgcolor: disabled ? 'contentBG.Disabled' : 'commonColor.White',
        px: '12px',
        font: 'inherit',
        fontSize: 14,
        lineHeight: 1.4,
        color: disabled ? 'contentText.Disabled' : 'contentText.Black',
        outline: 'none',
        '&:hover': {
          borderColor: invalid ? 'error.main' : 'contentBorder.Active',
        },
        '&:focus': {
          borderColor: invalid ? 'error.main' : 'contentBorder.Active',
        },
        '&:disabled': {
          cursor: 'default',
        },
      }}
    />
  )
})

ParameterValueInput.displayName = 'ParameterValueInput'

const ScenarioModelExecutionParameterTable = ({
  table,
  disabled,
  onValueChange,
}: {
  table: DraftModelExecutionTable
  disabled: boolean
  onValueChange: (tableId: string, rowId: string, period: string, value: string) => void
}) => {
  const columns: GridColDef<ModelExecutionParameterRowModel>[] = useMemo(
    () => [
      {
        field: 'target',
        headerName: '대상',
        width: PARAMETER_TABLE_TARGET_WIDTH_PX,
        minWidth: PARAMETER_TABLE_TARGET_WIDTH_PX,
        align: 'left',
        headerAlign: 'left',
        sortable: false,
      },
      ...table.timePeriods.map<GridColDef<ModelExecutionParameterRowModel>>((period) => ({
        field: period,
        headerName: formatTimePeriod(period),
        width: PARAMETER_TABLE_PERIOD_WIDTH_PX,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        renderCell: (params: GridRenderCellParams<ModelExecutionParameterRowModel>) => {
          const value = params.row.values[period] ?? ''
          const invalid = value.trim() === '' || !Number.isFinite(Number(value))

          return (
            <ParameterValueInput
              value={value}
              disabled={disabled}
              invalid={invalid}
              label={`${params.row.target} ${formatTimePeriod(period)}`}
              tableId={table.tableId}
              rowId={params.row.rowId}
              period={period}
              onValueChange={onValueChange}
            />
          )
        },
      })),
    ],
    [disabled, onValueChange, table.tableId, table.timePeriods],
  )

  return (
    <Box
      aria-label={table.tableLabel}
      data-mi-model-parameter-table={table.tableId}
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <MIDataTableBody<ModelExecutionParameterRowModel>
        rowId="rowId"
        columns={columns}
        rows={table.rows}
        rowHeight={PARAMETER_TABLE_ROW_HEIGHT_PX}
        disableHover
        topPaddingPx={0}
        primitiveCellTypographyVariant="body2M14"
        noRowMessage="실행 파라미터가 없습니다."
        rowHeader={PARAMETER_TABLE_ROW_HEADER}
        sx={{ flex: 1, minHeight: 0, height: '100%' }}
        scroll={{
          height: '100%',
          type: 'floating',
          floatingPlacement: 'outer',
          overflowX: 'auto',
          showThumbOnHover: true,
          stickyHeader: (
            <MIDataTableHeader<ModelExecutionParameterRowModel>
              columns={columns}
              rowHeader={PARAMETER_TABLE_ROW_HEADER}
              enableHorizontalScroll
              headerLabelColor="contentText.Normal"
              getHeaderCellSx={(col) =>
                col.field === 'target'
                  ? { bgcolor: 'commonColor.White', borderRight: '1px solid', borderColor: 'contentBorder.Normal' }
                  : undefined
              }
              sx={{
                bgcolor: 'commonColor.White',
                minHeight: PARAMETER_TABLE_HEADER_HEIGHT_PX,
                height: PARAMETER_TABLE_HEADER_HEIGHT_PX,
              }}
            />
          ),
        }}
        getCellSx={({ field }) =>
          field === 'target'
            ? { bgcolor: 'commonColor.White', borderRight: '1px solid', borderColor: 'contentBorder.Normal' }
            : { px: '4px', py: '2px' }
        }
      />
    </Box>
  )
}

const CONTENT_FADE_DURATION_MS = 280
const CONTENT_FADE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

const modelExecutionFadeInKeyframes = {
  '@keyframes modelExecutionFadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
} as const

const modelExecutionFadeInSx = {
  animation: `modelExecutionFadeIn ${CONTENT_FADE_DURATION_MS}ms ${CONTENT_FADE_EASING}`,
  ...modelExecutionFadeInKeyframes,
} as const

const ModelExecutionPopupFade = ({ children, sx }: { children: ReactNode; sx?: object }) => (
  <Box sx={{ ...modelExecutionFadeInSx, ...sx }}>{children}</Box>
)

const ScenarioModelExecutionPopupContent = ({
  scenarioId,
  shouldFetch,
  disabled = false,
  onSubmit,
}: ScenarioModelExecutionPopupContentProps) => {
  const { isMorphComplete = true } = useMIMorphingPopupContext() ?? {}
  const [draftTables, setDraftTables] = useState<DraftModelExecutionTable[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['nextGenMIScenarioModelExecutionParameters', scenarioId],
    queryFn: () => nextGenMIScenarioService.getModelExecutionParameters(scenarioId ?? ''),
    enabled: shouldFetch && Boolean(scenarioId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  useEffect(() => {
    if (!data?.tables) return
    setDraftTables(toDraftTables(data.tables))
  }, [data])

  const handleValueChange = useCallback((tableId: string, rowId: string, period: string, value: string) => {
    setDraftTables((prev) =>
      prev.map((table) => {
        if (table.tableId !== tableId) return table

        return {
          ...table,
          rows: table.rows.map((row) => {
            if (row.rowId !== rowId) return row

            return {
              ...row,
              values: {
                ...row.values,
                [period]: value,
              },
            }
          }),
        }
      }),
    )
  }, [])

  const totalRowCount = useMemo(() => draftTables.reduce((sum, table) => sum + table.rows.length, 0), [draftTables])
  const invalid = hasInvalidValue(draftTables)
  const submitDisabled = disabled || isSubmitting || isLoading || isError || draftTables.length === 0 || invalid
  const bodyFadeKey = isError ? 'error' : !shouldFetch || isLoading ? 'loading' : 'content'

  const handleSubmit = useCallback(async () => {
    if (submitDisabled) return
    setIsSubmitting(true)
    try {
      await onSubmit(buildSubmitPayload(draftTables))
    } finally {
      setIsSubmitting(false)
    }
  }, [draftTables, onSubmit, submitDisabled])

  return (
    <Stack height={788} boxSizing="border-box">
      {!isMorphComplete ? (
        <Box minHeight={788} aria-hidden />
      ) : (
        <>
          <ModelExecutionPopupFade key="toolbar">
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              height="36px"
              px="38px"
              boxSizing="border-box"
              flexShrink={0}
            >
              <Typography variant="body2SB14" color="contentText.Normal">
                총 {formatCount(totalRowCount)}개
              </Typography>
              <MIBaseButton
                variant="contained"
                prefix={<PlayArrowRoundedIcon sx={{ fontSize: 20 }} />}
                isLoading={isSubmitting}
                disabled={submitDisabled}
                onClick={handleSubmit}
                sx={{
                  height: 32,
                }}
              >
                MI 수급모델 실행
              </MIBaseButton>
            </Stack>
          </ModelExecutionPopupFade>

          <ModelExecutionPopupFade key={bodyFadeKey} sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {isError ? (
              <Stack flex={1} alignItems="center" justifyContent="center" px="38px">
                <Typography variant="body2M14" color="contentText.Subtext">
                  MI 수급모델 실행 파라미터를 불러오지 못했습니다.
                </Typography>
              </Stack>
            ) : !shouldFetch || isLoading ? (
              <ParameterTableSkeleton />
            ) : (
              <Stack flex={1} minHeight={0} px="38px" py="24px" gap="20px" boxSizing="border-box">
                {draftTables.map((table) => (
                  <ScenarioModelExecutionParameterTable
                    key={table.tableId}
                    table={table}
                    disabled={disabled || isSubmitting}
                    onValueChange={handleValueChange}
                  />
                ))}
              </Stack>
            )}
          </ModelExecutionPopupFade>
        </>
      )}
    </Stack>
  )
}

export default ScenarioModelExecutionPopupContent
