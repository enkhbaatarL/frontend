/** #DELETE: 추천 파라미터 패널 목 UI (API 연동 후 파일 삭제) */
import { Stack, Tab, Tabs, Typography } from '@mui/material'
import { useMemo, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
// #DELETE: 목 파라미터 매트릭스 (API 연동 후 ParamPanel 체인과 함께 삭제)
import ScenarioModelExecutionProposalParamMatrix, {
  type ProposalParamVisibleScenario,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionProposalParamMatrix'
// #DELETE: 파라미터 네비게이션/표 목
import { createProposalParamMatrixMock } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalParamMock'

interface ScenarioModelExecutionProposalParamPanelProps {
  visibleScenarios: ProposalParamVisibleScenario[]
  resetToken?: number
  onHasEditsChange?: (hasEdits: boolean) => void
}

const ParameterChip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <MIBaseButton
    variant="outlined"
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
    <Typography variant={selected ? 'body2SB14' : 'body2M14'} color={selected ? 'contentText.Black' : 'contentText.Normal'} noWrap>
      {label}
    </Typography>
  </MIBaseButton>
)

const ScenarioModelExecutionProposalParamPanel = ({
  visibleScenarios,
  resetToken,
  onHasEditsChange,
}: ScenarioModelExecutionProposalParamPanelProps) => {
  // #DELETE: 모델 파일/시트/테이블 칩 네비게이션 목
  const navigation = useMemo(() => createProposalParamMatrixMock([]), [])
  const [modelFile, setModelFile] = useState(navigation.modelFiles[0] ?? 'Demand')
  const [modelSheet, setModelSheet] = useState(navigation.modelSheets[0] ?? 'PowerMix')
  const [modelTable, setModelTable] = useState(navigation.modelTables[0] ?? 'Table 1')

  return (
    <Stack width="100%" minHeight={0} borderTop="1px solid" borderColor="contentBorder.Normal">
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
          value={modelFile}
          onChange={(_, value: string) => setModelFile(value)}
          sx={{
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
            },
          }}
        >
          {navigation.modelFiles.map((fileName) => (
            <Tab key={fileName} label={fileName} value={fileName} disableRipple />
          ))}
        </Tabs>
        <MIBaseButton
          variant="outlined"
          prefix={<FileDownloadIcon width={20} height={20} />}
          disabled
          sx={{ flexShrink: 0, height: '36px', borderRadius: '8px', padding: '8px 10px 8px 6px' }}
        >
          인풋 파일 다운로드
        </MIBaseButton>
      </Stack>

      <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.10">
        <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
          {navigation.modelSheets.map((sheetName) => (
            <ParameterChip key={sheetName} label={sheetName} selected={sheetName === modelSheet} onClick={() => setModelSheet(sheetName)} />
          ))}
        </HorizontalScrollContainer>
      </Stack>

      <Stack flexShrink={0} padding="12px 24px" bgcolor="gray.5">
        <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
          {navigation.modelTables.map((tableName) => (
            <ParameterChip key={tableName} label={tableName} selected={tableName === modelTable} onClick={() => setModelTable(tableName)} />
          ))}
        </HorizontalScrollContainer>
      </Stack>

      <Stack flexShrink={0} padding="12px 24px 16px" bgcolor="commonColor.White">
        {visibleScenarios.length === 0 ? (
          <Stack
            height="240px"
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
        ) : (
          <ScenarioModelExecutionProposalParamMatrix
            visibleScenarios={visibleScenarios}
            resetToken={resetToken}
            onHasEditsChange={onHasEditsChange}
          />
        )}
      </Stack>
    </Stack>
  )
}

export default ScenarioModelExecutionProposalParamPanel
