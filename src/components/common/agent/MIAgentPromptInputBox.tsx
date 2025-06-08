import { Box, Input } from '@mui/material'
import { ChangeEvent, useRef, useState, KeyboardEvent, useMemo } from 'react'

import MIAgentInputBoxDropdown from '@/components/common/agent/MIAgentInputBoxDropdown'
import MIAgentPromptButton from '@/components/common/agent/MIAgentPromptButton'

interface Props {
  onSendMessage: (message: string) => void
  placeholder?: string
  isGenerating?: boolean
}

const MIAgentPromptInputBox = ({ onSendMessage, placeholder = '무엇이 궁금하세요?', isGenerating = false }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectModeOption] = useState([
    {
      id: '1',
      title: 'MI Dataset',
      subtitle: '메타모델 및 구독데이터 검색',
      checked: false,
      disabled: true,
    },
    {
      id: '2',
      title: 'Web Search',
      subtitle: '실시간 웹 검색',
      checked: true,
      disabled: true,
    },
  ])

  const [promptText, setPromptText] = useState('')

  const handleSendMessage = () => {
    onSendMessage(promptText)
    setPromptText('')
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      if (promptText.trim()) {
        handleSendMessage()
      }
    }
  }

  const isFocused = useMemo(() => promptText !== '' || isDropdownOpen || isInputFocused, [promptText, isDropdownOpen, isInputFocused])

  const inputStatus = useMemo(() => {
    if (isGenerating) {
      return 'loading-disabled'
    }

    if (promptText === '') {
      return 'send-disabled'
    }

    return 'send-activated'
  }, [promptText, isGenerating])

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderRadius: '12px',
        border: '2px solid',
        borderColor: isFocused ? '#748FFC' : '#E0E0E0',
        outline: 'none',
        boxShadow: isFocused ? '2px 4px 20px 0px rgba(39, 106, 207, 0.25)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        backgroundColor: '#fff',
        '&:hover': {
          borderColor: '#748FFC',
          outline: 'none',
          boxShadow: isGenerating ? 'none' : '2px 4px 20px 0px rgba(39, 106, 207, 0.25)',
        },
        boxSizing: 'border-box',
        cursor: 'text',
        pointerEvents: isGenerating ? 'none' : 'initial',
        userSelect: 'none',
      }}
      onClick={() => {
        inputRef.current?.focus()
      }}
    >
      <Box padding="20px" width={'100%'} boxSizing={'border-box'} height={'62px'}>
        <Input
          inputRef={inputRef}
          placeholder={isGenerating ? '답변을 생성중입니다' : placeholder}
          value={promptText}
          sx={{
            width: '100%',
            '& .MuiInputBase-input': {
              fontSize: '16px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '1.4',
              color: isGenerating ? 'contentText.Placeholder' : '#333333',
              '& .Mui-disabled': {
                webkitTextFillColor: 'contentText.Placeholder',
              },
            },
          }}
          disableUnderline
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setPromptText(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          disabled={isGenerating}
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
        <Box onClick={(e) => e.stopPropagation()}>
          <MIAgentInputBoxDropdown
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            settingsItems={selectModeOption}
            selectedItem={null}
            onChangeSelectedItem={() => {}}
            modePosition={'top'}
            disabled={isGenerating}
          />
        </Box>
        <MIAgentPromptButton onSendMessage={handleSendMessage} inputStatus={inputStatus} disabled={isGenerating} />
      </Box>
    </Box>
  )
}

export default MIAgentPromptInputBox
