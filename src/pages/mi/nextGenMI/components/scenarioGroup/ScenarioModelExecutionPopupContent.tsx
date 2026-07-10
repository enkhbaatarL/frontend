import { Box, Collapse, Stack, Tab, Tabs, Typography } from '@mui/material'
import { ChangeEvent, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx-js-style'

import type { ModelExecutionParameter, ModelExecutionParameterTableRow } from '@/service/mi/nextGenMI/modelExecution'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import CloseIcon from '@/components/common/icons/CloseIcon'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import ParameterSuggestionIcon from '@/components/common/icons/ParameterSuggestionIcon'
import RefreshIcon from '@/components/common/icons/RefreshIcon'
import RowParameterSuggestionIcon from '@/components/common/icons/RowParameterSuggestionIcon'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'

export interface ScenarioModelExecutionOption {
  scenarioId: number
  scenarioName: string
  executed: boolean
  disabled: boolean
  badgeLabel?: string
}

const MODEL_ADJUSTMENT_LABELS = [
  'GDP Population',
  'Electrification Rate',
  'Power Mix',
  'Coal Gas',
  'Weather',
  'PMI',
  'Hydrogen',
  'LNG Bunkering',
  'Demand Output',
  'Data Category',
  'Industrial Demand',
  'Residential Demand',
  'Transportation Demand',
  'Regional Adjustments',
]

interface ScenarioModelExecutionPopupContentProps {
  scenarioOptions: ScenarioModelExecutionOption[]
  selectedScenarioId: number | null
  executingScenarioIds: Set<number>
  parameters: ModelExecutionParameter | null
  selectedTableId: string | null
  isGenerating: boolean
  isSubmitting: boolean
  onSelectScenario: (scenarioId: number) => void
  onGenerateParameters: () => void
  onSelectTable: (tableId: string) => void
  onParameterValueChange: (tableId: string, rowId: string, timePeriod: string, value: number) => void
  onReset: () => void
  onSubmit: () => void
  onCancel: () => void
}

const ScenarioOptionBadge = ({ label, disabled }: { label: string; disabled: boolean }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
    padding="4px 6px"
    borderRadius="8px"
    border={disabled ? '1px solid' : 'none'}
    bgcolor={disabled ? 'gray.5' : 'gray.20'}
    borderColor={disabled ? 'contentBorder.Normal' : undefined}
  >
    <Typography
      fontSize="12px"
      fontWeight={600}
      lineHeight={1.4}
      color={disabled ? 'contentText.Disabled' : 'contentText.Normal'}
      whiteSpace="nowrap"
    >
      {label}
    </Typography>
  </Stack>
)

const ParameterState = ({ message, children }: PropsWithChildren<{ message: string }>) => (
  <Stack flex="1 1 0" minHeight={0} alignItems="center" justifyContent="center" gap="10px">
    {children}
    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} width="336px" textAlign="center" sx={{ wordBreak: 'break-word' }}>
      {message}
    </Typography>
  </Stack>
)

const EmptyParameterState = ({ message }: { message: string }) => (
  <ParameterState message={message}>
    <ErrorOutlineIcon width={24} height={24} />
  </ParameterState>
)

const GeneratingState = () => (
  <ParameterState message="파라미터를 생성하고 있습니다">
    <MIAgentSpinner size={24} tone="gray" sx={{ '& svg': { width: '24px', height: '24px' } }} />
  </ParameterState>
)

