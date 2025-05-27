import { Box, Input } from '@mui/material'
import { ChangeEvent, useEffect, useRef, useState } from 'react'

import MIAgentInputBoxDropdown from './MIAgentInputBoxDropdown'
import MIAgentPromptButton from './MIAgentPromptButton'
import { MIAgentStatusType } from './MIAgentStatus'
import { MIAgentToggleSettingOption } from './MIAgentToggleSetting'

export type MIAgentPromptState =
  | 'send-activated'
  | 'send-disabled'
  | 'stop-activated'
  | 'stop-disabled'
  | 'loading-disabled'
  | 'unable-disabled'

export interface MIAgentPromptInputBoxProps {
  inputStatus: MIAgentPromptState
  agentStatus: MIAgentStatusType
  onChangeState?: (state: MIAgentPromptState) => void
  onChangeInput?: (inputValue: string) => void
  onKeyPress?: (e: React.KeyboardEvent) => void
  onSendMessage: () => void
  width?: string | number
  placeholder?: string
  inputValue: string
  maxLength: number
  disabled: boolean
  modePosition?: 'top' | 'bottom'
}

const MIAgentPromptInputBox = ({
  inputStatus = 'send-disabled',
  agentStatus,
  onChangeState,
  onChangeInput,
  onKeyPress,
  placeholder = '무엇이 궁금하세요?',
  inputValue,
  maxLength,
  disabled,
  onSendMessage,
  modePosition = 'bottom',
}: MIAgentPromptInputBoxProps) => {
  const [promptText, setPromptText] = useState<string>(inputValue)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isFocused = promptText !== '' || isDropdownOpen
  const isPrompting = disabled || (inputStatus !== 'send-activated' && inputStatus !== 'send-disabled' && agentStatus !== 'complete')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedMode, setselectedMode] = useState<MIAgentToggleSettingOption>({
    id: '1',
    title: 'MI Dataset',
    subtitle: '메타모델 및 구데이터이 검색',
    checked: false,
  })

  const [selectModeOption, setselectModeOption] = useState([
    {
      id: '1',
      title: 'MI Dataset',
      subtitle: '메타모델 및 구데이터이 검색',
      checked: false,
    },
    { id: '2', title: 'Web Search', subtitle: '실시간 웹 검색', checked: true },
  ])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (maxLength && typeof promptText === 'string' && e.target.value.length > maxLength) return
    setPromptText(e.target.value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce onChange
    debounceRef.current = setTimeout(() => {
      const inputText = e.target.value

      onChangeInput?.(inputText)

      // Enable send button if text is entered
      if (inputText && inputStatus === 'send-disabled') {
        onChangeState?.('send-activated')
      }
    }, 300)
  }

  useEffect(() => {
    if (!inputValue) {
      setPromptText('')
    }

    return () => {}
  }, [inputValue])

  const handleChangeSelectedItem = (item: MIAgentToggleSettingOption) => {
    setselectedMode?.({ ...item })
    setselectModeOption?.((prev) => [...prev.map((it) => (it.id === item.id ? { ...it, checked: !it.checked } : it))])
  }

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderRadius: '12px',
        // Always use 2px border, but make it transparent when not focused/hovered
        border: '2px solid',
        // Use transparent border when not focused to avoid size jumping
        borderColor: isFocused ? '#748FFC' : 'transparent',
        // Add a 1px inner border when not focused
        outline: isFocused ? 'none' : '1px solid #E0E0E0',
        boxShadow: isFocused ? '2px 4px 20px 0px rgba(39, 106, 207, 0.25)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s, outline 0.2s',
        backgroundColor: '#fff',
        '&:hover': {
          borderColor: '#748FFC',
          outline: 'none',
          boxShadow: isPrompting ? 'none' : '2px 4px 20px 0px rgba(39, 106, 207, 0.25)',
        },
        boxSizing: 'border-box',
        pointerEvents: isPrompting ? 'none' : 'initial',
      }}
    >
      <Box padding="20px" width={'100%'} boxSizing={'border-box'} height={'62px'}>
        <Input
          placeholder={
            inputStatus !== 'send-activated' && inputStatus !== 'send-disabled' && agentStatus !== 'complete'
              ? '답변을 생성중입니다'
              : placeholder
          }
          value={promptText}
          sx={{
            width: '100%',
            '& .MuiInputBase-input': {
              fontSize: '16px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '1.4',
              color: isPrompting ? 'contentText.Placeholder' : '#333333',
              '& .Mui-disabled': {
                webkitTextFillColor: 'contentText.Placeholder',
              },
            },
          }}
          disableUnderline
          onChange={handleInputChange}
          onKeyDown={onKeyPress ? onKeyPress : () => {}}
          disabled={disabled || (inputStatus !== 'send-activated' && inputStatus !== 'send-disabled' && agentStatus !== 'complete')}
        />
      </Box>
      <Box
        paddingX="20px"
        paddingY="12px"
        sx={{
          borderRadius: '0px 0px 12px 12px',
          boxSizing: 'border-box',
        }}
        display={'flex'}
        justifyContent={'space-between'}
        alignItems={'center'}
        width={'100%'}
        height={'58px'}
      >
        <MIAgentInputBoxDropdown
          isOpen={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
          settingsItems={selectModeOption}
          selectedItem={selectedMode}
          onChangeSelectedItem={handleChangeSelectedItem}
          disabled={disabled || (inputStatus !== 'send-activated' && inputStatus !== 'send-disabled' && agentStatus !== 'complete')}
          modePosition={modePosition}
        />
        <MIAgentPromptButton inputStatus={inputStatus} disabled={disabled} onSendMessage={onSendMessage} />
      </Box>
    </Box>
  )
}

export default MIAgentPromptInputBox
