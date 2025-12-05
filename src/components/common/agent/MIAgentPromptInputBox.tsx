import { Box, Stack, TextareaAutosize, Typography } from '@mui/material'
import { ChangeEvent, useRef, useState, KeyboardEvent, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import MIAgentInputBoxDropdown from '@/components/common/agent/MIAgentInputBoxDropdown'
import MIAgentPromptButton from '@/components/common/agent/MIAgentPromptButton'
import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import GradientOverlayScroll from '@/components/common/gradient/GradientOverlayScroll'

interface Props {
  onSendMessage: (message: string) => void
  onStop?: (message: string) => void
  placeholder?: string
  isPendingQuestion?: boolean
  isGenerating?: boolean
  isSending?: boolean
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
  onStop,
  placeholder,
  isPendingQuestion,
  isGenerating,
  isSending,
  selectModeOption,
  onSelectModeOptionChange,
}: Props) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [promptText, setPromptText] = useState('')
  const { t } = useTranslation()

  const handleToggleOption = (toggledItem: { id: string }) => {
    const newOptions = selectModeOption.map((item) => (item.id === toggledItem.id ? { ...item, checked: !item.checked } : item))
    onSelectModeOptionChange(newOptions)
  }

  const handleSendMessage = () => {
    inputRef.current?.blur()
    setIsInputFocused(false)
    onSendMessage(promptText)
    setPromptText('')
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
    // isPendingQuestion이 true이면 즉시 stop-disabled 반환 (낙관적 업데이트 중)
    if (isPendingQuestion) {
      return 'stop-disabled'
    }

    // 낙관적 업데이트가 완료되기 전 상태
    if (isSending && !isPendingQuestion) {
      return 'stop-disabled'
    }

    // isGenerating이 true인 경우 stop-activated
    if (isGenerating) {
      return 'stop-activated'
    }

    if (promptText === '' || promptText.trim() === '') {
      return 'send-disabled'
    }

    return 'send-activated'
  }, [promptText, isGenerating, isPendingQuestion, isSending])

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        maxWidth: '660px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderRadius: '12px',
        border: '2px solid',
        borderColor: isFocused ? '#748FFC' : '#E0E0E0',
        outline: 'none',
        boxShadow: isFocused ? '2px 4px 20px 0px rgba(39, 106, 207, 0.25)' : 'none',
        transition: (theme) =>
          theme.transitions.create(['border-color', 'box-shadow', 'width', 'max-width'], {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
          }),
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
        willChange: 'width, max-width',
      }}
      onClick={() => {
        inputRef.current?.focus()
      }}
    >
      <Box
        padding="20px 20px 0"
        width={'100%'}
        boxSizing={'border-box'}
        minHeight={'62px'}
        position="relative"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          transition: (theme) =>
            theme.transitions.create('height', {
              duration: theme.transitions.duration.shorter,
              easing: theme.transitions.easing.easeInOut,
            }),
        }}
      >
        <Box
          sx={{
            flex: '1 1 auto',
            minHeight: 0,
            position: 'relative',
          }}
        >
          <GradientOverlayScroll
            top={{ display: true, height: 18, color: '#ffffff', offset: 0 }}
            bottom={{ display: true, height: 18, color: '#ffffff', offset: 6 }}
            height="auto"
          >
            <TextareaAutosize
              ref={inputRef}
              id="prompt-textarea"
              placeholder={isGenerating ? '' : (placeholder ?? t('mari.promptMessage.placeholder'))}
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
                color: '#333333',
                border: 'none',
                resize: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                overflowY: 'auto',
                transition: 'height 0.1s ease-in-out',
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
            {isGenerating && (
              <Stack direction="row" position="absolute" top="0" left="0" padding="2px" gap="6px">
                <MIAgentSpinner size={22} />
                <Typography variant="body1R16" color="contentText.Placeholder">
                  {t('mari.promptMessage.generating')}
                </Typography>
              </Stack>
            )}
          </GradientOverlayScroll>
        </Box>
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
            disabled={isGenerating}
          />
        </Box>
        <MIAgentPromptButton onSendMessage={handleSendMessage} onStop={onStop} inputStatus={inputStatus} />
      </Box>
    </Box>
  )
}

export default MIAgentPromptInputBox
