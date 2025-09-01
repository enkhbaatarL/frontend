import { Box, TextareaAutosize } from '@mui/material'
import { ChangeEvent, useRef, useState, KeyboardEvent, useMemo } from 'react'

import MIAgentInputBoxDropdown from '@/components/common/agent/MIAgentInputBoxDropdown'
import MIAgentPromptButton from '@/components/common/agent/MIAgentPromptButton'
import GradientOverlayScroll from '@/components/common/gradient/GradientOverlayScroll'

interface Props {
  onSendMessage: (message: string) => void
  placeholder?: string
  isGenerating?: boolean
  selectModeOption: Array<{
    id: string
    title: string
    subtitle: string
    checked: boolean
    disabled: boolean
  }>
  onSelectModeOptionChange: (
    options: Array<{
      id: string
      title: string
      subtitle: string
      checked: boolean
      disabled: boolean
    }>,
  ) => void
}

const MIAgentPromptInputBox = ({
  onSendMessage,
  placeholder = '무엇을 찾으시나요?',
  isGenerating,
  selectModeOption,
  onSelectModeOptionChange,
}: Props) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [promptText, setPromptText] = useState('')

  const handleToggleOption = (toggledItem: { id: string }) => {
    const newOptions = selectModeOption.map((item) => (item.id === toggledItem.id ? { ...item, checked: !item.checked } : item))
    onSelectModeOptionChange(newOptions)
  }

  const handleSendMessage = () => {
    onSendMessage(promptText)
    setPromptText('')
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
      <Box padding="20px 20px 0" width={'100%'} boxSizing={'border-box'} minHeight={'62px'} position="relative">
        <GradientOverlayScroll
          top={{ display: true, height: 18, color: '#ffffff', offset: 0 }}
          bottom={{ display: true, height: 18, color: '#ffffff', offset: 6 }}
        >
          <TextareaAutosize
            ref={inputRef}
            placeholder={isGenerating ? '답변을 생성중입니다' : placeholder}
            value={promptText}
            maxLength={2000}
            className={'MIScrollbar'}
            style={{
              width: '100%',
              fontFamily: 'Pretendard',
              fontSize: '16px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '1.4',
              color: isGenerating ? '#CED4DA' : '#333333',
              border: 'none',
              resize: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              overflowY: 'auto',
            }}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              setPromptText(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            disabled={isGenerating}
            minRows={1}
            maxRows={6}
          />
        </GradientOverlayScroll>
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
            onChangeSelectedItem={handleToggleOption}
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
