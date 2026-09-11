/** #DELETE: 추천 파라미터 리스트 UI 목 화면 (API 연동 후 파일 삭제) */
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Box, Checkbox, CircularProgress, Collapse, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'
import ReplayIcon from '@/components/common/icons/ReplayIcon'
import VisibilityIcon from '@/components/common/icons/VisibilityIcon'
import VisibilityOffIcon from '@/components/common/icons/VisibilityOffIcon'
import useSnackbar from '@/hooks/useSnackbar'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioPossibilityGauge from '@/pages/mi/nextGenMI/components/common/ScenarioPossibilityGauge'
// #DELETE: 목 파라미터 패널 (API 연동 후 ProposalList 체인과 함께 삭제)
import {
  createModelParamProposalScenarioGroupMock,
  type ModelParamProposalRowStatus,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalListMock'
import ScenarioModelExecutionProposalParamPanel from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionProposalParamPanel'
// #DELETE: 추천 파라미터 리스트 UI 목
import { getRandomNumber } from '@/utils/random'

const isDimmedStatus = (status: ModelParamProposalRowStatus) => status === 'failed' || status === 'retryable'
const canShowVisibilityToggle = (status: ModelParamProposalRowStatus) => status === 'completed' || status === 'generating'

interface ScenarioModelExecutionProposalListProps {
  onCancel: () => void
}

// #DELETE: 목 검증용 배너/로딩 문구 (API 연동 후 ProposalList와 함께 삭제)
const BANNER_MESSAGE = '각 시나리오의 [생성] 버튼을 눌러 추천 파라미터를 생성해 주세요.'
const GENERATING_MESSAGE = '파라미터를 생성하고 있습니다'

const StatusCell = ({
  status,
  failureReason,
  disabled,
  onGenerate,
  onRetry,
}: {
  status: ModelParamProposalRowStatus
  failureReason?: string
  disabled?: boolean
  onGenerate: () => void
  onRetry: () => void
}) => {
  if (status === 'generating') {
    return (
      <Stack direction="row" alignItems="center" justifyContent="center" gap="4px" width="100%" minWidth={0}>
        <CircularProgress size={16} sx={{ color: 'contentText.Disabled' }} />
        <Typography variant="body2SB14" color="contentText.Disabled" noWrap>
          생성 중
        </Typography>
      </Stack>
    )
  }

  if (status === 'completed') {
    return (
      <Typography variant="body2SB14" color="contentText.Subtext" textAlign="center" width="100%">
        완료
      </Typography>
    )
  }

  if (status === 'failed') {
    const label = (
      <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" width="100%" minWidth={0}>
        <WarningAmberRoundedIcon sx={{ fontSize: '16px', color: '#ea580c' }} />
        <Typography variant="body2SB14" color="#ea580c" noWrap>
          실패
        </Typography>
      </Stack>
    )

    if (!failureReason?.trim()) return label

    return (
      <NextGenMIFollowCursorTooltip title={failureReason}>
        <Box component="span" display="inline-flex" width="100%" sx={{ cursor: 'default' }}>
          {label}
        </Box>
      </NextGenMIFollowCursorTooltip>
    )
  }

  if (status === 'retryable') {
    return (
      <MIBaseButton
        variant="outlined"
        disabled={disabled}
        onClick={onRetry}
        sx={{ height: '32px', minWidth: '72px', borderRadius: '8px', padding: '0 10px' }}
      >
        재시도
      </MIBaseButton>
    )
  }

  return (
    <MIBaseButton
      variant="outlined"
      disabled={disabled}
      onClick={onGenerate}
      sx={{ height: '32px', minWidth: '72px', borderRadius: '8px', padding: '0 10px' }}
    >
      생성
    </MIBaseButton>
  )
}

const ScenarioModelExecutionProposalList = ({ onCancel }: ScenarioModelExecutionProposalListProps) => {
  const { showSnackbar } = useSnackbar()
  // #DELETE: 목 그룹 데이터로 리스트 UI 검증 (API 연동 후 컴포넌트 삭제)
  const [group] = useState(() => createModelParamProposalScenarioGroupMock())
  const [scenarios, setScenarios] = useState(() => group.scenarios)
  const [expanded, setExpanded] = useState(true)
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<number[]>([])
  const [visibleScenarioIds, setVisibleScenarioIds] = useState<number[]>(() =>
    group.scenarios
      .filter((scenario) => scenario.status === 'completed' || scenario.status === 'generating')
      .map((scenario) => scenario.scenarioId),
  )
  const [paramResetToken, setParamResetToken] = useState(0)
  const [hasParamEdits, setHasParamEdits] = useState(false)
  const [emptySelectionConfirmOpen, setEmptySelectionConfirmOpen] = useState(false)
  const [executionConfirmOpen, setExecutionConfirmOpen] = useState(false)
  const generationTimersRef = useRef<Map<number, ReturnType<typeof globalThis.setTimeout>>>(new Map())

  const completedScenarioIds = useMemo(
    () => scenarios.filter((scenario) => scenario.status === 'completed').map((scenario) => scenario.scenarioId),
    [scenarios],
  )
  const columnScenarioIds = useMemo(
    () =>
      scenarios
        .filter((scenario) => scenario.status === 'completed' || scenario.status === 'generating')
        .map((scenario) => scenario.scenarioId),
    [scenarios],
  )
  const selectableScenarioIds = completedScenarioIds
  const hasCompleted = completedScenarioIds.length > 0
  const isGeneratingAny = scenarios.some((scenario) => scenario.status === 'generating')
  // 완료가 있으면 Case1 파라미터 표, 없으면 생성 중 플레이스홀더
  const showGeneratingPlaceholder = !hasCompleted && isGeneratingAny
  const showParamPanel = hasCompleted || isGeneratingAny
  const visibleScenarios = useMemo(
    () =>
      scenarios
        .filter(
          (scenario) =>
            (scenario.status === 'completed' || scenario.status === 'generating') && visibleScenarioIds.includes(scenario.scenarioId),
        )
        .map((scenario) => ({
          scenarioId: scenario.scenarioId,
          scenarioName: scenario.scenarioName,
          status: scenario.status === 'generating' ? ('generating' as const) : ('completed' as const),
        })),
    [scenarios, visibleScenarioIds],
  )
  const selectedCompletedCount = selectedScenarioIds.filter((scenarioId) => completedScenarioIds.includes(scenarioId)).length
  const allSelectableChecked = selectableScenarioIds.length > 0 && selectableScenarioIds.every((id) => selectedScenarioIds.includes(id))
  const someSelectableChecked = selectableScenarioIds.some((id) => selectedScenarioIds.includes(id))

  useEffect(() => {
    const timers = generationTimersRef.current
    return () => {
      timers.forEach((timerId) => globalThis.clearTimeout(timerId))
      timers.clear()
    }
  }, [])

  useEffect(() => {
    setSelectedScenarioIds((prev) => prev.filter((scenarioId) => completedScenarioIds.includes(scenarioId)))
    setVisibleScenarioIds((prev) => {
      const next = prev.filter((scenarioId) => columnScenarioIds.includes(scenarioId))
      const missing = columnScenarioIds.filter((scenarioId) => !next.includes(scenarioId))
      return missing.length === 0 ? next : [...next, ...missing]
    })
  }, [columnScenarioIds, completedScenarioIds])

  const startGeneration = (scenarioId: number) => {
    const existingTimer = generationTimersRef.current.get(scenarioId)
    if (existingTimer !== undefined) globalThis.clearTimeout(existingTimer)

    setScenarios((prev) =>
      prev.map((scenario) =>
        scenario.scenarioId === scenarioId
          ? { ...scenario, status: 'generating', showVisibilityToggle: true, failureReason: undefined }
          : scenario,
      ),
    )
    setVisibleScenarioIds((prev) => (prev.includes(scenarioId) ? prev : [...prev, scenarioId]))

    const delayMs = Math.round(getRandomNumber(1200, 2200))
    const timerId = globalThis.setTimeout(() => {
      generationTimersRef.current.delete(scenarioId)
      setScenarios((prev) =>
        prev.map((scenario) =>
          scenario.scenarioId === scenarioId
            ? { ...scenario, status: 'completed', showVisibilityToggle: true, failureReason: undefined }
            : scenario,
        ),
      )
    }, delayMs)

    generationTimersRef.current.set(scenarioId, timerId)
  }

  const handleToggleVisibility = (scenarioId: number) => {
    setVisibleScenarioIds((prev) => {
      if (prev.includes(scenarioId)) return prev.filter((id) => id !== scenarioId)
      return [...prev, scenarioId]
    })
  }

  const handleToggleScenario = (scenarioId: number, checked: boolean) => {
    if (!selectableScenarioIds.includes(scenarioId)) return
    setSelectedScenarioIds((prev) => {
      if (checked) return prev.includes(scenarioId) ? prev : [...prev, scenarioId]
      return prev.filter((id) => id !== scenarioId)
    })
  }

  const handleToggleAll = (checked: boolean) => {
    setSelectedScenarioIds(checked ? [...selectableScenarioIds] : [])
  }

  const handleExecuteClick = () => {
    if (selectedCompletedCount === 0) {
      setEmptySelectionConfirmOpen(true)
      return
    }
    setExecutionConfirmOpen(true)
  }

  const handleExecutionConfirm = () => {
    // #DELETE: 목 단계 - 선택 시나리오 + 수정 파라미터로 실행 요청 전송 예정
    setExecutionConfirmOpen(false)
    showSnackbar(`선택한 시나리오 ${selectedCompletedCount}개로 MI 수급모델 실행을 요청했습니다.`, { variant: 'success' })
    onCancel()
  }

  return (
    <Stack width="100%" height="100%" minHeight={0} overflow="hidden">
      {/* 본문 스크롤 - 하단 초기화/실행 액션은 고정 (디자인 Action Button 76px) */}
      <Stack flex="1 1 0" minHeight={0} overflow="auto">
        <Stack flexShrink={0} padding="10px 20px 0">
          <Stack
            direction="row"
            alignItems="flex-start"
            gap="8px"
            padding="10px 12px"
            borderRadius="8px"
            bgcolor="gray.5"
            border="1px solid"
            borderColor="contentBorder.Normal"
          >
            <InfoOutlineIcon width="16px" height="16px" aria-hidden />
            <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4}>
              {BANNER_MESSAGE}
            </Typography>
          </Stack>
        </Stack>

        <Stack flexShrink={0} padding="12px 20px 0">
          <Stack
            component="button"
            type="button"
            direction="row"
            alignItems="center"
            gap="0"
            width="100%"
            height="48px"
            padding="0"
            border="1px solid"
            borderColor="contentBorder.Normal"
            borderRadius={expanded ? '8px 8px 0 0' : '8px'}
            bgcolor={expanded ? 'gray.5' : 'commonColor.White'}
            onClick={() => setExpanded((prev) => !prev)}
            sx={{
              cursor: 'pointer',
              textAlign: 'left',
              '&:hover': { bgcolor: expanded ? 'gray.5' : 'gray.10' },
            }}
          >
            <Stack width="32px" flexShrink={0} alignItems="center" justifyContent="center">
              <KeyboardArrowDownRounded
                sx={{
                  fontSize: '20px',
                  color: expanded ? 'contentIcon.Activeb' : 'contentIcon.Enabled',
                  transition: 'transform 150ms ease',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </Stack>
            <Typography variant="body2M14" color="contentText.Subtext" width="110px" flexShrink={0} noWrap>
              {group.createdAtLabel}
            </Typography>
            <Box width="10px" flexShrink={0} />
            <Box flex="1 1 0" minWidth={0} paddingRight="12px">
              <NextGenMITableBodyText value={group.groupName} variant="body2SB14" color="contentText.Black" tooltipWhenTruncated />
            </Box>
          </Stack>

          <Collapse in={expanded} timeout={180} unmountOnExit={false}>
            <Box border="1px solid" borderTop="none" borderColor="contentBorder.Normal" borderRadius="0 0 8px 8px" overflow="hidden">
              <Stack
                direction="row"
                alignItems="center"
                height="48px"
                bgcolor="gray.5"
                borderBottom="1px solid"
                borderColor="contentBorder.Normal"
              >
                <Stack width="36px" flexShrink={0} alignItems="center" justifyContent="center">
                  <Checkbox
                    size="small"
                    checked={allSelectableChecked}
                    indeterminate={!allSelectableChecked && someSelectableChecked}
                    disabled={selectableScenarioIds.length === 0}
                    onChange={(_, checked) => handleToggleAll(checked)}
                    sx={{ padding: '4px' }}
                  />
                </Stack>
                <Typography variant="body3SB12" color="contentText.Subtext" width="300px" flexShrink={0} padding="0 8px">
                  시나리오
                </Typography>
                <Stack direction="row" flex="1 1 0" minWidth={0}>
                  {group.dimensionColumns.map((column) => (
                    <Typography
                      key={column}
                      variant="body3SB12"
                      color="contentText.Subtext"
                      flex="1 1 0"
                      minWidth={0}
                      padding="0 8px"
                      noWrap
                    >
                      {column}
                    </Typography>
                  ))}
                </Stack>
                <Typography variant="body3SB12" color="contentText.Subtext" width="100px" flexShrink={0} textAlign="center">
                  실행가능성
                </Typography>
                <Typography variant="body3SB12" color="contentText.Subtext" width="92px" flexShrink={0} textAlign="center">
                  상태
                </Typography>
              </Stack>

              {scenarios.map((scenario) => {
                const selectable = scenario.status === 'completed'
                const checked = selectedScenarioIds.includes(scenario.scenarioId)
                const dimmed = isDimmedStatus(scenario.status)
                const showEye = scenario.showVisibilityToggle || canShowVisibilityToggle(scenario.status)
                const textColor = dimmed ? 'contentText.Disabled' : 'contentText.Black'
                const bodyColor = dimmed ? 'contentText.Disabled' : 'contentText.Normal'

                return (
                  <Stack
                    key={scenario.scenarioId}
                    direction="row"
                    alignItems="center"
                    height="48px"
                    borderBottom="1px solid"
                    borderColor="contentBorder.Normal"
                    sx={{ '&:last-of-type': { borderBottom: 'none' } }}
                  >
                    <Stack width="36px" flexShrink={0} alignItems="center" justifyContent="center" sx={{ opacity: dimmed ? 0.5 : 1 }}>
                      <Checkbox
                        size="small"
                        checked={checked}
                        disabled={!selectable}
                        onChange={(_, nextChecked) => handleToggleScenario(scenario.scenarioId, nextChecked)}
                        sx={{ padding: '4px' }}
                      />
                    </Stack>
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap="8px"
                      width="300px"
                      flexShrink={0}
                      minWidth={0}
                      padding="0 8px"
                      sx={{ opacity: dimmed ? 0.5 : 1 }}
                    >
                      <NextGenMIDisplayOrderBadge value={scenario.displayOrder} disabled={dimmed} />
                      <Box flex="1 1 0" minWidth={0}>
                        <NextGenMITableBodyText value={scenario.scenarioName} variant="body2M14" color={textColor} tooltipWhenTruncated />
                      </Box>
                      {showEye && (
                        <Box
                          component="button"
                          type="button"
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                          width="18px"
                          height="18px"
                          flexShrink={0}
                          padding={0}
                          border="none"
                          bgcolor="transparent"
                          color={visibleScenarioIds.includes(scenario.scenarioId) ? 'contentIcon.Enabled' : 'contentIcon.Disabled'}
                          sx={{
                            cursor: scenario.status === 'completed' || scenario.status === 'generating' ? 'pointer' : 'default',
                            opacity: scenario.status === 'completed' || scenario.status === 'generating' ? 1 : 0.5,
                          }}
                          aria-label={visibleScenarioIds.includes(scenario.scenarioId) ? '파라미터 컬럼 숨기기' : '파라미터 컬럼 표시'}
                          onClick={(event) => {
                            event.stopPropagation()
                            if (scenario.status !== 'completed' && scenario.status !== 'generating') return
                            handleToggleVisibility(scenario.scenarioId)
                          }}
                        >
                          {visibleScenarioIds.includes(scenario.scenarioId) ? (
                            <VisibilityIcon width="16px" height="16px" />
                          ) : (
                            <VisibilityOffIcon width="16px" height="16px" />
                          )}
                        </Box>
                      )}
                    </Stack>
                    <Stack direction="row" flex="1 1 0" minWidth={0} sx={{ opacity: dimmed ? 0.5 : 1 }}>
                      {scenario.dimensionValues.map((value, index) => (
                        <Box
                          key={`${scenario.scenarioId}-${group.dimensionColumns[index] ?? index}`}
                          flex="1 1 0"
                          minWidth={0}
                          padding="0 8px"
                        >
                          <NextGenMITableBodyText value={value} variant="body2M14" color={bodyColor} tooltipWhenTruncated />
                        </Box>
                      ))}
                    </Stack>
                    <Stack width="100px" flexShrink={0} alignItems="center" justifyContent="center" sx={{ opacity: dimmed ? 0.5 : 1 }}>
                      <ScenarioPossibilityGauge probability={scenario.possibility} disabled={dimmed} hideHoverBackground />
                    </Stack>
                    <Stack width="92px" flexShrink={0} alignItems="center" justifyContent="center" padding="0 6px">
                      <StatusCell
                        status={scenario.status}
                        failureReason={scenario.failureReason}
                        onGenerate={() => startGeneration(scenario.scenarioId)}
                        onRetry={() => startGeneration(scenario.scenarioId)}
                      />
                    </Stack>
                  </Stack>
                )
              })}
            </Box>
          </Collapse>
        </Stack>

        {showGeneratingPlaceholder && (
          <Stack flexShrink={0} height="240px" alignItems="center" justifyContent="center" gap="10px" padding="0 20px">
            <MIAgentSpinner size={24} tone="gray" sx={{ '& svg': { width: '24px', height: '24px' } }} />
            <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} textAlign="center">
              {GENERATING_MESSAGE}
            </Typography>
          </Stack>
        )}

        {showParamPanel && (
          <ScenarioModelExecutionProposalParamPanel
            visibleScenarios={visibleScenarios}
            resetToken={paramResetToken}
            onHasEditsChange={setHasParamEdits}
          />
        )}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap="8px"
        flexShrink={0}
        height="76px"
        padding="20px"
        boxSizing="border-box"
      >
        <MIBaseButton
          variant="outlined"
          disabled={!hasCompleted || !hasParamEdits}
          prefix={<ReplayIcon width={20} height={20} />}
          onClick={() => setParamResetToken((token) => token + 1)}
          sx={{ height: '36px', borderRadius: '8px', padding: '8px 10px 8px 6px' }}
        >
          초기화
        </MIBaseButton>
        <Stack direction="row" alignItems="center" gap="8px">
          <MIBaseButton variant="outlined" onClick={onCancel} sx={{ height: '36px', borderRadius: '8px', padding: '0 10px' }}>
            취소
          </MIBaseButton>
          <MIBaseButton
            variant="contained"
            disabled={!hasCompleted}
            onClick={handleExecuteClick}
            sx={{ height: '36px', bgcolor: 'mari.Primary', borderRadius: '8px' }}
          >
            {selectedCompletedCount > 0 ? `MI 수급모델 실행 (${selectedCompletedCount})` : 'MI 수급모델 실행'}
          </MIBaseButton>
        </Stack>
      </Stack>

      <MIConfirm
        open={emptySelectionConfirmOpen}
        title="실행할 시나리오를 선택해 주세요"
        handleClose={() => setEmptySelectionConfirmOpen(false)}
        width="450px"
        zIndex={1400}
        actions={[
          {
            label: '확인',
            variant: 'filled',
            color: 'primary',
            onClick: () => setEmptySelectionConfirmOpen(false),
          },
        ]}
      >
        수급모델을 실행하려면 시나리오를 1개 이상 선택해 주세요.
      </MIConfirm>

      <MIConfirm
        open={executionConfirmOpen}
        title="MI 수급모델을 실행하시겠습니까?"
        handleClose={() => setExecutionConfirmOpen(false)}
        width="450px"
        zIndex={1400}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: () => setExecutionConfirmOpen(false),
          },
          {
            label: '실행',
            variant: 'filled',
            color: 'primary',
            onClick: handleExecutionConfirm,
          },
        ]}
      >
        선택한 시나리오와 파라미터 기준으로 수급모델을 실행합니다. 실행 가능한 시나리오만 실행되며, 실패 상태의 시나리오는 제외됩니다.
      </MIConfirm>
    </Stack>
  )
}

export default ScenarioModelExecutionProposalList
