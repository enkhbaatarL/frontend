import { Box } from '@mui/material'
import { t } from 'i18next'
import { useState, useMemo, useCallback, useLayoutEffect, useEffect, UIEvent } from 'react'

import MIAgentConversation from '@/components/common/agent/MIAgentConversation'
import MIAgentGreetingMessage from '@/components/common/agent/MIAgentGreetingMessage'
import MIAgentHeaderBox from '@/components/common/agent/MIAgentHeaderBox'
import MIAgentHistory from '@/components/common/agent/MIAgentHistory'
import MIAgentPromptInputBox from '@/components/common/agent/MIAgentPromptInputBox'
import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIAgentStatus from '@/components/common/agent/MIAgentStatus'
import { useScroll } from '@/contexts/ScrollContext'
import useMIAgent from '@/hooks/useMIAgent'
import useSnackbar from '@/hooks/useSnackbar'
import MIAgentScrollProvider from '@/providers/MIAgentScrollProvider'
import agentService from '@/service/mi/agent'

export interface MIAgentChatWindowProps {
  top: number
  onClose?: () => void
  onChangeExpand?: (expanded: boolean) => void
  windowExpend?: boolean
}

interface ScrollToAnchor {
  id: string | null
  behavior: ScrollBehavior
}

interface SelectModeOption {
  id: string
  title: string
  subtitle: string
  checked: boolean
  disabled: boolean
}

const LOCAL_STORAGE_KEY = 'mi-agent-select-mode-option'

const DEFAULT_SELECT_MODE_OPTIONS: SelectModeOption[] = [
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
    disabled: false,
  },
]

const loadSelectModeOptionsFromStorage = (): SelectModeOption[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      const parsedOptions = JSON.parse(stored) as SelectModeOption[]
      return DEFAULT_SELECT_MODE_OPTIONS.map((defaultOption) => {
        const storedOption = parsedOptions.find((option) => option.id === defaultOption.id)
        return storedOption ? { ...defaultOption, checked: storedOption.checked } : defaultOption
      })
    }
  } catch (error) {
    console.warn('Failed to load select mode options from localStorage:', error)
  }
  return DEFAULT_SELECT_MODE_OPTIONS
}

const saveSelectModeOptionsToStorage = (options: SelectModeOption[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(options))
  } catch (error) {
    console.warn('Failed to save select mode options to localStorage:', error)
  }
}

