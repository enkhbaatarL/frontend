import { Stack, Tab, Tabs, Typography } from '@mui/material'
import { memo, useEffect, useMemo, useState } from 'react'

import type { PowerMixValidationError } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionPowerMixValidation'
import type { ScenarioGroupModelParamCompare } from '@/service/mi/nextGenMI/modelExecution'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import {
  buildCompareParamMatrixData,
  getCompareParameterChips,
  getUniqueModelNames,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalMapping'
import ScenarioModelExecutionProposalParamMatrix, {
  type ProposalParamVisibleScenario,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionProposalParamMatrix'

interface ScenarioModelExecutionProposalParamPanelProps {
  visibleScenarios: ProposalParamVisibleScenario[]
  compare: ScenarioGroupModelParamCompare | null
  receivedCompare: ScenarioGroupModelParamCompare | null
  powerMixErrors: PowerMixValidationError[]
  resetToken?: number
  /** 수급모델 제출/초기화 중 Value·네비게이션 잠금 (PopupContent isSubmitting || isResetting) */
  disabled?: boolean
  canDownloadInputFiles?: boolean
  isDownloadingInputFiles?: boolean
  onDownloadInputFiles?: () => void
  onHasEditsChange?: (hasEdits: boolean) => void
  onChangeScenarioValue?: (args: {
    scenarioId: number
    modelFileName: string | null
    modelSheetName: string | null
    modelTableName: string | null
    parameterIndex: number
    periodTimeKey: string
    rowIndex: number
    nextValue: number
  }) => void
}

const ParameterChip = ({
  label,
  selected,
  disabled = false,
  onClick,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) => (
  <MIBaseButton
    variant="outlined"
    onClick={onClick}
    disabled={disabled}
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
    <Typography variant={selected ? 'body2SB14' : 'body2M14'} color={selected ? 'contentText.Black' : 'contentText.Normal'} noWrap>
      {label}
    </Typography>
  </MIBaseButton>
)

const ScenarioModelExecutionProposalParamPanel = ({
  visibleScenarios,
  compare,
  receivedCompare,
  powerMixErrors,
  resetToken,
  disabled = false,
  canDownloadInputFiles = false,
  isDownloadingInputFiles = false,
  onDownloadInputFiles,
  onHasEditsChange,
  onChangeScenarioValue,
}: ScenarioModelExecutionProposalParamPanelProps) => {
  const modelFiles = useMemo(() => getUniqueModelNames(compare?.modelFiles.map((file) => file.modelFile) ?? []), [compare?.modelFiles])
  const [modelFile, setModelFile] = useState<string | null>(null)
  const [modelSheet, setModelSheet] = useState<string | null>(null)
  const [modelTable, setModelTable] = useState<string | null>(null)
  const [parameterIndex, setParameterIndex] = useState(0)

  const activeModelFile = modelFile && modelFiles.includes(modelFile) ? modelFile : (modelFiles[0] ?? null)
  const activeModelFileNode = compare?.modelFiles.find((file) => file.modelFile === activeModelFile)
  const modelSheets = useMemo(
    () => getUniqueModelNames(activeModelFileNode?.modelSheets?.map((sheet) => sheet.modelSheet) ?? []),
    [activeModelFileNode?.modelSheets],
  )
  const activeModelSheet = modelSheet && modelSheets.includes(modelSheet) ? modelSheet : (modelSheets[0] ?? null)
  const activeModelSheetNode = activeModelFileNode?.modelSheets?.find((sheet) => sheet.modelSheet === activeModelSheet)
  const modelTables = useMemo(() => getUniqueModelNames(activeModelSheetNode?.tableNames ?? []), [activeModelSheetNode?.tableNames])
  const activeModelTable = modelTable && modelTables.includes(modelTable) ? modelTable : (modelTables[0] ?? null)

  const parameterChips = useMemo(
    () => getCompareParameterChips(compare, activeModelFile, activeModelSheet, activeModelTable),
    [activeModelFile, activeModelSheet, activeModelTable, compare],
  )
  const activeParameterIndex = parameterIndex < parameterChips.length ? parameterIndex : 0

  // matrix 데이터는 표시 토글과 무관하게 유지. 눈 아이콘으로 숨겨도 baseline/수정상태가 깨지지 않게 함.
  const matrixScenarioIds = useMemo(() => {
    const ids = new Set<number>()
    ;(compare?.scenarios ?? []).forEach((scenario) => ids.add(scenario.scenarioId))
    visibleScenarios.forEach((scenario) => ids.add(scenario.scenarioId))
    return Array.from(ids).sort((left, right) => left - right)
  }, [compare, visibleScenarios])

  useEffect(() => {
    setModelFile(activeModelFile)
  }, [activeModelFile])

  useEffect(() => {
    setModelSheet(activeModelSheet)
  }, [activeModelSheet])

  useEffect(() => {
    setModelTable(activeModelTable)
  }, [activeModelTable])

  useEffect(() => {
    setParameterIndex(0)
  }, [activeModelTable])

  const matrix = useMemo(
    () =>
      buildCompareParamMatrixData({
        compare,
        visibleScenarioIds: matrixScenarioIds,
        modelFileName: activeModelFile,
        modelSheetName: activeModelSheet,
        modelTableName: activeModelTable,
        parameterIndex: activeParameterIndex,
      }),
    [activeModelFile, activeModelSheet, activeModelTable, activeParameterIndex, compare, matrixScenarioIds],
  )

  const receivedMatrix = useMemo(
    () =>
      buildCompareParamMatrixData({
        compare: receivedCompare,
        visibleScenarioIds: matrixScenarioIds,
        modelFileName: activeModelFile,
        modelSheetName: activeModelSheet,
        modelTableName: activeModelTable,
        parameterIndex: activeParameterIndex,
      }),
    [activeModelFile, activeModelSheet, activeModelTable, activeParameterIndex, receivedCompare, matrixScenarioIds],
  )

  return (
    <Stack
      width="100%"
      flex="1 1 auto"
      minWidth={0}
      minHeight={0}
      overflow="hidden"
      borderTop="1px solid"
      borderColor="contentBorder.Normal"
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexShrink={0}
        height="54px"
        padding="0 24px"
        borderBottom="1px solid"
        borderColor="contentBorder.Normal"
        bgcolor="commonColor.White"
      >
        <Tabs
          value={activeModelFile ?? false}
          variant="scrollable"
          scrollButtons="auto"
          onChange={(_, value: string) => {
            if (disabled) return
            setModelFile(value)
          }}
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            height: '100%',
            minHeight: 0,
            borderBottom: 'none',
            '.MuiTabs-indicator': { height: '2px', bgcolor: 'commonColor.Black' },
            '& .MuiTab-root': {
              minWidth: 0,
              minHeight: 0,
              height: '54px',
              padding: '0 20px',
              color: 'contentText.Black',
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: 1.4,
              textTransform: 'none',
              '&.Mui-selected': { color: 'commonColor.Black', fontWeight: 700 },
              '&.Mui-disabled': { color: 'contentText.Disabled' },
            },
          }}
        >
          {modelFiles.map((fileName) => (
            <Tab key={fileName} label={fileName} value={fileName} disableRipple disabled={disabled} />
          ))}
        </Tabs>
        <MIBaseButton
          variant="outlined"
          prefix={<FileDownloadIcon width={20} height={20} />}
          disabled={disabled || !canDownloadInputFiles || isDownloadingInputFiles}
          isLoading={isDownloadingInputFiles}
          onClick={onDownloadInputFiles}
          sx={{ flexShrink: 0, height: '36px', borderRadius: '8px', padding: '8px 10px 8px 6px' }}
        >
          인풋 파일 다운로드
        </MIBaseButton>
      </Stack>

      <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.10">
        <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
          {modelSheets.map((sheetName) => (
            <ParameterChip
              key={sheetName}
              label={sheetName}
              selected={sheetName === activeModelSheet}
              disabled={disabled}
              onClick={() => setModelSheet(sheetName)}
            />
          ))}
        </HorizontalScrollContainer>
      </Stack>

      {modelTables.length > 0 && (
        <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.5" gap="8px">
          <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
            {modelTables.map((tableName) => (
              <ParameterChip
                key={tableName}
                label={activeModelSheetNode?.tables?.find((table) => table.tableName === tableName)?.displayTableName ?? tableName}
                selected={tableName === activeModelTable}
                disabled={disabled}
                onClick={() => setModelTable(tableName)}
              />
            ))}
          </HorizontalScrollContainer>
        </Stack>
      )}
      {parameterChips.length > 1 && (
        <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.10">
          <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
            {parameterChips.map((chip) => (
              <ParameterChip
                key={chip.index}
                label={chip.label}
                selected={chip.index === activeParameterIndex}
                disabled={disabled}
                onClick={() => setParameterIndex(chip.index)}
              />
            ))}
          </HorizontalScrollContainer>
        </Stack>
      )}

      <Stack flex="1 1 0" minWidth={0} minHeight={0} overflow="hidden" padding="20px 24px" bgcolor="commonColor.White">
        {visibleScenarios.length === 0 ? (
          <Stack
            flex="1 1 0"
            minHeight={0}
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor="contentBorder.Normal"
            borderRadius="8px"
          >
            <Typography variant="body3SB12" color="gray.60">
              표시할 시나리오 파라미터가 없습니다.
            </Typography>
          </Stack>
        ) : null}
        {/* 표시 시나리오가 0이어도 언마운트하지 않음 - 수정 baseline/edited 상태 유지 */}
        <Stack
          flex={visibleScenarios.length === 0 ? undefined : '1 1 0'}
          minHeight={0}
          minWidth={0}
          width="100%"
          display={visibleScenarios.length === 0 ? 'none' : 'flex'}
        >
          <ScenarioModelExecutionProposalParamMatrix
            visibleScenarios={visibleScenarios}
            proposalScenarios={compare?.scenarios ?? []}
            matrix={matrix}
            receivedMatrix={receivedMatrix}
            powerMixErrors={
              activeModelFile === 'Demand' && activeModelSheet === 'PowerMixAdjustment'
                ? powerMixErrors.filter(
                  (error) => error.modelTableName === activeModelTable && error.parameterIndex === activeParameterIndex,
                )
                : []
            }
            scrollResetKey={JSON.stringify([activeModelFile, activeModelSheet, activeModelTable, activeParameterIndex])}
            resetToken={resetToken}
            disabled={disabled}
            onHasEditsChange={onHasEditsChange}
            onChangeScenarioValue={(scenarioId, periodTimeKey, rowIndex, nextValue) =>
              onChangeScenarioValue?.({
                scenarioId,
                modelFileName: activeModelFile,
                modelSheetName: activeModelSheet,
                modelTableName: activeModelTable,
                parameterIndex: activeParameterIndex,
                periodTimeKey,
                rowIndex,
                nextValue,
              })
            }
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default memo(ScenarioModelExecutionProposalParamPanel)
