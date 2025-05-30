import ErrorIcon from '@mui/icons-material/Error'
import { Box } from '@mui/material'
import { useState, useRef, useEffect, useMemo } from 'react'

import MIAgentGreetingMessage from './MIAgentGreetingMessage'
import MIAgentHeaderBox from './MIAgentHeaderBox'
import MIAgentHistory, { ChatItem } from './MIAgentHistory'
import MIAgentPromptInputBox, { MIAgentPromptState } from './MIAgentPromptInputBox'
import MIAgentStatus, { MIAgentStatusType } from './MIAgentStatus'

import MIAgentConversation from '@/components/common/agent/MIAgentConversation'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import useSnackbar from '@/hooks/useSnackbar'

export interface ChatMessage {
  id: string
  text: string
  user: string
  answer: string
  timestamp: Date
}

export interface MIAgentChatWindowProps {
  top: number
  onClose?: () => void
  onChangeExpand?: (expanded: boolean) => void
  windowExpend?: boolean
  disabled?: boolean
  defaultSidebarExpanded?: boolean
  defaultInputStatus?: MIAgentPromptState
  defaultAgentStatus?: MIAgentStatusType
}

const MIAgentChatWindow = ({
  top,
  onClose,
  windowExpend = false,
  onChangeExpand,
  defaultSidebarExpanded = true,
  defaultInputStatus = 'send-disabled',
  defaultAgentStatus = 'planning',
  disabled = false,
}: MIAgentChatWindowProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [inputStatus, setInputStatus] = useState<MIAgentPromptState>(defaultInputStatus)
  const [agentStatus, setAgentStatus] = useState<MIAgentStatusType>(defaultAgentStatus)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(defaultSidebarExpanded)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [getAnswer, setGetAnswer] = useState(false)
  const [modePosition, setModePosition] = useState<'top' | 'bottom'>('bottom')
  const [deletingChatItem, setDeletingChatItem] = useState<ChatItem | null>()
  const [chatList, setChatList] = useState([
    {
      id: '0',
      title: 'New Chat',
      timestamp: '...',
    },
    {
      id: '1',
      title: '자연어 처리하기',
      timestamp: '...',
    },
    {
      id: '2',
      title: '이미지 생성하기',
      timestamp: '...',
    },
    {
      id: '3',
      title: '코드 분석하기',
      timestamp: '...',
    },
    {
      id: '4',
      title: '코드 분석하기',
      timestamp: '...',
    },
  ])

  const [isOpenDelete, setIsOpenDelete] = useState(false)
  const { showSnackbar } = useSnackbar()

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (sentSuccess || getAnswer) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, sentSuccess, getAnswer])

  // Update mode position based on content height
  useEffect(() => {
    const updateModePosition = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current
        const hasOverflow = scrollHeight > clientHeight

        if (windowExpend || (hasOverflow && modePosition !== 'top')) {
          setModePosition('top')
        } else if (!windowExpend && !hasOverflow && modePosition !== 'bottom') {
          setModePosition('bottom')
        }
      }
    }

    // Delay to ensure DOM is updated
    const timeoutId = setTimeout(updateModePosition, 100)
    return () => clearTimeout(timeoutId)
  }, [messages, windowExpend, modePosition])

  // call AI api here
  const handleSendMessage = (message?: string) => {
    if (message || inputValue.trim()) {
      setSentSuccess(true)
      setInputValue('')
      setInputStatus('loading-disabled')
      setAgentStatus('planning')
      const newChat: ChatMessage = {
        id: `${messages.length + 1}`,
        text: message ?? inputValue.trim(),
        timestamp: new Date(),
        answer: '',
        user: 'testUser',
      }

      setMessages((prev) => [...prev, newChat])

      setTimeout(() => {
        // setInputStatus('stop-activated')
        setAgentStatus('searching')
        setTimeout(() => {
          setAgentStatus('generating')
          setTimeout(() => {
            setAgentStatus('complete')
            // setInputStatus('stop-disabled')
            setTimeout(() => {
              setMessages((prev) => [
                ...prev.map((msg) =>
                  msg.id === newChat.id
                    ? {
                      ...msg,
                      answer: 'temp answer',
                    }
                    : msg,
                ),
              ])
              setInputStatus('send-disabled')
              setGetAnswer(true)
              setSentSuccess(false)
            }, 2000)
          }, 2000)
        }, 2000)
      }, 2000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleChangeInput = (textInput: string) => {
    if (sentSuccess) {
      setSentSuccess(false)
    }
    if (getAnswer) {
      setGetAnswer(false)
    }
    if (textInput !== inputValue) {
      setInputValue(textInput)
    }

    if (textInput) {
      setInputStatus('send-activated')
    } else {
      setInputStatus('send-disabled')
    }
  }

  const toggleExpand = () => {
    onChangeExpand?.(!windowExpend)
  }

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded)
  }

  const handleEditChatTitle = (chatId: string, newTitle: string) => {
    setChatList((prev) => [...prev.map((item) => (item.id === chatId ? { ...item, title: newTitle } : item))])
  }

  const handleScrollBottom = () => {
    setSentSuccess(true)
    setTimeout(() => {
      setSentSuccess(false)
    }, 100)
  }

  const handleOpenDeleteModal = (item: ChatItem) => {
    setIsOpenDelete(true)
    setDeletingChatItem(item)
  }

  const isMessagesEmpty = useMemo(() => messages?.length === 0, [messages])

  return (
    <Box sx={{ userSelect: 'none' }}>
      <Box
        sx={{
          display: 'flex',
          width: windowExpend ? '1380px' : '640px',
          height: windowExpend || !isMessagesEmpty ? `calc(100vh - ${top + 96}px)` : '480px',
          transition: 'width 0.4s cubic-bezier(0.33, 1, 0.68, 1), height 0.54s cubic-bezier(0.33, 1, 0.68, 1)',
          minWidth: '640px',
          maxWidth: '1380px',
          minHeight: '480px',
          maxHeight: '2048px',
          position: 'relative',
          borderRadius: '12px',
          border: '1px solid  #DEE2E6',
          background: '#F9F8F6',
          /* Shadow/Mari/Mari shadow */
          boxShadow: '2px 4px 20px 0px rgba(65, 76, 147, 0.10)',
          overflow: 'hidden',
        }}
      >
        {/* History area */}
        <MIAgentHistory
          windowExpend={windowExpend}
          chatItems={chatList}
          isExpanded={isSidebarExpanded}
          onExpand={toggleSidebar}
          onEditChatTitle={handleEditChatTitle}
          onOpenDelete={handleOpenDeleteModal}
        />
        {/* Content area */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F9F8F6',
            width: '100%',
            borderRadius: '12px',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Header area */}
          <Box sx={{ flexShrink: 0 }}>
            <MIAgentHeaderBox
              onExpand={toggleExpand}
              minimized={windowExpend}
              onClose={() => {
                onClose?.()
                onChangeExpand?.(false)
              }}
            />
          </Box>
          {/* Response area */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0, // This is important for flex items to shrink
              overflow: 'hidden',
            }}
          >
            <Box
              ref={scrollContainerRef}
              sx={{
                flex: 1,
                overflowY: isMessagesEmpty ? 'hidden' : 'auto',
                overflowX: 'hidden',
                padding: '12px',
                minHeight: 0, // This is important for flex items to shrink
                position: 'relative',
                // Custom scrollbar styling
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#CED4DA',
                  borderRadius: '3px',
                  '&:hover': {
                    background: '#ADB5BD',
                  },
                },
                // For Firefox
                scrollbarWidth: 'thin',
                scrollbarColor: '#CED4DA transparent',
              }}
            >
              {!isMessagesEmpty ? (
                <>
                  <MIAgentConversation messages={messages} scrollToBottom={handleScrollBottom} handleSendMessage={handleSendMessage} />
                  {/* Invisible element for scrolling to bottom */}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <Box
                  position={'absolute'}
                  width={'100%'}
                  overflow={'hidden'}
                  sx={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    paddingBottom: windowExpend ? '80px' : '0px',
                    transition: 'padding-bottom 0.4s cubic-bezier(0.33, 1, 0.68, 1)',
                  }}
                >
                  <MIAgentGreetingMessage handleSendMessage={handleSendMessage} />
                </Box>
              )}
            </Box>
            {inputStatus !== 'send-activated' && inputStatus !== 'send-disabled' && (
              <Box sx={{ flexShrink: 0 }}>
                <MIAgentStatus status={agentStatus} />
              </Box>
            )}
          </Box>
          {/* Footer area */}
          <Box
            sx={{
              padding: '12px',
              height: '120px',
              flexShrink: 0, // Prevent footer from shrinking
            }}
          >
            <MIAgentPromptInputBox
              inputStatus={inputStatus}
              agentStatus={agentStatus}
              inputValue={inputValue}
              onKeyPress={handleKeyPress}
              onChangeInput={handleChangeInput}
              maxLength={3000}
              disabled={disabled}
              onSendMessage={handleSendMessage}
              modePosition={modePosition}
            />
          </Box>
        </Box>
      </Box>
      <MIConfirm
        open={isOpenDelete}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            채팅을 삭제하시겠습니까?
          </>
        }
        width={450}
        zIndex={1600}
        handleClose={() => {
          setIsOpenDelete(false)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsOpenDelete(false)
              setDeletingChatItem(null)
            },
          },
          {
            label: '삭제',
            variant: 'filled',
            color: '#F03E3E',
            hoverBgColor: '#BD3D37',
            onClick: () => {
              setIsOpenDelete(false)
              setChatList((prev) => [...prev.filter((it) => it.id !== deletingChatItem?.id)])
              showSnackbar('삭제되었습니다. ', { variant: 'success' })
            },
          },
        ]}
      >
        삭제된 내용은 되돌릴 수 없습니다.
      </MIConfirm>
    </Box>
  )
}

export default MIAgentChatWindow