const MIAgentChatWindowContent = ({ top, onClose, windowExpend = false, onChangeExpand }: MIAgentChatWindowProps) => {
  const { scrollRef, scrollToBottom } = useScroll()
  const MIAgent = useMIAgent()
  const { showSnackbar } = useSnackbar()

  const [initialHistoryLoading, setInitialHistoryLoading] = useState(false)
  const [scrollToAnchor, setScrollToAnchor] = useState<ScrollToAnchor>({
    id: null,
    behavior: 'instant',
  })
  const [animationComplete, setAnimationComplete] = useState<boolean[]>([])
  const [shouldCheckScroll, setShouldCheckScroll] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const [selectModeOption, setSelectModeOption] = useState<SelectModeOption[]>(() => loadSelectModeOptionsFromStorage())

  const updateSelectModeOption = useCallback((newOptions: SelectModeOption[]) => {
    setSelectModeOption(newOptions)
    saveSelectModeOptionsToStorage(newOptions)
  }, [])

  const isGenerating = useMemo(() => animationComplete.length > 0 && !animationComplete[animationComplete.length - 1], [animationComplete])

  const handleScroll = useCallback(
    async (e: UIEvent<HTMLDivElement>) => {
      if (initialHistoryLoading || isGenerating) return
      const { scrollTop } = e.currentTarget

      // 스크롤이 맨 위에 도달했을 때 이전 히스토리를 로드
      if (scrollTop === 0) {
        // 현재 보이는 첫 번째 메시지의 ID를 저장 (추가 로드 후 스크롤 위치 조정 용)
        const qnaNo = MIAgent.conversations[0]?.qnaNo
        setScrollToAnchor({
          id: qnaNo ? `message-${qnaNo}` : null,
          behavior: 'instant',
        })

        await MIAgent.history.fetchPrevHistory()
      }
    },
    [initialHistoryLoading, isGenerating, MIAgent.conversations, MIAgent.history],
  )

  // retry 완료 후 스크롤 체크
  useEffect(() => {
    if (shouldCheckScroll && !isGenerating) {
      const container = scrollRef.current
      if (container && container.scrollTop === 0) {
        handleScroll({ currentTarget: container } as UIEvent<HTMLDivElement>).then()
      }
      setShouldCheckScroll(false)
    }
  }, [shouldCheckScroll, isGenerating, handleScroll])

  const handleAnimationComplete = useCallback(
    (index: number) => {
      setAnimationComplete((prev) => {
        const newState = [...prev]
        newState[index] = true

        const allAnimationsComplete = newState.filter((state) => state !== undefined).every((complete) => complete)

        // 모든 애니메이션이 완료되었다면 마지막 대화의 isNew를 false로 변경
        if (allAnimationsComplete && MIAgent.conversations.length > 0) {
          MIAgent.markLastConversationAsOld()
          requestAnimationFrame(() => {
            setTimeout(scrollToBottom, 100)
          })
          // retry 기능을 사용할 때만 스크롤 체크
          if (isRetrying) {
            setShouldCheckScroll(true)
            setIsRetrying(false)
          }
        }

        return newState
      })
    },
    [MIAgent, scrollToBottom, isRetrying],
  )

  const handleAnimationStarted = useCallback((index: number) => {
    setAnimationComplete((prev) => {
      const newState = [...prev]
      newState[index] = false
      return newState
    })
  }, [])

  const handleSendMessage = async (message: string) => {
    if (!message) return

    const webSearchOption = selectModeOption.find((option) => option.id === '2')
    const shouldWebSearch = webSearchOption?.checked ?? false

    requestAnimationFrame(async () => {
      scrollToBottom()
      handleAnimationStarted(MIAgent.conversations.length)
      setTimeout(() => {
        MIAgent.inquire(message, shouldWebSearch)
      }, 100)
    })
  }

  const handleRetry = async (qnaNo: number) => {
    requestAnimationFrame(async () => {
      scrollToBottom()
      const index = MIAgent.conversations.findIndex((conv) => conv.qnaNo === qnaNo)
      if (index !== -1) {
        setIsRetrying(true)
        handleAnimationStarted(index)
      }
      setTimeout(() => {
        MIAgent.retry(qnaNo)
      }, 100)
    })
  }

  const hasConversations = useMemo(
    () => MIAgent.conversations.length > 0 && MIAgent.conversations[0]?.qnaNo !== null,
    [MIAgent.conversations],
  )

  const toggleExpand = () => {
    onChangeExpand?.(!windowExpend)
  }

  // 이전 대화 로드 시 화면 위치 유지
  useLayoutEffect(() => {
    if (!scrollToAnchor.id) return

    const observer = new MutationObserver(() => {
      const updatedAnchor = document.getElementById(scrollToAnchor.id ?? '')
      if (!updatedAnchor) return

      const container = scrollRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const anchorRect = updatedAnchor.getBoundingClientRect()
      const currentScrollTop = container.scrollTop

      const relativeTop = anchorRect.top - containerRect.top
      const newScrollTop = currentScrollTop + relativeTop

      // 현재 스크롤 위치가 목표 위치보다 아래에 있으면 부드럽게 처리
      const isScrollingDown = currentScrollTop > newScrollTop

      requestAnimationFrame(() => {
        container.scrollTo({
          top: newScrollTop - 12, // 12px 여백 추가(marginY)
          behavior: isScrollingDown ? 'smooth' : 'instant',
        })

        setScrollToAnchor({
          id: null,
          behavior: 'instant',
        })
      })

      observer.disconnect()
    })

    if (scrollRef.current) {
      observer.observe(scrollRef.current, {
        childList: true,
        subtree: true,
      })
    }
  }, [scrollRef, scrollToAnchor, MIAgent.history.isLoading])

  // 최초 히스토리 로드 처리
  useLayoutEffect(() => {
    if (!hasConversations) return () => {}

    const timeoutId = setTimeout(() => {
      if (!scrollRef.current) return

      // 새로운 챗이 아닌 길이변화가 생긴경우 히스토리 로드 간주
      if (!MIAgent.conversations.at(-1)?.isNew) {
        // 최초 히스토리 로드 시
        if (initialHistoryLoading) {
          // 스크롤이 발생할 때까지 추가 로드
          const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
              if (!scrollRef.current) return

              const { scrollHeight, clientHeight } = scrollRef.current
              const hasScrollbar = scrollHeight > clientHeight

              if (hasScrollbar) {
                resizeObserver.disconnect()
                setInitialHistoryLoading(false)
                requestAnimationFrame(() => {
                  scrollToBottom()
                })
              } else if (!MIAgent.history.isLast && !MIAgent.history.isLoading) {
                MIAgent.history.fetchPrevHistory().then()
              }
            })
          })

          resizeObserver.observe(scrollRef.current)
        }
      }
    }, 0)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [MIAgent.conversations, MIAgent.history, hasConversations, initialHistoryLoading, scrollRef, scrollToBottom])

  /*
    [2025-07-07 kmjung] 변경 내역
    - before: minWidth: '640px', minHeight: '544px'
    - after:  minWidth: '840px', minHeight: '694px'
  */
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          width: windowExpend ? '1380px' : '840px',
          height: windowExpend || hasConversations ? `calc(100vh - ${top + 96}px)` : '694px',
          transition: 'width 0.4s cubic-bezier(0.33, 1, 0.68, 1), height 0.54s cubic-bezier(0.33, 1, 0.68, 1)',
          minWidth: '840px',
          maxWidth: `calc(100vw - ${62}px)`,
          minHeight: '694px',
          maxHeight: '2048px',
          position: 'relative',
          borderRadius: '12px',
          border: '1px solid  #DEE2E6',
          background: '#F9F8F6',
          boxShadow: '2px 4px 20px 0px rgba(65, 76, 147, 0.10)',
          overflow: 'hidden',
        }}
      >
        {/* History area */}
        <MIAgentHistory
          loading={MIAgent.chatRoom.isLoading}
          chatRooms={MIAgent.chatRoom.list}
          onSelectChat={(chatId: string) => {
            setInitialHistoryLoading(true)
            MIAgent.setSelectedChatRoomId(chatId)
          }}
          windowExpend={windowExpend}
          onEditTitle={async (chatId: string, newTitle: string) => {
            try {
              await agentService.updateChatRoom(chatId, newTitle)
              await MIAgent.chatRoom.refetch()
            } catch {
              showSnackbar(t('채팅방 이름 변경에 실패했습니다.'), { variant: 'error' })
            }
          }}
          onDelete={async (chatId: string) => {
            try {
              await agentService.deleteChatRoom(chatId)
              await MIAgent.chatRoom.refetch()
              showSnackbar(t('삭제되었습니다.'), { variant: 'success' })
              if (MIAgent.selectedChatRoom?.chatRoomId === chatId) {
                MIAgent.setSelectedChatRoomId(null, true)
                setInitialHistoryLoading(false)
              }
            } catch {
              showSnackbar(t('채팅방 삭제에 실패했습니다.'), { variant: 'error' })
            }
          }}
          disabled={isGenerating}
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
              newChat={() => {
                MIAgent.setSelectedChatRoomId(null, true)
                setInitialHistoryLoading(false)
              }}
              isGenerating={isGenerating}
            />
          </Box>
          {/* Response area */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {MIAgent.history.isLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                  }}
                >
                  <MIAgentSpinner />
                </Box>
              )}
              {MIAgent.conversations.length > 0 ? (
                <MIAgentConversation
                  conversations={MIAgent.conversations}
                  chatRoom={MIAgent.selectedChatRoom}
                  onRetry={handleRetry}
                  animationComplete={animationComplete}
                  onAnimationComplete={handleAnimationComplete}
                  loading={MIAgent.history.isLoading || undefined}
                  onScroll={handleScroll}
                />
              ) : (
                <>
                  {initialHistoryLoading ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                      }}
                    >
                      <MIAgentSpinner />
                    </Box>
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
                </>
              )}
            </Box>
            {MIAgent.state !== 'default' && (
              <Box sx={{ flexShrink: 0 }} px={'8px'}>
                <MIAgentStatus status={MIAgent.state} />
              </Box>
            )}
          </Box>
          {/* Footer area */}
          <Box
            sx={{
              padding: '12px',
              flexShrink: 0,
            }}
          >
            <MIAgentPromptInputBox
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              selectModeOption={selectModeOption}
              onSelectModeOptionChange={updateSelectModeOption}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

const MIAgentChatWindow = (props: MIAgentChatWindowProps) => (
  <MIAgentScrollProvider>
    <MIAgentChatWindowContent {...props} />
  </MIAgentScrollProvider>
)

export default MIAgentChatWindow
