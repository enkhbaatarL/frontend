import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, CircularProgress, ClickAwayListener, Divider, Paper, Popper, Stack, Typography } from '@mui/material'
import { useRef, useState } from 'react'

import type { ScenarioModelExecutionOption } from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionPopupContent'

import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioModelExecutionRerunConfirmDialog from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionRerunConfirmDialog'

interface ScenarioModelExecutionButtonProps {
  options: ScenarioModelExecutionOption[]
  executingScenarioIds: Set<number>
  onExecute: (scenarioId: number) => void
  onExecuteNew: () => void
}

const OptionActionButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      padding: '6px 10px',
      bgcolor: 'commonColor.White',
      border: '1px solid',
      borderColor: 'contentBorder.Normal',
      borderRadius: '8px',
      cursor: 'pointer',
    }}
  >
    <Typography sx={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.4, color: 'contentText.Normal', whiteSpace: 'nowrap' }}>
      {label}
    </Typography>
  </Box>
)

const OptionStatusLabel = ({ label }: { label: string }) => (
  <Box
    sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '6px 10px', border: '1px solid transparent', borderRadius: '8px' }}
  >
    <Typography sx={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.4, color: 'contentText.Disabled', whiteSpace: 'nowrap' }}>
      {label}
    </Typography>
  </Box>
)

const OptionExecutingLabel = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      flexShrink: 0,
      padding: '6px 10px 6px 6px',
      border: '1px solid transparent',
      borderRadius: '8px',
    }}
  >
    <CircularProgress size={16} sx={{ color: 'contentText.Disabled' }} />
    <Typography sx={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.4, color: 'contentText.Disabled', whiteSpace: 'nowrap' }}>
      실행 중...
    </Typography>
  </Box>
)

const ScenarioModelExecutionButton = ({ options, executingScenarioIds, onExecute, onExecuteNew }: ScenarioModelExecutionButtonProps) => {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [hoveredScenarioId, setHoveredScenarioId] = useState<number | null>(null)
  const [rerunConfirmScenarioId, setRerunConfirmScenarioId] = useState<number | null>(null)

  const handleExecute = (scenarioId: number) => {
    onExecute(scenarioId)
    setOpen(false)
  }

  const handleRerunClick = (scenarioId: number) => {
    setRerunConfirmScenarioId(scenarioId)
    setOpen(false)
  }

  const handleRerunConfirm = () => {
    if (rerunConfirmScenarioId === null) return
    onExecute(rerunConfirmScenarioId)
    setRerunConfirmScenarioId(null)
  }

  const handleRerunConfirmClose = () => {
    setRerunConfirmScenarioId(null)
  }

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ flexShrink: 0 }}>
        <Stack
          ref={anchorRef}
          direction="row"
          alignItems="stretch"
          sx={{ bgcolor: 'commonColor.Primary', borderRadius: '10px', height: '36px', overflow: 'hidden' }}
        >
          <Box
            component="button"
            type="button"
            onClick={onExecuteNew}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 10px',
              border: 'none',
              bgcolor: 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            <Typography variant="body2SB14" sx={{ color: 'commonColor.White', whiteSpace: 'nowrap' }}>
              MI 수급모델 실행
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

          <Box
            component="button"
            type="button"
            aria-label="실행 시나리오 목록 열기"
            onClick={() => setOpen((prev) => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 6px',
              border: 'none',
              bgcolor: open ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              '&:hover': { bgcolor: open ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)' },
            }}
          >
            <KeyboardArrowDownRounded
              sx={{
                fontSize: '20px',
                color: 'commonColor.White',
                transition: 'transform 0.15s ease',
                transform: open ? 'rotate(180deg)' : 'none',
              }}
            />
          </Box>
        </Stack>

        <Popper open={open} anchorEl={anchorRef.current} placement="bottom-end" sx={{ zIndex: 1300 }}>
          <Paper
            elevation={0}
            sx={{
              width: '400px',
              mt: '6px',
              bgcolor: 'commonColor.White',
              border: '1px solid',
              borderColor: 'contentBorder.Normal',
              borderRadius: '10px',
              boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.10)',
              overflow: 'hidden',
            }}
          >
            <Stack padding="6px">
              {options.map((option) => {
                const executing = executingScenarioIds.has(option.scenarioId)
                const isHovered = hoveredScenarioId === option.scenarioId

                return (
                  <Stack
                    key={option.scenarioId}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    onMouseEnter={() => setHoveredScenarioId(option.scenarioId)}
                    onMouseLeave={() => setHoveredScenarioId(null)}
                    sx={{
                      padding: '6px 10px',
                      borderRadius: '10px',
                      transition: 'background-color 0.15s ease',
                      bgcolor: isHovered ? 'gray.20' : 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: '1 1 0', padding: '4px 6px' }}>
                      <NextGenMITableBodyText
                        value={option.scenarioName}
                        variant="body2M14"
                        color="contentText.Normal"
                        tooltipWhenTruncated
                        sx={{ userSelect: 'none' }}
                      />
                    </Box>

                    {executing ? (
                      <OptionExecutingLabel />
                    ) : option.disabled ? (
                      <OptionStatusLabel label="폐기" />
                    ) : option.executed ? (
                      isHovered ? (
                        <OptionActionButton label="재실행" onClick={() => handleRerunClick(option.scenarioId)} />
                      ) : (
                        <OptionStatusLabel label="완료" />
                      )
                    ) : (
                      <OptionActionButton label="실행" onClick={() => handleExecute(option.scenarioId)} />
                    )}
                  </Stack>
                )
              })}
            </Stack>

            <Stack sx={{ padding: '12px 6px', bgcolor: 'commonColor.White' }}>
              <Stack direction="row" alignItems="flex-start" gap="4px" sx={{ padding: '0 10px' }}>
                <InfoOutlinedIcon sx={{ fontSize: '16px', color: 'contentText.Subtext', flexShrink: 0 }} />
                <Typography variant="body3M12" color="contentText.Subtext">
                  가격 전망 데이터와 그래프를 생성하려면 MI 수급모델을 실행해야 합니다.
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Popper>

        <ScenarioModelExecutionRerunConfirmDialog
          open={rerunConfirmScenarioId !== null}
          onClose={handleRerunConfirmClose}
          onConfirm={handleRerunConfirm}
        />
      </Box>
    </ClickAwayListener>
  )
}

export default ScenarioModelExecutionButton
