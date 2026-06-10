import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import { Box, Divider, Popover, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIInput from '@/components/common/input/MIInput'
import { type ScenarioDesignBranchField, SCENARIO_DESIGN_CRITERIA_OPTIONS } from '@/pages/mi/nextGenMI/scenarioDesignMockData'

export type ScenarioDesignCriteriaCellMode = 'standard' | 'agentAuto' | 'directInput'

export interface ScenarioDesignCriteriaChange {
  value: string
  mode: ScenarioDesignCriteriaCellMode
}

interface ScenarioDesignCriteriaDropdownProps {
  field: ScenarioDesignBranchField
  value: string
  mode: ScenarioDesignCriteriaCellMode
  initialValue: string
  disabled?: boolean
  placeholder?: string
  onChange: (change: ScenarioDesignCriteriaChange) => void
}

const CELL_HEIGHT = '36px'
const DROPDOWN_WIDTH = '260px'

const ScenarioDesignCriteriaDropdown = ({
  field,
  value,
  mode,
  initialValue,
  disabled = false,
  placeholder = '분기기준값',
  onChange,
}: ScenarioDesignCriteriaDropdownProps) => {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [isDirectInputMode, setIsDirectInputMode] = useState(false)
  const [directInputDraft, setDirectInputDraft] = useState('')

  const allOptions = SCENARIO_DESIGN_CRITERIA_OPTIONS[field] ?? []
  const hasSavedDirectInput = mode === 'directInput' && Boolean(value)

  const canReset = mode !== 'standard' || value !== initialValue

  useEffect(() => {
    if (!open) {
      setIsDirectInputMode(false)
      setDirectInputDraft('')
    }
  }, [open])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const handleSelectOption = useCallback(
    (option: string) => {
      onChange({ value: option, mode: 'standard' })
      handleClose()
    },
    [handleClose, onChange],
  )

  const handleSelectAgentAuto = useCallback(() => {
    onChange({ value: '', mode: 'agentAuto' })
    handleClose()
  }, [handleClose, onChange])

  const handleStartDirectInput = useCallback(() => {
    setIsDirectInputMode(true)
    setDirectInputDraft(mode === 'directInput' ? value : '')
  }, [mode, value])

  const handleSaveDirectInput = useCallback(() => {
    const trimmed = directInputDraft.trim()
    if (!trimmed) return
    onChange({ value: trimmed, mode: 'directInput' })
    handleClose()
  }, [directInputDraft, handleClose, onChange])

  const handleReset = useCallback(() => {
    if (!canReset) return
    onChange({ value: initialValue, mode: 'standard' })
    handleClose()
  }, [canReset, handleClose, initialValue, onChange])

  const displayLabel = useMemo(() => {
    if (mode === 'agentAuto') return 'Agent 자동 설정'
    if (mode === 'directInput') return value || '직접 입력값'
    return value || placeholder
  }, [mode, placeholder, value])

  const triggerContent = useMemo(() => {
    if (mode === 'agentAuto') {
      return (
        <Stack
          direction="row"
          alignItems="center"
          gap="4px"
          bgcolor="contentBG.PrimaryFade"
          borderRadius="8px"
          pl="4px"
          pr="8px"
          py="4px"
          flex={1}
          minWidth={0}
        >
          <AutoAwesomeRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled', flexShrink: 0 }} />
          <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4} noWrap>
            Agent 자동 설정
          </Typography>
        </Stack>
      )
    }
    if (mode === 'directInput') {
      return (
        <Stack
          direction="row"
          alignItems="center"
          gap="4px"
          bgcolor="contentBG.PrimaryFade"
          borderRadius="8px"
          pl="4px"
          pr="8px"
          py="4px"
          flex={1}
          minWidth={0}
        >
          <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled', flexShrink: 0 }} />
          <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4} noWrap>
            {displayLabel}
          </Typography>
        </Stack>
      )
    }
    return (
      <Typography variant="body2M14" color={value ? 'contentText.Normal' : 'contentText.Placeholder'} lineHeight={1.4} noWrap flex={1}>
        {displayLabel}
      </Typography>
    )
  }, [displayLabel, mode, value])

  return (
    <>
      <Box
        ref={anchorRef}
        border="1px solid"
        borderColor={open ? 'contentBorder.Active' : 'contentBorder.Normal'}
        borderRadius="8px"
        height={CELL_HEIGHT}
        width="100%"
        minWidth={0}
        maxWidth="100%"
        px={mode === 'standard' ? '12px' : '4px'}
        pr="12px"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="8px"
        bgcolor={open ? 'gray.5' : 'commonColor.White'}
        onClick={disabled ? undefined : () => setOpen((prev) => !prev)}
        sx={[
          { boxSizing: 'border-box', width: '100%', minWidth: 0, maxWidth: '100%' },
          disabled
            ? { opacity: 0.45, pointerEvents: 'none' }
            : {
              cursor: 'pointer',
              '&:hover': {
                bgcolor: open ? 'gray.5' : 'contentBG.Hover',
                borderColor: open ? 'contentBorder.Active' : 'contentBorder.Hover',
              },
            },
        ]}
      >
        {triggerContent}
        {open ? (
          <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled', flexShrink: 0 }} />
        ) : (
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled', flexShrink: 0 }} />
        )}
      </Box>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: DROPDOWN_WIDTH,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: 'contentBorder.Normal',
              boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.1)',
              mt: '4px',
              p: '8px',
            },
          },
        }}
      >
        <Stack gap="8px">
          <Stack gap="0px">
            {allOptions.map((option) => {
              const selected = mode === 'standard' && value === option
              return (
                <Stack
                  key={option}
                  direction="row"
                  alignItems="center"
                  gap="8px"
                  minHeight="36px"
                  pl="6px"
                  pr="12px"
                  py="8px"
                  borderRadius="10px"
                  bgcolor={selected ? 'contentBG.PrimaryFade' : 'transparent'}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: selected ? 'contentBG.PrimaryFade' : 'gray.5' } }}
                  onClick={() => handleSelectOption(option)}
                >
                  <CheckRoundedIcon
                    sx={{
                      fontSize: 20,
                      color: selected ? 'contentIcon.ActivePrimary' : 'transparent',
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body2M14"
                    color={selected ? 'contentText.Black' : 'contentText.Normal'}
                    lineHeight={1.4}
                    noWrap
                    flex={1}
                  >
                    {option}
                  </Typography>
                </Stack>
              )
            })}
          </Stack>
          <Divider />
          <Stack
            direction="row"
            alignItems="center"
            gap="8px"
            minHeight="36px"
            pl="6px"
            pr="12px"
            py="8px"
            borderRadius="10px"
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'gray.5' } }}
            onClick={handleSelectAgentAuto}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled', flexShrink: 0 }} />
            <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4} noWrap flex={1}>
              Agent 자동 설정
            </Typography>
          </Stack>
          <Divider />
          {hasSavedDirectInput && !isDirectInputMode ? (
            <Stack
              direction="row"
              alignItems="center"
              gap="4px"
              height={CELL_HEIGHT}
              p="8px"
              borderRadius="8px"
              bgcolor="contentBG.PrimaryFade"
              sx={{ cursor: 'pointer' }}
              onClick={handleStartDirectInput}
            >
              <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled', flexShrink: 0 }} />
              <Typography variant="body2M14" color="contentText.Black" lineHeight={1.4} noWrap flex={1}>
                {value}
              </Typography>
            </Stack>
          ) : isDirectInputMode ? (
            <Stack
              direction="row"
              alignItems="center"
              gap="4px"
              height={CELL_HEIGHT}
              p="8px"
              border="1px solid"
              borderColor="contentBorder.Active"
              borderRadius="8px"
              bgcolor="gray.5"
            >
              <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled', flexShrink: 0 }} />
              <MIInput
                variant="inTable"
                size="h36"
                value={directInputDraft}
                onChange={(event) => setDirectInputDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSaveDirectInput()
                  }
                }}
                placeholder="직접 입력"
                autoFocus
                sx={{ flex: 1, minWidth: 0 }}
              />
              <MIBaseButton
                variant="contained"
                onClick={handleSaveDirectInput}
                disabled={!directInputDraft.trim()}
                sx={{
                  height: '28px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  bgcolor: directInputDraft.trim() ? 'contentIcon.ActivePrimary' : 'contentBG.Disabled',
                  color: 'commonColor.White',
                  flexShrink: 0,
                  '&.Mui-disabled': { bgcolor: 'contentBG.Disabled', color: 'contentText.Disabled' },
                }}
              >
                저장
              </MIBaseButton>
            </Stack>
          ) : (
            <Stack
              direction="row"
              alignItems="center"
              gap="4px"
              height={CELL_HEIGHT}
              p="8px"
              border="1px solid"
              borderColor="contentBorder.Normal"
              borderRadius="8px"
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'gray.5', borderColor: 'contentBorder.Hover' } }}
              onClick={handleStartDirectInput}
            >
              <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled', flexShrink: 0 }} />
              <Typography variant="body2M14" color="contentText.Placeholder" lineHeight={1.4} noWrap flex={1}>
                직접 입력
              </Typography>
            </Stack>
          )}
          <Divider />
          <Stack
            direction="row"
            alignItems="center"
            gap="8px"
            minHeight="36px"
            pl="6px"
            pr="12px"
            py="8px"
            borderRadius="10px"
            sx={{
              cursor: canReset ? 'pointer' : 'default',
              '&:hover': canReset ? { bgcolor: 'gray.5', '& .reset-label, & .reset-icon': { color: 'contentText.Error' } } : undefined,
            }}
            onClick={handleReset}
          >
            <ReplayRoundedIcon
              className="reset-icon"
              sx={{ fontSize: 20, color: canReset ? 'contentIcon.Enabled' : 'contentIcon.Disabled', flexShrink: 0 }}
            />
            <Typography
              className="reset-label"
              variant="body2M14"
              color={canReset ? 'contentText.Normal' : 'contentText.Disabled'}
              lineHeight={1.4}
              noWrap
            >
              초기화
            </Typography>
          </Stack>
        </Stack>
      </Popover>
    </>
  )
}

export default ScenarioDesignCriteriaDropdown
