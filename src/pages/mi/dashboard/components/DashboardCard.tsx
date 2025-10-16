import { Box, Card, CardProps, Collapse, Stack, Typography } from '@mui/material'
import { ReactNode, useState, MouseEvent, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import MIButton from '@/components/common/button/MIButton'
import DashboardCardHeader from '@/pages/mi/dashboard/components/DashboardCardHeader'

interface Props extends Omit<CardProps, 'title'> {
  icon?: string
  title: ReactNode
  headerContent?: ReactNode
  direction?: 'row' | 'column'
  gap?: number | string
  collapsedHeight?: number | string
}

const DashboardCard = ({ icon, title, headerContent, children, direction = 'row', gap = '24px', collapsedHeight, ...props }: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(!!collapsedHeight)
  const { t } = useTranslation()

  const handleToggleCollapse = () => {
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
      pixelHeight = match ? parseInt(match[1]) - 90 - 60 : 200
    }

    const calculatedTimeout = Math.max(600, pixelHeight * 0.7)
    return calculatedTimeout
  }, [collapsedHeight])

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
        <DashboardCardHeader icon={icon} title={title}>
          {headerContent}
        </DashboardCardHeader>
        <Box position="relative">
          <Collapse
            in={!isCollapsed}
            collapsedSize={collapsedContentHeight}
            timeout={animationTimeout}
            sx={{
              '& .MuiCollapse-wrapper': {
                overflow: isCollapsed ? 'hidden' : 'visible',
              },
              '& .MuiCollapse-wrapperInner': {
                overflow: isCollapsed ? 'hidden' : 'visible',
              },
            }}
          >
            <Stack px="24px" direction={direction} gap={gap}>
              {children}
            </Stack>
          </Collapse>
          {collapsedHeight && (
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
                transition: `opacity ${isCollapsed ? '0ms' : `${animationTimeout}ms`} ease-in-out`,
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
            padding="18px 24px"
            sx={{
              position: 'relative',
              zIndex: 2,
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
        )}
      </Stack>
    </Card>
  )
}

export default DashboardCard
