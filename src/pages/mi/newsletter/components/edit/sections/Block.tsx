import { KeyboardArrowDownRounded, KeyboardArrowUpRounded, Visibility, VisibilityOff, DeleteRounded } from '@mui/icons-material'
import { Box, Collapse, Stack, Typography } from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MISimpleConfirm from '@/components/common/confirm/MISimpleConfirm'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import { BlockContext, useIsInsideBlock } from '@/contexts/BlockContext'
import useSnackbar from '@/hooks/useSnackbar'

export interface BlockOrderProps {
  siblingIds: string[]
  currentId: string
  onOrderChange: (targetIndex: number) => void
  /** true면 순서 번호만 표시하고 드롭다운 변경 불가 (예: NEWS_FLOW 시간순 정렬) */
  disabled?: boolean
}

interface BlockProps {
  label: ReactNode
  children: ReactNode
  fixed?: boolean
  order?: BlockOrderProps
  customSlot?: ReactNode
  onDelete?: () => void
  collapsedPreview?: string
  /**
   * 편집기 눈 아이콘(숨김) 상태.
   * - undefined이면 기존처럼 로컬 state로 동작
   * - 주어지면 스냅샷 visibility와 동기화
   */
  visibility?: boolean
  onVisibilityChange?: (visible: boolean) => void
}

const Block = ({
  label,
  children,
  fixed = false,
  order,
  customSlot,
  onDelete,
  collapsedPreview,
  visibility,
  onVisibilityChange,
}: BlockProps) => {
  const isInsideBlock = useIsInsideBlock()
  const { showSnackbar } = useSnackbar()
  const [isOrderSelectOpen, setIsOrderSelectOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isVisible, setIsVisible] = useState(visibility ?? true)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  useEffect(() => {
    if (visibility === undefined) return
    setIsVisible(visibility)
  }, [visibility])

  const orderSelectDisabled = fixed || Boolean(order?.disabled)
  const hasOrder = !fixed && order && order.siblingIds.length > 0
  const currentIndex = order ? order.siblingIds.indexOf(order.currentId) : 0
  const orderItems = hasOrder
    ? order.siblingIds.map((id, i) => ({
      label: String(i + 1).padStart(2, '0'),
      value: id,
    }))
    : []

  const handleOrderSelect = (selectedId: string) => {
    if (!order) return
    const targetIndex = order.siblingIds.indexOf(selectedId)
    if (targetIndex >= 0 && targetIndex !== currentIndex) {
      order.onOrderChange(targetIndex)
    }
  }

  const getOrderSelectItems = () => {
    if (fixed) return [{ label: 'Fixed', value: 'fixed' }]
    if (hasOrder) return orderItems
    return [{ label: '01', value: '1' }]
  }

  const getOrderSelectSelected = () => {
    if (fixed) return 'fixed'
    if (hasOrder) return order.currentId
    return '1'
  }

  useEffect(() => {
    if (!isVisible) {
      setIsCollapsed(true)
    }
  }, [isVisible])

  return (
    <>
      <BlockContext.Provider value={true}>
        <Stack
          borderRadius="10px"
          border="1px solid"
          borderColor="contentBorder.Normal"
          bgcolor={isInsideBlock ? 'commonColor.White' : 'gray.10'}
          overflow="hidden"
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            bgcolor={isVisible ? 'commonColor.White' : 'gray.10'}
            padding="12px"
            boxSizing="border-box"
            sx={{
              transition: 'background-color 0.2s ease-in-out',
            }}
            gap="8px"
          >
            <Stack direction="row" alignItems="center" gap="8px" sx={{ flexShrink: 0 }}>
              <MISelectMenu
                open={isOrderSelectOpen}
                onOpenChange={setIsOrderSelectOpen}
                label={label}
                variant="outlined"
                placement="bottom-end"
                selected={getOrderSelectSelected()}
                onSelected={hasOrder && !orderSelectDisabled ? handleOrderSelect : () => {}}
                items={getOrderSelectItems()}
                closeOnScroll
                disabled={orderSelectDisabled}
              />
              <MIBaseButton
                variant="outlined"
                onClick={() => {
                  const next = !isVisible
                  if (onVisibilityChange) onVisibilityChange(next)
                  setIsVisible(next)
                }}
                enableHoverBackground
                sx={{
                  padding: '8px 10px',
                }}
              >
                {isVisible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" sx={{ color: 'contentIcon.Enabled' }} />}
              </MIBaseButton>
              {customSlot}
              {onDelete && (
                <MIBaseButton
                  variant="outlined"
                  onClick={() => setIsConfirmDialogOpen(true)}
                  enableHoverBackground
                  sx={{
                    padding: '8px 10px',
                    '&:hover .MuiSvgIcon-root': {
                      fill: ' #CC4D50',
                    },
                  }}
                >
                  <DeleteRounded fontSize="small" />
                </MIBaseButton>
              )}
            </Stack>
            {collapsedPreview && (
              <Typography
                variant="body2M14"
                color={isVisible ? 'contentText.Normal' : 'contentText.Disabled'}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  opacity: isCollapsed ? 1 : 0,
                  transform: isCollapsed ? 'translateY(0)' : 'translateY(2px)',
                  transition: isCollapsed
                    ? 'color 0.2s ease-in-out, opacity 0.2s ease-in-out 0.2s, transform 0.2s ease-in-out'
                    : 'color 0.2s ease-in-out, opacity 0.2s ease-in-out, transform 0s 0.2s',
                }}
                title={collapsedPreview}
              >
                {collapsedPreview}
              </Typography>
            )}
            <MIBaseButton
              variant="text"
              onClick={() => setIsCollapsed(!isCollapsed)}
              sx={{
                padding: '8px 10px',
              }}
            >
              {isCollapsed ? (
                <KeyboardArrowDownRounded fontSize="small" sx={{ color: 'contentIcon.Enabled' }} />
              ) : (
                <KeyboardArrowUpRounded fontSize="small" sx={{ color: 'contentIcon.Enabled' }} />
              )}
            </MIBaseButton>
          </Stack>
          <Collapse in={!isCollapsed}>
            <Box pt="12px" borderTop="1px solid" borderColor="contentBorder.Normal" boxSizing="border-box">
              <Stack padding="12px">{children}</Stack>
            </Box>
          </Collapse>
        </Stack>
      </BlockContext.Provider>
      {onDelete && (
        <MISimpleConfirm
          open={isConfirmDialogOpen}
          content="선택한 항목을 삭제합니다"
          handleClose={() => setIsConfirmDialogOpen(false)}
          actions={[
            {
              children: '취소',
              variant: 'outlined',
              color: 'secondary',
              onClick: () => setIsConfirmDialogOpen(false),
            },
            {
              children: '삭제',
              variant: 'contained',
              color: 'error',
              onClick: () => {
                onDelete()
                showSnackbar('항목이 삭제 되었습니다.', { variant: 'success' })
                setIsConfirmDialogOpen(false)
              },
            },
          ]}
        />
      )}
    </>
  )
}

export default Block