const ParameterChip = ({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) => (
  <MIBaseButton
    variant="outlined"
    disabled={disabled}
    onClick={onClick}
    disableRipple
    sx={{
      maxWidth: '260px',
      minWidth: '0px',
      flexShrink: 0,
      height: '28px',
      padding: '6px 10px',
      borderRadius: '100px',
      bgcolor: selected ? 'contentBG.PrimaryFade' : 'commonColor.White',
      borderColor: selected ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
      '&:hover:not(:disabled)': {
        bgcolor: selected ? 'contentBG.PrimaryFade' : 'contentBG.Active',
        borderColor: selected ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
      },
    }}
  >
    <Typography variant="body2SB14" color={selected ? 'contentText.Black' : 'contentText.Normal'} noWrap>
      {label}
    </Typography>
  </MIBaseButton>
)

const getSheetName = (name: string, index: number) => {
  const normalizedName = name.replace(/[\\/?*[\]:]/g, ' ').trim()
  return (normalizedName || `Table ${index + 1}`).slice(0, 31)
}

const getFileName = (title: string) => `${title.replace(/[\\/:*?"<>|]/g, ' ').trim() || 'MI 수급모델'}_input_parameters.xlsx`

const ScenarioModelExecutionPopupContent = ({
  scenarioOptions,
  selectedScenarioId,
  executingScenarioIds,
  parameters,
  selectedTableId,
  isGenerating,
  isSubmitting,
  onSelectScenario,
  onGenerateParameters,
  onSelectTable,
  onParameterValueChange,
  onReset,
  onSubmit,
  onCancel,
}: ScenarioModelExecutionPopupContentProps) => {
  const [selectedModelTab, setSelectedModelTab] = useState(0)
  const [selectedAdjustmentIndex, setSelectedAdjustmentIndex] = useState(0)
  const [isParameterSuggestionOpen, setIsParameterSuggestionOpen] = useState(true)
  const [tableViewportHeight, setTableViewportHeight] = useState<number>()
  const popupContentRef = useRef<HTMLDivElement>(null)
  const tableViewportRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const scenarioItems: SelectMenuItem<number>[] = scenarioOptions.map((option) => ({
    value: option.scenarioId,
    disabled: option.disabled,
    label: option.scenarioName,
    suffix: option.badgeLabel ? <ScenarioOptionBadge label={option.badgeLabel} disabled={option.disabled} /> : undefined,
  }))
  const selectedTable = parameters?.tables.find((table) => table.tableId === selectedTableId) ?? parameters?.tables[0]
  const submitDisabled =
    isGenerating ||
    isSubmitting ||
    selectedScenarioId === null ||
    !parameters ||
    parameters.tables.length === 0 ||
    executingScenarioIds.has(selectedScenarioId)
  const handleValueChange = useCallback(
    (tableId: string, rowId: string, timePeriod: string) => (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === '') {
        onParameterValueChange(tableId, rowId, timePeriod, 0)
        return
      }

      const nextValue = Number(event.target.value)
      if (Number.isNaN(nextValue)) return
      onParameterValueChange(tableId, rowId, timePeriod, nextValue)
    },
    [onParameterValueChange],
  )

  const tableColumns = useMemo<NextGenMIStickyTableColumn<ModelExecutionParameterTableRow>[]>(() => {
    if (!selectedTable) return []

    return [
      {
        field: 'parameterSuggestion',
        headerName: (
          <MIBaseButton
            variant="text"
            aria-label="파라미터 추천 근거 열기"
            disabled={isParameterSuggestionOpen}
            onClick={() => setIsParameterSuggestionOpen(true)}
            disableRipple
            buttonHoverBgColor="transparent"
            sx={{ width: '40px', minWidth: '40px', height: '40px', padding: 0, borderRadius: 0 }}
          >
            <ParameterSuggestionIcon width={20} height={20} color="#868E96" />
          </MIBaseButton>
        ),
        width: '40px',
        align: 'center',
        headerAlign: 'center',
        headerCellSx: {
          padding: 0,
        },
        headerContentSx: {
          height: '100%',
        },
        cellSx: {
          padding: 0,
        },
        renderCell: () => (
          <Stack width="100%" alignItems="center" justifyContent="center">
            <RowParameterSuggestionIcon width={20} height={20} color="#868E96" />
          </Stack>
        ),
      },
      {
        field: 'target',
        headerName: 'Target',
        width: '200px',
        align: 'left',
        headerCellSx: {
          fontWeight: 500,
        },
        renderCell: ({ row }) => (
          <Typography variant="body3M12" color="contentText.Normal" noWrap>
            {row.target}
          </Typography>
        ),
      },
      ...selectedTable.timePeriods.map(
        (timePeriod): NextGenMIStickyTableColumn<ModelExecutionParameterTableRow> => ({
          field: `timePeriod-${timePeriod}`,
          headerName: timePeriod,
          width: '120px',
          align: 'right',
          headerAlign: 'left',
          headerCellSx: {
            fontWeight: 500,
          },
          renderCell: ({ row }) => (
            <Box
              component="input"
              // type="number"
              value={row.values[timePeriod] ?? ''}
              disabled={isSubmitting}
              onChange={handleValueChange(selectedTable.tableId, row.rowId, timePeriod)}
              sx={{
                width: '100%',
                height: '28px',
                padding: '0 12px',
                border: '1px solid',
                borderColor: 'contentBorder.Normal',
                borderRadius: '10px',
                bgcolor: 'commonColor.White',
                color: 'contentText.Normal',
                fontSize: '12px',
                fontWeight: 500,
                lineHeight: 1.4,
                boxSizing: 'border-box',
                textAlign: 'right',
                outline: 'none',
                '&:focus': {
                  borderColor: 'contentBorder.Active',
                },
                '&:disabled': {
                  color: 'contentText.Disabled',
                  bgcolor: 'contentBG.Disabled',
                },
              }}
            />
          ),
        }),
      ),
    ]
  }, [handleValueChange, isParameterSuggestionOpen, isSubmitting, selectedTable])

  const handleDownload = () => {
    if (!parameters || parameters.tables.length === 0) return

    const workbook = XLSX.utils.book_new()
    parameters.tables.forEach((table, index) => {
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['Target', ...table.timePeriods],
        ...table.rows.map((row) => [row.target, ...table.timePeriods.map((timePeriod) => row.values[timePeriod] ?? '')]),
      ])
      XLSX.utils.book_append_sheet(workbook, worksheet, getSheetName(table.tableLabel || table.tableId, index))
    })
    XLSX.writeFile(workbook, getFileName(parameters.title))
  }

  useEffect(() => {
    const popupContent = popupContentRef.current
    const element = tableViewportRef.current
    const footer = footerRef.current
    const tableContainer = element?.parentElement
    if (!popupContent || !element || !footer || !tableContainer) return undefined

    let animationFrameId = 0
    const updateTableViewportHeight = () => {
      animationFrameId = 0
      const dialogPaper = element.closest<HTMLElement>('.MuiDialog-paper')
      const frame = element.firstElementChild as HTMLElement | null
      const scrollContainer = frame?.firstElementChild?.firstElementChild as HTMLElement | null
      if (!dialogPaper || !frame || !scrollContainer) return

      const dialogPaperMaxHeight = Number.parseFloat(globalThis.getComputedStyle(dialogPaper).maxHeight)
      if (!Number.isFinite(dialogPaperMaxHeight)) return

      const popupContentRect = popupContent.getBoundingClientRect()
      const dialogPaperRect = dialogPaper.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const footerRect = footer.getBoundingClientRect()
      const tableContainerPaddingBottom = Number.parseFloat(globalThis.getComputedStyle(tableContainer).paddingBottom) || 0
      const framePaddingBottom = Number.parseFloat(globalThis.getComputedStyle(frame).paddingBottom) || 0
      const availableHeight =
        dialogPaperMaxHeight -
        (popupContentRect.top - dialogPaperRect.top) -
        (elementRect.top - popupContentRect.top) -
        footerRect.height -
        tableContainerPaddingBottom
      const naturalHeight = scrollContainer.scrollHeight + framePaddingBottom
      const nextHeight = Math.max(0, Math.floor(Math.min(availableHeight, naturalHeight)))
      setTableViewportHeight((currentHeight) => (currentHeight === nextHeight ? currentHeight : nextHeight))
    }
    const scheduleTableViewportHeightUpdate = () => {
      if (animationFrameId) return
      animationFrameId = globalThis.requestAnimationFrame(updateTableViewportHeight)
    }

    scheduleTableViewportHeightUpdate()

    const resizeObserver = new ResizeObserver(scheduleTableViewportHeightUpdate)
    resizeObserver.observe(popupContent)
    resizeObserver.observe(element)
    resizeObserver.observe(tableContainer)
    globalThis.addEventListener('resize', scheduleTableViewportHeightUpdate)

    return () => {
      if (animationFrameId) globalThis.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      globalThis.removeEventListener('resize', scheduleTableViewportHeightUpdate)
    }
  }, [selectedTable?.rows.length, selectedTable?.tableId])

  return (
    <Stack ref={popupContentRef} width="100%" height="100%" minHeight={0} overflow="hidden">
      <Stack direction="row" alignItems="center" flexShrink={0} padding="4px 20px">
        <Stack direction="row" alignItems="flex-start" gap="12px" width="575px" padding="12px" borderRadius="8px" bgcolor="gray.5">
          <Box flex="1 1 0" minWidth={0}>
            <MISelectMenu<number>
              variant="outlined"
              selectionIconPosition="left"
              selected={selectedScenarioId ?? -1}
              onSelected={onSelectScenario}
              items={scenarioItems}
              placeholder="시나리오를 선택해 주세요"
              showSelectedSuffix
              disabled={isGenerating || isSubmitting}
              zIndex={1401}
              maxHeight={244}
              sx={{ width: '100%', height: '36px', borderRadius: '8px', justifyContent: 'space-between', bgcolor: 'commonColor.White' }}
            />
          </Box>
          <MIBaseButton
            variant="contained"
            disabled={selectedScenarioId === null || isGenerating || isSubmitting || Boolean(parameters)}
            onClick={onGenerateParameters}
            sx={{ height: '36px', borderRadius: '8px', padding: '0 10px' }}
          >
            파라미터 생성
          </MIBaseButton>
        </Stack>
      </Stack>

      {isGenerating ? (
        <GeneratingState />
      ) : !parameters ? (
        <EmptyParameterState message="시나리오 선택 후 파라미터를 생성해 주세요" />
      ) : parameters.tables.length === 0 || !selectedTable ? (
        <EmptyParameterState message="생성된 파라미터가 없습니다." />
      ) : (
        <Stack width="100%" flex="1 1 auto" minHeight={0} overflow="hidden">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexShrink={0}
            height="54px"
            padding="16px 24px"
            borderBottom="1px solid"
            borderColor="contentBorder.Normal"
          >
            <Tabs
              value={selectedModelTab}
              onChange={(_, value: number) => setSelectedModelTab(value)}
              sx={{
                height: '100%',
                minHeight: 0,
                borderBottom: 'none',
                '.MuiTabs-indicator': {
                  height: '2px',
                  bgcolor: 'commonColor.Black',
                },
                '& .MuiTab-root': {
                  minWidth: 0,
                  minHeight: 0,
                  height: '100%',
                  padding: '16px 20px',
                  color: 'contentText.Black',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: 'commonColor.Black',
                    fontWeight: 700,
                  },
                },
              }}
            >
              {['Demand', 'Supply', 'Trade'].map((label, index) => (
                <Tab key={label} label={label} value={index} disableRipple />
              ))}
            </Tabs>
            <MIBaseButton
              variant="outlined"
              prefix={<FileDownloadIcon width={20} height={20} />}
              disabled={parameters.tables.length === 0}
              onClick={handleDownload}
              sx={{ height: '36px', borderRadius: '8px', padding: '8px 10px 8px 6px' }}
            >
              인풋 파일 다운로드
            </MIBaseButton>
          </Stack>

          <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.10">
            <HorizontalScrollContainer
              alignItems="center"
              gap="5px"
              gradientWidth={63}
              scrollAmount={0.85}
              containerSx={{
                width: '100%',
                '& .scroll-button': {
                  borderRadius: '100px',
                  borderColor: 'contentBorder.Normal',
                  boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              {MODEL_ADJUSTMENT_LABELS.map((label, index) => (
                <ParameterChip
                  key={label}
                  label={label}
                  selected={index === selectedAdjustmentIndex}
                  disabled={isSubmitting}
                  onClick={() => setSelectedAdjustmentIndex(index)}
                />
              ))}
            </HorizontalScrollContainer>
          </Stack>

          <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.5">
            <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
              {parameters.tables.map((table, index) => (
                <ParameterChip
                  key={table.tableId}
                  label={table.tableLabel || `Table ${index + 1}`}
                  selected={table.tableId === selectedTable.tableId}
                  disabled={isSubmitting}
                  onClick={() => onSelectTable(table.tableId)}
                />
              ))}
            </HorizontalScrollContainer>
          </Stack>

          <Collapse in={isParameterSuggestionOpen} timeout={220} unmountOnExit sx={{ flexShrink: 0 }}>
            <Stack flexShrink={0} padding="12px 24px">
              <Stack
                direction="row"
                alignItems="flex-start"
                width="100%"
                padding="8px"
                border="1px solid"
                borderColor="#414C93"
                borderRadius="8px"
                bgcolor="#E9ECFF"
                gap="8px"
                boxSizing="border-box"
              >
                <Stack flex="1 1 0" minWidth={0} justifyContent="center" gap="4px" padding="4px">
                  <Stack direction="row" alignItems="center" gap="2px">
                    <Box aria-hidden display="flex" flexShrink={0} color="mari.Primary">
                      <ParameterSuggestionIcon width={24} height={24} />
                    </Box>
                    <Typography fontSize="13px" fontWeight={600} lineHeight={1.4} color="mari.Primary" noWrap>
                      {MODEL_ADJUSTMENT_LABELS[selectedAdjustmentIndex]} 파라미터 추천 근거
                    </Typography>
                  </Stack>
                  <Typography fontSize="13px" fontWeight={400} lineHeight={1.4} color="contentText.Black">
                    최근 5개년 GDP 및 인구 증가율 추이를 기준으로 국가별 수요 성장 가능성을 우선 검토했으며, 전력화율과 산업용 전력 수요의
                    상승 흐름이 확인되는 항목에는 상대적으로 높은 가중치를 부여했습니다. 또한 과거 LNG 수요 변화와 상관성이 높은 거시 지표를
                    함께 반영하고, 계절성 및 기상 변수에 따른 단기 변동 가능성도 보정 요소로 고려했습니다. 데이터 공백이 있는 구간은 동일
                    권역 내 유사 국가의 평균 변화율을 참고해 보완했으며, 최종 추천값은 시나리오 1의 기준 전망과 비교했을 때 과도한 편차가
                    발생하지 않도록 조정했습니다.
                  </Typography>
                </Stack>
                <MIBaseButton
                  variant="text"
                  aria-label="파라미터 추천 근거 닫기"
                  onClick={() => setIsParameterSuggestionOpen(false)}
                  disableRipple
                  buttonHoverBgColor="transparent"
                  sx={{ flexShrink: 0, width: '36px', minWidth: '36px', height: '36px', padding: '8px', borderRadius: '8px' }}
                >
                  <CloseIcon width={20} height={20} />
                </MIBaseButton>
              </Stack>
            </Stack>
          </Collapse>

          <Stack flex="1 1 auto" minHeight={0} padding="10px 24px" overflow="hidden">
            <Box ref={tableViewportRef} flex="1 1 auto" minHeight={0} overflow="hidden">
              <NextGenMIStickyTable<ModelExecutionParameterTableRow>
                columns={tableColumns}
                rows={selectedTable.rows}
                getRowKey={(row) => row.rowId}
                fixedLeftColumnIndexes={[0]}
                userFix
                rowHeight="42px"
                headerHeight="40px"
                cellPaddingX="8px"
                cellPaddingY="6px"
                headerFontSize="14px"
                bodyFontSize="12px"
                maxHeight={tableViewportHeight === undefined ? undefined : `${tableViewportHeight}px`}
                containerShell={false}
                hoverType="vertical"
                oddBackground
              />
            </Box>
          </Stack>
        </Stack>
      )}

      <Stack ref={footerRef} direction="row" alignItems="center" justifyContent="space-between" flexShrink={0} padding="20px">
        <MIBaseButton
          variant="outlined"
          prefix={<RefreshIcon width={20} height={20} />}
          disabled={!parameters || isGenerating || isSubmitting}
          onClick={onReset}
          sx={{ height: '36px', borderRadius: '8px', padding: '8px 10px 8px 6px' }}
        >
          초기화
        </MIBaseButton>
        <Stack direction="row" alignItems="center" gap="8px">
          <MIBaseButton
            variant="outlined"
            disabled={isGenerating || isSubmitting}
            onClick={onCancel}
            sx={{ height: '36px', borderRadius: '8px', padding: '0 10px' }}
          >
            취소
          </MIBaseButton>
          <MIBaseButton
            variant="contained"
            disabled={submitDisabled}
            isLoading={isSubmitting}
            onClick={onSubmit}
            sx={{ height: '36px', bgcolor: 'mari.Primary', borderRadius: '8px' }}
          >
            MI 수급모델 실행
          </MIBaseButton>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioModelExecutionPopupContent
