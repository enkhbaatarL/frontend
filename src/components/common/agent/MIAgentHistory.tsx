import { Box, Typography, List, ListItem, Tooltip, Theme, Stack, Collapse, Fade, Skeleton, keyframes } from '@mui/material'
import { useState, useMemo, memo, useEffect, useRef, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import axLogo from '@/assets/agent/a.x.svg'
import MIAgentHistoryItem from '@/components/common/agent/MIAgentHistoryItem'
import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import HistoryIcon from '@/components/common/icons/agent/HistoryIcon'
import { IChatRoom } from '@/hooks/useMIAgent'

export interface MiAgentHistoryProps {
  loading: boolean
  chatRooms?: IChatRoom[]
  onSelectChat: (chatId: string) => void
  windowExpend: boolean
  onEditTitle: (chatId: string, newTitle: string) => Promise<void>
  onDelete: (chatId: string) => Promise<void>
  disabled?: boolean
  selectedChatRoomId?: string | null
}

const historyIconStyles = {
  padding: '6px',
  margin: '12px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'start',
  alignItems: 'center',
  boxSizing: 'border-box',
  borderRadius: '4px',
  color: 'gray.60',
  '&:hover': {
    backgroundColor: 'contentBG.Hover',
    color: 'gray.80',
  },
}

// Iris In 애니메이션 정의
const irisInKeyframes = keyframes`
  0% {
    clip-path: circle(0% at 50% 50%);
    opacity: 0;
  }
  100% {
    clip-path: circle(150% at 50% 50%);
    opacity: 1;
  }
`

// 스켈레톤 페이드 아웃 애니메이션 (Iris가 거의 다 열릴 때쯤(60%) 부드럽게 사라짐)
const skeletonFadeOutKeyframes = keyframes`
  0% {
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`

const ShimmerSkeleton = memo(() => (
  <Skeleton
    variant="rectangular"
    animation="wave"
    width={184}
    height={44}
    sx={{
      borderRadius: '100px',
      padding: '8px',
      boxSizing: 'border-box',
    }}
  />
))

ShimmerSkeleton.displayName = 'ShimmerSkeleton'

const IrisRevealWrapper = ({
  children,
  showEffect,
  onAnimationEnd,
}: {
  children: ReactNode
  showEffect: boolean
  onAnimationEnd?: () => void
}) => {
  const duration = 1800

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {showEffect && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            animation: `${skeletonFadeOutKeyframes} ${duration}ms ease-out forwards`,
          }}
        >
          <ShimmerSkeleton />
        </Box>
      )}

      <Box
        onAnimationEnd={showEffect ? onAnimationEnd : undefined}
        sx={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'white',
          transition: (theme) =>
            theme.transitions.create(['border-radius'], {
              duration,
              easing: theme.transitions.easing.easeInOut,
            }),
          ...(showEffect && {
            animation: `${irisInKeyframes} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
          }),
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

const MiAgentHistory = ({
  loading,
  chatRooms,
  onSelectChat = () => {},
  windowExpend,
  onEditTitle,
  onDelete,
  disabled,
  selectedChatRoomId,
}: MiAgentHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [triggerReveal, setTriggerReveal] = useState(false) // Iris 애니메이션 트리거 상태

  const prevCreatingRef = useRef(false)

  const { t } = useTranslation()

  const isCreatingNewChat = useMemo(() => {
    if (!selectedChatRoomId) return false
    return !chatRooms?.some((room) => room.chatRoomId === selectedChatRoomId)
  }, [selectedChatRoomId, chatRooms])

  // 생성 상태가 true -> false로 변하는 순간 감지 (대화 종료 시점)
  useEffect(() => {
    if (prevCreatingRef.current && !isCreatingNewChat) {
      setTriggerReveal(true)
    }
    prevCreatingRef.current = isCreatingNewChat
  }, [isCreatingNewChat])

  const handleAnimationEnd = () => {
    setTriggerReveal(false)
  }

  const containerStyles = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'start',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: windowExpend ? '100%' : '0px',
      width: windowExpend ? (isExpanded ? '200px' : '78px') : '0px',
      minWidth: windowExpend ? (isExpanded ? '200px' : '78px') : '0px',
      maxWidth: windowExpend ? (isExpanded ? '200px' : '78px') : '0px',
      minHeight: windowExpend ? '100%' : '0px',
      maxHeight: windowExpend ? '100%' : '0px',
      backgroundColor: 'white',
      borderTopLeftRadius: '12px',
      borderBottomLeftRadius: '12px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      transition: (theme: Theme) =>
        theme.transitions.create(['width', 'min-width', 'max-width', 'opacity', 'transform'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
      opacity: windowExpend ? 1 : 0,
      transform: windowExpend ? 'translateX(0)' : 'translateX(-10px)',
      willChange: 'width, transform, opacity',
      backfaceVisibility: 'hidden',
    }),
    [isExpanded, windowExpend],
  )

  return (
    <Box sx={containerStyles}>
      <Stack height="70px" justifyContent="center" alignItems="center" padding="19px 12px" boxSizing="border-box">
        <Tooltip title={isExpanded ? 'Collapse' : 'Open'} placement="right-start">
          <Box sx={historyIconStyles} onClick={() => setIsExpanded(!isExpanded)}>
            <HistoryIcon />
          </Box>
        </Tooltip>
      </Stack>

      <List
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          width: '100%',
          textAlign: 'left',
          padding: 0,
        }}
      >
        <Collapse
          in={isExpanded}
          timeout={300}
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            '& .MuiCollapse-wrapper': {
              transition: (theme: Theme) =>
                theme.transitions.create('height', {
                  duration: theme.transitions.duration.standard,
                  easing: theme.transitions.easing.easeInOut,
                }),
            },
          }}
        >
          <Fade in={isExpanded} timeout={300}>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
              <Stack
                height="37px"
                padding="10px 20px"
                boxSizing="border-box"
                justifyContent="center"
                alignItems="start"
                sx={{
                  transition: (theme: Theme) =>
                    theme.transitions.create('padding', {
                      duration: theme.transitions.duration.standard,
                      easing: theme.transitions.easing.easeInOut,
                    }),
                }}
              >
                <Typography variant="body3" color="gray.60" height="17px">
                  {t('common.recent')}
                </Typography>
              </Stack>
              {loading ? (
                <ListItem disablePadding>
                  <Box sx={{ padding: '12px', height: '44px', display: 'flex', alignItems: 'center' }}>
                    <MIAgentSpinner />
                  </Box>
                </ListItem>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingX: '12px',
                    position: 'relative',
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
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CED4DA transparent',
                  }}
                >
                  {/**
                   * 1. 생성 중일 때는 상단에 스켈레톤 표시
                   * 2. 생성 완료(reveal) 시점에는 이 영역을 숨기고 아래 리스트의 0번 인덱스에서 Iris 애니메이션 처리
                   */}
                  {!triggerReveal && (
                    <Collapse in={isCreatingNewChat} timeout={300} unmountOnExit>
                      <Fade in={isCreatingNewChat} timeout={1000}>
                        <Box>
                          <ListItem disablePadding key="shimmer-skeleton">
                            <ShimmerSkeleton />
                          </ListItem>
                        </Box>
                      </Fade>
                    </Collapse>
                  )}

                  {chatRooms?.map((item, index) => (
                    <ListItem key={item.chatRoomId} disablePadding>
                      {/* 0번 인덱스이고, reveal 트리거가 발동되었을 때 Iris 효과 적용 */}
                      <IrisRevealWrapper
                        showEffect={index === 0 && triggerReveal}
                        onAnimationEnd={index === 0 ? handleAnimationEnd : undefined}
                      >
                        <MIAgentHistoryItem
                          selected={selectedChatRoomId === item.chatRoomId}
                          item={item}
                          onSelected={(id) => {
                            if (selectedChatRoomId !== id) onSelectChat(id)
                          }}
                          onEditTitle={onEditTitle}
                          onDelete={onDelete}
                          disabled={disabled}
                        />
                      </IrisRevealWrapper>
                    </ListItem>
                  ))}
                </Box>
              )}
            </Box>
          </Fade>
        </Collapse>
      </List>

      <Stack
        direction="row"
        width="100%"
        alignItems="center"
        justifyContent="flex-start"
        padding="24px 22px"
        gap="5px"
        boxSizing="border-box"
        sx={{
          minHeight: '61px',
          transition: (theme: Theme) =>
            theme.transitions.create(['padding'], {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }),
          userSelect: 'none',
        }}
      >
        <Box
          sx={{
            maxWidth: isExpanded ? '100px' : '0px',
            overflow: 'hidden',
            opacity: isExpanded ? 1 : 0,
            transition: (theme: Theme) =>
              theme.transitions.create(['max-width', 'opacity'], {
                duration: theme.transitions.duration.standard,
                easing: theme.transitions.easing.easeInOut,
              }),
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Powered by
          </Typography>
        </Box>
        <Box
          component="img"
          src={axLogo}
          alt="A.X Logo"
          width="29px"
          height="13px"
          sx={{
            flexShrink: 0,
          }}
        />
      </Stack>
    </Box>
  )
}

export default memo(MiAgentHistory)
