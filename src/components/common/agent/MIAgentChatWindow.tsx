import { Box, Stack, Typography, Collapse, Fade, Portal } from '@mui/material'
import { keyframes } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useCallback, useLayoutEffect, useEffect, UIEvent } from 'react'
import { useTranslation } from 'react-i18next'

import MIAgentConversation from '@/components/common/agent/MIAgentConversation'
import MIAgentHeaderBox from '@/components/common/agent/MIAgentHeaderBox'
import MIAgentHistory from '@/components/common/agent/MIAgentHistory'
import MIAgentPromptInputBox from '@/components/common/agent/MIAgentPromptInputBox'
import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import { useScroll } from '@/contexts/ScrollContext'
import useMIAgent, { MIAgentState } from '@/hooks/useMIAgent'
import useSnackbar from '@/hooks/useSnackbar'
import MIAgentScrollProvider from '@/providers/MIAgentScrollProvider'
import agentService from '@/service/mi/agent'
import useAuthStore from '@/store/useAuthStore'

export interface MIAgentChatWindowProps {
  top: number
  onClose?: () => void
  onChangeExpand?: (expanded: boolean) => void
  windowExpend?: boolean
  offsetLeft?: number
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
    subtitle: 'mari.source.miDatasetSubtitle',
    checked: false,
    disabled: true,
  },
  {
    id: '2',
    title: 'Web Search',
    subtitle: 'mari.source.webSearchSubtitle',
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

const gradientTextAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

const MIAgentChatWindowContent = ({ top, onClose, windowExpend = false, onChangeExpand, offsetLeft = 0 }: MIAgentChatWindowProps) => {
  const { scrollRef, scrollToBottom } = useScroll()
  const MIAgent = useMIAgent()
  const { showSnackbar } = useSnackbar()
  const { t } = useTranslation()
  const [initialHistoryLoading, setInitialHistoryLoading] = useState(false)
  const [scrollToAnchor, setScrollToAnchor] = useState<ScrollToAnchor>({
    id: null,
    behavior: 'instant',
  })
  const [animationComplete, setAnimationComplete] = useState<boolean[]>([])
  const [shouldCheckScroll, setShouldCheckScroll] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const { accessCompanyInfo } = useAuthStore.getState()

  const [selectModeOption, setSelectModeOption] = useState<SelectModeOption[]>(() => {
    const options = loadSelectModeOptionsFromStorage()
    return options.map((option) => ({
      ...option,
      subtitle: t(option.subtitle),
    }))
  })

  const updateSelectModeOption = useCallback(
    (newOptions: SelectModeOption[]) => {
      const translatedOptions = newOptions.map((option) => ({
        ...option,
        subtitle: t(option.subtitle),
      }))
      setSelectModeOption(translatedOptions)
      saveSelectModeOptionsToStorage(newOptions)
    },
    [t],
  )

  const { data: majorQuestions, isLoading } = useQuery({
    queryKey: ['majorQuestion', accessCompanyInfo?.customerCompanyNo],
    queryFn: () => agentService.getMajorQuestions(),
    gcTime: 1000 * 60 * 5,
  })

  const isGenerating = useMemo(() => MIAgent.state === MIAgentState.STREAMING, [MIAgent.state])

  const fetchPreviousHistory = useCallback(async () => {
    if (MIAgent.history.isLast) return false

    // 현재 보이는 첫 번째 메시지의 ID를 저장 (추가 로드 후 스크롤 위치 조정 용)
    const qnaNo = MIAgent.conversations[0]?.qnaNo
    setScrollToAnchor({
      id: qnaNo ? `message-${qnaNo}` : null,
      behavior: 'instant',
    })

    try {
      await MIAgent.history.fetchPrevHistory()
      return true
    } catch (error) {
      console.error('Failed to fetch previous history:', error)
      return false
    }
  }, [MIAgent.conversations, MIAgent.history])

  const handleScroll = useCallback(
    async (e: UIEvent<HTMLDivElement>) => {
      if (initialHistoryLoading || isGenerating) return

      const { scrollTop } = e.currentTarget

      if (scrollTop === 0) {
        await fetchPreviousHistory()
      }
    },
    [initialHistoryLoading, isGenerating, fetchPreviousHistory],
  )
  useEffect(() => {
    if (initialHistoryLoading) return

    const allAnimationsComplete = animationComplete.length > 0 && animationComplete.every((v) => v)
    const isActuallyComplete = MIAgent.state === MIAgentState.COMPLETE

    if (allAnimationsComplete && isActuallyComplete) {
      requestAnimationFrame(() => setTimeout(scrollToBottom, 100))

      if (isRetrying) {
        setShouldCheckScroll(true)
        setIsRetrying(false)
      }
    }
  }, [MIAgent.state, animationComplete, scrollToBottom, isRetrying, initialHistoryLoading])
  // retry 완료 후 스크롤 체크
  useEffect(() => {
    if (shouldCheckScroll && !isGenerating) {
      const container = scrollRef.current
      if (container && container.scrollTop === 0) {
        handleScroll({ currentTarget: container } as UIEvent<HTMLDivElement>).then()
      }
      setShouldCheckScroll(false)
    }
  }, [shouldCheckScroll, isGenerating, handleScroll, scrollRef])

  const handleAnimationComplete = useCallback((index: number) => {
    setAnimationComplete((prev) => {
      const newState = [...prev]
      newState[index] = true

      return newState
    })
  }, [])

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

    requestAnimationFrame(() => {
      handleAnimationStarted(MIAgent.conversations.length)
      setTimeout(() => {
        MIAgent.inquire(message, shouldWebSearch)
      }, 100)
    })
  }

  // 새로운 질문이 추가되면 즉시 스크롤을 위한 낙관적 업데이트
  useEffect(() => {
    if (initialHistoryLoading) return

    const lastConversation = MIAgent.conversations.at(-1)
    if (lastConversation?.qnaNo === null && lastConversation?.question) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom('smooth')
        })
      })
    }
  }, [MIAgent.conversations, scrollToBottom, initialHistoryLoading])

  const handleRetry = async (qnaNo: number) => {
    requestAnimationFrame(async () => {
      scrollToBottom()
      const index = MIAgent.conversations.findIndex((conv) => conv.qnaNo === qnaNo)
      if (index !== -1) {
        setIsRetrying(true)
        handleAnimationStarted(index)
      }
      setTimeout(() => {
        // MIAgent.retry(qnaNo) // TODO: retry 최신화 필요
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
    if (!hasConversations || !initialHistoryLoading) return () => {}

    let previousConversationsLength = MIAgent.conversations.length
    let isChecking = false
    let resizeObserver: ResizeObserver | null = null
    let resizeTimeout: NodeJS.Timeout | null = null

    const checkAndLoadHistory = async () => {
      if (!scrollRef.current || isChecking || MIAgent.history.isLoading) return

      const container = scrollRef.current
      const { scrollHeight, clientHeight, scrollTop } = container
      const hasScrollbar = scrollHeight > clientHeight
      // 히스토리 로드 시에는 스크롤이 맨 위에 있어야 함 (5px 오차 허용)
      const isAtTop = scrollTop <= 5

      if (hasScrollbar && !isAtTop) {
        setInitialHistoryLoading(false)
        return
      }

      if (MIAgent.history.isLast) {
        setInitialHistoryLoading(false)
        return
      }

      if (isAtTop) {
        isChecking = true
        const success = await fetchPreviousHistory()

        if (success && MIAgent.conversations.length > previousConversationsLength) {
          previousConversationsLength = MIAgent.conversations.length
          requestAnimationFrame(() => {
            setTimeout(() => {
              isChecking = false
              checkAndLoadHistory()
            }, 100)
          })
        } else {
          isChecking = false
          setInitialHistoryLoading(false)
        }
      } else {
        // 스크롤이 맨 위가 아니면 히스토리 로드 완료
        setInitialHistoryLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      if (!scrollRef.current) return

      // 새로운 챗이 아닌 길이변화가 생긴경우 히스토리 로드 간주
      if (!MIAgent.conversations.at(-1)?.isNew) {
        resizeObserver = new ResizeObserver(() => {
          // 디바운싱: ResizeObserver가 너무 자주 호출되지 않도록
          if (resizeTimeout) {
            clearTimeout(resizeTimeout)
          }
          resizeTimeout = setTimeout(() => {
            if (!isChecking && !MIAgent.history.isLoading) {
              requestAnimationFrame(() => {
                checkAndLoadHistory()
              })
            }
          }, 100)
        })

        resizeObserver.observe(scrollRef.current)

        requestAnimationFrame(() => {
          checkAndLoadHistory().then()
        })
      }
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [MIAgent.conversations, MIAgent.history, hasConversations, initialHistoryLoading, scrollRef, fetchPreviousHistory])

  return (
    <>
      <Portal>
        <Fade in={windowExpend} timeout={200} mountOnEnter unmountOnExit>
          <Box
            onClick={toggleExpand}
            sx={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 8, 22, 0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 1299,
              pointerEvents: windowExpend ? 'auto' : 'none',
            }}
          />
        </Fade>
      </Portal>
      <Box
        sx={{
          position: 'relative',
          zIndex: windowExpend ? 1300 : 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            width: windowExpend ? 'calc(100vw - 26px)' : '640px',
            minWidth: '640px',
            maxWidth: 'calc(100vw - 24px)',
            height: windowExpend ? `calc(100vh - ${28}px)` : hasConversations ? `calc(100vh - ${top + 16}px)` : `${Math.max(547, 0)}px`,
            minHeight: '547px',
            marginTop: windowExpend ? `-${top - 14}px` : '0',
            marginRight: windowExpend ? `${12 - offsetLeft}px` : '0',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: windowExpend ? 'rgba(65, 76, 147, 0.2)' : '#DEE2E6',
            background: '#F9F8F6',
            overflow: 'hidden',
            transition: (theme) =>
              theme.transitions.create(
                ['width', 'height', 'max-height', 'min-height', 'box-shadow', 'border-color', 'margin-top', 'margin-right'],
                {
                  duration: 400,
                  easing: theme.transitions.easing.easeInOut,
                },
              ),
            boxShadow: windowExpend
              ? '0px 12px 40px rgba(65, 76, 147, 0.18), 0px 0px 0px 1px rgba(65, 76, 147, 0.1)'
              : '0px 6px 20px rgba(65, 76, 147, 0.1)',
          }}
        >
          {/* History area */}
          <MIAgentHistory
            loading={MIAgent.chatRoom.isLoading}
            chatRooms={MIAgent.chatRoom.list}
            onSelectChat={(chatId: string) => {
              setInitialHistoryLoading(true)
              MIAgent.setSelectedChatRoomId(chatId, false)
            }}
            windowExpend={windowExpend}
            onEditTitle={async (chatId: string, newTitle: string) => {
              try {
                await agentService.updateChatRoom(chatId, newTitle)
                await MIAgent.chatRoom.refetch()
              } catch {
                showSnackbar(t('mari.snackbar.updateChatRoomName'), { variant: 'error' })
              }
            }}
            onDelete={async (chatId: string) => {
              try {
                await agentService.deleteChatRoom(chatId)
                await MIAgent.chatRoom.refetch()
                showSnackbar(t('mari.snackbar.deleteChatRoomSuccess'), { variant: 'success' })
                if (MIAgent.selectedChatRoom?.chatRoomId === chatId) {
                  MIAgent.setSelectedChatRoomId(null, true)
                  setInitialHistoryLoading(false)
                }
              } catch {
                showSnackbar(t('mari.snackbar.deleteChatRoomFail'), { variant: 'error' })
              }
            }}
            disabled={isGenerating}
            selectedChatRoomId={MIAgent.selectedChatRoom?.chatRoomId}
          />
          {/* Content area */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#F9F8F6',
              width: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              height: '100%',
              minHeight: 0,
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
                justifyContent: 'center',
              }}
            >
              <Stack flex={hasConversations ? 1 : 'none'} overflow="hidden" position="relative">
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
                    windowExpend={windowExpend}
                    onSendMessage={handleSendMessage}
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
                      <Collapse
                        in={!initialHistoryLoading}
                        timeout="auto"
                        sx={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Fade in={!initialHistoryLoading} timeout={600}>
                          <Stack
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                              width: '100%',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                              overflow: 'hidden',
                            }}
                          >
                            <Stack
                              direction="row"
                              height="107px"
                              justifyContent="center"
                              alignItems="center"
                              gap="8px"
                              sx={{
                                background:
                                  'linear-gradient(93.95deg, #0097E8 24.33%, #2A31BF 70.71%), linear-gradient(268.65deg, rgba(0, 102, 255, 0) 8.47%, rgba(123, 71, 255, 0.5) 101.97%)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textFillColor: 'transparent',
                                backgroundSize: '200% 200%',
                                animation: `${gradientTextAnimation} 6s ease infinite`,
                                userSelect: 'none',
                              }}
                            >
                              <Typography fontWeight={600} fontSize={'26px'} lineHeight={'1.2'}>
                                Ask
                              </Typography>
                              <Typography fontWeight={700} fontSize={'26px'} lineHeight={'1.2'}>
                                MARI
                              </Typography>
                              <Typography fontWeight={600} fontSize={'26px'} lineHeight={'1.2'}>
                                for market insights
                              </Typography>
                            </Stack>
                            <Stack py="12px" mb="47px" alignItems="center" gap="10px" sx={{ userSelect: 'none' }}>
                              <Typography variant="body2R14" color="contentText.Subtext">
                                Ask something like this
                              </Typography>
                              <Stack alignItems="center" gap="6px">
                                {isLoading ? (
                                  <Box display={'flex'} justifyContent={'center'} alignItems={'center'} height={'116px'}>
                                    <MIAgentSpinner />
                                  </Box>
                                ) : (
                                  majorQuestions?.map(({ majorQuestionNo, majorQuestion }) => (
                                    <Box
                                      key={majorQuestionNo}
                                      width="fit-content"
                                      height="35px"
                                      padding="6px 12px"
                                      borderRadius="23px"
                                      border="1px solid"
                                      borderColor="contentBorder.Normal"
                                      bgcolor="commonColor.White"
                                      boxSizing="border-box"
                                      sx={{
                                        lineHeight: '1',
                                        '&:hover': {
                                          borderColor: 'contentBorder.Hover',
                                          backgroundColor: 'contentBG.Hover',
                                          cursor: 'pointer',
                                        },
                                      }}
                                      onClick={() => handleSendMessage(majorQuestion)}
                                    >
                                      <Typography variant="body2M14" color="contentText.Normal">
                                        {majorQuestion}
                                      </Typography>
                                    </Box>
                                  ))
                                )}
                              </Stack>
                            </Stack>
                          </Stack>
                        </Fade>
                      </Collapse>
                    )}
                  </>
                )}
              </Stack>
            </Box>
            {/* Footer area */}
            <Box
              sx={{
                padding: '12px',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                boxSizing: 'border-box',
                transition: (theme) =>
                  theme.transitions.create(['opacity', 'transform'], {
                    duration: theme.transitions.duration.standard,
                    easing: theme.transitions.easing.easeInOut,
                  }),
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
    </>
  )
}

const MIAgentChatWindow = (props: MIAgentChatWindowProps) => (
  <MIAgentScrollProvider>
    <MIAgentChatWindowContent {...props} />
  </MIAgentScrollProvider>
)

export default MIAgentChatWindow
