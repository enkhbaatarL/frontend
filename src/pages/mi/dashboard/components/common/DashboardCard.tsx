import { Box, Card, CardProps, Stack, StackProps, Typography } from '@mui/material'
import { ReactNode, useState, MouseEvent, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import MIButton from '@/components/common/button/MIButton'
import DashboardCardHeader from '@/pages/mi/dashboard/components/common/DashboardCardHeader'

interface Props extends Omit<CardProps, 'title'> {
  icon?: string
  title: ReactNode
  link?: string
  headerContent?: ReactNode
  direction?: 'row' | 'column'
  gap?: number | string
  collapsedHeight?: number | string
  childrenProps?: StackProps
}

const DashboardCard = ({
  icon,
  title,
  link,
  headerContent,
  children,
  childrenProps,
  direction = 'row',
  gap = '24px',
  collapsedHeight,
  ...props
}: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(!!collapsedHeight)
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const [showButton, setShowButton] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const handleToggleCollapse = () => {
    setIsAnimating(true)
    setIsCollapsed(!isCollapsed)
  }

  const eventBlocker = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  const collapsedContentHeight = useMemo(() => {
    if (!collapsedHeight) return undefined

    if (typeof collapsedHeight === 'number') {
      return collapsedHeight - 90 - 60
    }

    return `calc(${collapsedHeight} - 90px - 60px)`
  }, [collapsedHeight])

  const animationTimeout = useMemo(() => {
    if (!collapsedHeight) return 600

    let pixelHeight: number

    if (typeof collapsedHeight === 'number') {
      pixelHeight = collapsedHeight - 90 - 60
    } else {
      const regex = /(\d+)/
      const match = regex.exec(collapsedHeight)
      pixelHeight = match ? Number.parseInt(match[1]) - 90 - 60 : 200
    }

    return Math.max(600, pixelHeight * 0.7)
  }, [collapsedHeight])

  const currentTimeout = isAnimating ? animationTimeout : 0

  const calculatedMaxHeight = useMemo(() => {
    if (isCollapsed) {
      return collapsedContentHeight
    }
    if (contentHeight) {
      return `${contentHeight}px`
    }
    return 'none'
  }, [isCollapsed, collapsedContentHeight, contentHeight])

  // 실제 콘텐츠 높이 측정
  useEffect(() => {
    if (!innerRef.current) return undefined

    const updateHeight = () => {
      if (innerRef.current) {
        const height = innerRef.current.scrollHeight
        setContentHeight(height)

        // collapsedHeight와 비교하여 버튼 표시 여부 결정
        if (collapsedHeight) {
          let threshold: number
          if (typeof collapsedHeight === 'number') {
            threshold = collapsedHeight - 90 - 60
          } else {
            const regex = /(\d+)/
            const match = regex.exec(collapsedHeight)
            threshold = match ? Number.parseInt(match[1]) - 90 - 60 : 200
          }
          const shouldShowButton = height > threshold
          setShowButton(shouldShowButton)

          if (!shouldShowButton) {
            setIsCollapsed(true)
          }
        }
      }
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(innerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [children, collapsedHeight])

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, animationTimeout)

      return () => clearTimeout(timer)
    }

    return undefined
  }, [isAnimating, animationTimeout])

  return (
    <Card
      elevation={0}
      {...props}
      sx={{
        border: '1px solid #DEE2E6',
        borderRadius: '10px',
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        ...props.sx,
      }}
    >
      <Stack>
        <DashboardCardHeader icon={icon} title={title} link={link}>
          {headerContent}
        </DashboardCardHeader>
        <Box position="relative">
          <Box
            ref={contentRef}
            sx={{
              maxHeight: calculatedMaxHeight,
              overflow: 'hidden',
              transition: `max-height ${currentTimeout}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          >
            <Stack ref={innerRef} px="24px" direction={direction} gap={gap} {...childrenProps}>
              {children}
            </Stack>
          </Box>
          {collapsedHeight && showButton && (
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              height="52px"
              sx={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 1) 100%)',
                zIndex: 10,
                cursor: 'default',
                opacity: isCollapsed ? 1 : 0,
                transition: `opacity ${isCollapsed ? 0 : currentTimeout}ms ease-in-out`,
                pointerEvents: isCollapsed ? 'auto' : 'none',
              }}
              onClick={eventBlocker}
              onMouseDown={eventBlocker}
              onMouseUp={eventBlocker}
            />
          )}
        </Box>
        {collapsedHeight && (
          <Box
            sx={{
              opacity: showButton ? 1 : 0,
              transition: 'opacity 400ms ease-in-out',
              pointerEvents: showButton ? 'auto' : 'none',
            }}
          >
            {showButton ? (
              <Box
                padding="18px 24px"
                sx={{
                  position: 'relative',
                  zIndex: 11,
                  userSelect: 'none',
                  backgroundColor: 'white',
                }}
              >
                <MIButton width="100%" color="gray" type="outlined" contentType="text" size="h42" onClick={handleToggleCollapse}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1" color="gray.90" fontWeight={600}>
                      {isCollapsed ? t('common.showMore') : t('common.showLess')}
                    </Typography>
                  </Box>
                </MIButton>
              </Box>
            ) : (
              <Box height="18px" />
            )}
          </Box>
        )}
        {!collapsedHeight && children && <Box height="18px" />}
      </Stack>
    </Card>
  )
}

export default DashboardCard
