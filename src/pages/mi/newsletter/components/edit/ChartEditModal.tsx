import CloseIcon from '@mui/icons-material/Close'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { Box, Fade, Stack, Switch, Typography } from '@mui/material'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIMenu from '@/components/common/menu/MIMenu'
import InflectionPointChart from '@/pages/mi/newsletter/components/chart/InflectionPointChart'
import { type INewsFlowChartData, type IRelatedNewsEventItem, NewsletterDetailPageMode } from '@/service/mi/newsletter'
import useChartEditStore from '@/store/useChartEditStore'

const ANCHOR_GAP = 6

export type ChartEditModalProps = {
  open: boolean
  onClose: () => void
  anchorEl?: HTMLElement | null
  chartData?: INewsFlowChartData
  relatedNews?: IRelatedNewsEventItem[]
  marketOpenTime?: number
  marketCloseTime?: number
  onChartImageReady?: (image: string) => void
  headerGrayBackground?: boolean
  /** 박스 드래그 종료·리셋 후 스냅샷 CHART 좌표 반영 */
  onBoxPositionDragEnd?: () => void
}

const MODAL_WIDTH = 800
const VIEWPORT_PADDING = 8
const DRAG_HANDLE_MIN_VISIBLE = 100

const ChartEditModal = ({
  open,
  onClose,
  anchorEl,
  chartData,
  relatedNews,
  marketOpenTime,
  marketCloseTime,
  onChartImageReady,
  headerGrayBackground = false,
  onBoxPositionDragEnd,
}: ChartEditModalProps) => {
  const {
    showVolumePanel,
    setShowVolumePanel,
    showChartToolbar,
    setShowChartToolbar,
    chartType,
    setChartType,
    boxPositions,
    titleEdits,
    setLiveBoxPosition,
    commitLiveBoxPositions,
    resetBoxPositions,
    setTitleEdit,
  } = useChartEditStore()

  const handleResetChartLayout = useCallback(() => {
    resetBoxPositions()
    onBoxPositionDragEnd?.()
  }, [resetBoxPositions, onBoxPositionDragEnd])

  /** null =좌표 미확정, {x,y} = 실제 위치 */
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 })

  /** 사용자가 드래그해서 움직인 후 저장. 페이지 진입 시 최초는 anchor 사용 */
  const savedPositionRef = useRef<{ x: number; y: number } | null>(null)
  const hasUserMovedRef = useRef(false)

  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const menuTriggerRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(open)
  const persistedOnCloseRef = useRef(false)

  const persistChartEdits = useCallback(() => {
    commitLiveBoxPositions()
    onBoxPositionDragEnd?.()
  }, [commitLiveBoxPositions, onBoxPositionDragEnd])

  const handleClose = useCallback(() => {
    if (hasUserMovedRef.current && position) savedPositionRef.current = position
    hasUserMovedRef.current = false
    persistChartEdits()
    persistedOnCloseRef.current = true
    onClose()
  }, [onClose, persistChartEdits, position])

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      persistedOnCloseRef.current = false
      return
    }

    if (wasOpenRef.current && !persistedOnCloseRef.current) {
      persistChartEdits()
      persistedOnCloseRef.current = true
    }
    wasOpenRef.current = false
  }, [open, persistChartEdits])

  /** 닫힘: 사용자가 드래그로 움직인 적 있으면 위치 저장 */
  useEffect(() => {
    if (!open && hasUserMovedRef.current && position) {
      savedPositionRef.current = position
    }
  }, [open, position])

  /** 열림: 사용자가 움직인 적 있으면 저장 위치 > 아니면 anchor(페이지 진입 시 최초) > 중앙 fallback */
  useLayoutEffect(() => {
    if (!open) return

    if (savedPositionRef.current) {
      setPosition(savedPositionRef.current)
      return
    }

    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      setPosition({ x: rect.left, y: rect.bottom + ANCHOR_GAP })
      return
    }

    const rect = modalRef.current?.getBoundingClientRect()
    if (rect) {
      setPosition({ x: rect.left, y: rect.top })
    }
  }, [open, anchorEl])

  /** ClickAwayListener 보완: 스위치 토글 후 외부 클릭 시 확실히 닫기 (document capture) */
  useEffect(() => {
    if (!isSettingsMenuOpen) return undefined

    const handleDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      const menuEl = document.getElementById('chart-edit-settings-menu')
      const inTrigger = menuTriggerRef.current?.contains(target)
      const inMenu = menuEl?.contains(target)
      if (!inTrigger && !inMenu) {
        setIsSettingsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocMouseDown, true)
    return () => document.removeEventListener('mousedown', handleDocMouseDown, true)
  }, [isSettingsMenuOpen])

  /** 좌표 제한: 상단은 엄격, 좌/우/하단은 드래그바(56px)만 보이면 화면 밖 허용 */
  const clampPosition = useCallback((x: number, y: number) => {
    const rect = modalRef.current?.getBoundingClientRect()
    if (!rect) return { x, y }
    const minX = DRAG_HANDLE_MIN_VISIBLE - rect.width
    const maxX = window.innerWidth - DRAG_HANDLE_MIN_VISIBLE
    const minY = VIEWPORT_PADDING
    const maxY = window.innerHeight - DRAG_HANDLE_MIN_VISIBLE
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    }
  }, [])

  /** 창 리사이즈 시 모달이 화면 밖으로 나갔다면 뷰포트 내로 재배치 */
  useEffect(() => {
    if (!open || !position) return undefined

    const reclamp = () => {
      const rect = modalRef.current?.getBoundingClientRect()
      if (!rect) return
      const minX = DRAG_HANDLE_MIN_VISIBLE - rect.width
      const maxX = window.innerWidth - DRAG_HANDLE_MIN_VISIBLE
      const minY = VIEWPORT_PADDING
      const maxY = window.innerHeight - DRAG_HANDLE_MIN_VISIBLE
      const clampedX = Math.max(minX, Math.min(maxX, position.x))
      const clampedY = Math.max(minY, Math.min(maxY, position.y))
      if (clampedX !== position.x || clampedY !== position.y) {
        setPosition({ x: clampedX, y: clampedY })
      }
    }

    const resizeObserver = new ResizeObserver(reclamp)
    if (modalRef.current) resizeObserver.observe(modalRef.current)
    window.addEventListener('resize', reclamp)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', reclamp)
    }
  }, [open, position])

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (e.button !== 0) return
      const rect = modalRef.current?.getBoundingClientRect()
      const currentX = position?.x ?? rect?.left ?? 0
      const currentY = position?.y ?? rect?.top ?? 0
      dragRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: currentX,
        startTop: currentY,
      }
    },
    [position],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return
      hasUserMovedRef.current = true
      const rawX = dragRef.current.startLeft + (e.clientX - dragRef.current.startX)
      const rawY = dragRef.current.startTop + (e.clientY - dragRef.current.startY)
      const clamped = clampPosition(rawX, rawY)
      setPosition(clamped)
    },
    [clampPosition],
  )

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false
    globalThis.removeEventListener('mousemove', handleMouseMove)
    globalThis.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleHeaderMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (isSettingsMenuOpen) {
        setIsSettingsMenuOpen(false)
        return
      }
      handleMouseDown(e)
      globalThis.addEventListener('mousemove', handleMouseMove)
      globalThis.addEventListener('mouseup', handleMouseUp)
    },
    [handleMouseDown, handleMouseMove, handleMouseUp, isSettingsMenuOpen],
  )

  return (
    <Fade in={open} timeout={{ enter: 200, exit: 150 }} unmountOnExit>
      <Box
        ref={modalRef}
        sx={{
          position: 'fixed',
          ...(position ? { left: position.x, top: position.y } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }),
          width: MODAL_WIDTH,
          height: 'auto',
          zIndex: 1301,
          backgroundColor: 'commonColor.White',
          border: '1px solid',
          borderColor: 'contentBorder.Normal',
          borderRadius: '10px',
          boxShadow: '0px 4px 24px 0px rgba(0, 0, 0, 0.2), 0px 8px 32px 0px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          onMouseDown={handleHeaderMouseDown}
          padding="12px 18px"
          sx={{
            cursor: 'grab',
            userSelect: 'none',
            flexShrink: 0,
            '&:active': { cursor: 'grabbing' },
            ...(headerGrayBackground && {
              backgroundColor: 'gray.20',
            }),
          }}
        >
          <Box ref={menuTriggerRef} onMouseDown={(e) => e.stopPropagation()}>
            <MIMenu
              open={isSettingsMenuOpen}
              label={<MenuRoundedIcon sx={{ width: 20, height: 20, color: 'gray.70' }} />}
              variant="text"
              placement="bottom-start"
              menuPositionOffset={{ right: -10 }}
              onOpenChange={setIsSettingsMenuOpen}
              buttonHoverBgColor="contentBG.Hover"
              paperProps={{ id: 'chart-edit-settings-menu' }}
              zIndex={1302}
              sx={{
                height: '36px',
                padding: '8px',
                minWidth: 'auto',
                border: 'none',
                backgroundColor: 'transparent',
                '&:hover': { backgroundColor: 'contentBG.Hover' },
              }}
            >
              <Stack padding="12px" gap="12px" minWidth={154} boxSizing="border-box">
                <Box
                  onClick={() => setShowChartToolbar(!showChartToolbar)}
                  borderRadius="10px"
                  py="4px"
                  sx={{ cursor: 'pointer', textWrap: 'nowrap' }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap={1.5} component="div">
                    <Typography variant="body2M14" color="gray.70">
                      도구 모음
                    </Typography>
                    <Switch checked={showChartToolbar} size="small" sx={{ margin: 0, pointerEvents: 'none' }} tabIndex={-1} />
                  </Stack>
                </Box>
                <Box
                  onClick={() => setShowVolumePanel(!showVolumePanel)}
                  borderRadius="10px"
                  py="4px"
                  sx={{ cursor: 'pointer', textWrap: 'nowrap' }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap={1.5} component="div">
                    <Typography variant="body2M14" color="gray.70">
                      거래량 패널
                    </Typography>
                    <Switch checked={showVolumePanel} size="small" sx={{ margin: 0, pointerEvents: 'none' }} tabIndex={-1} />
                  </Stack>
                </Box>
              </Stack>
            </MIMenu>
          </Box>

          <MIBaseButton
            variant="text"
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            buttonHoverBgColor="contentBG.Hover"
            aria-label="차트 창 닫기"
            sx={{
              padding: '8px',
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </MIBaseButton>
        </Stack>

        <Box padding="4px 8px 12px" overflow="hidden">
          <InflectionPointChart
            chartData={chartData}
            relatedNews={relatedNews}
            mode={NewsletterDetailPageMode.EDIT}
            marketOpenTime={marketOpenTime}
            marketCloseTime={marketCloseTime}
            showVolumePanel={showVolumePanel}
            showChartToolbar={showChartToolbar}
            onChartImageReady={onChartImageReady}
            chartType={chartType}
            onChartTypeChange={setChartType}
            boxPositions={boxPositions}
            onBoxPositionChange={setLiveBoxPosition}
            onBoxPositionPreview={setLiveBoxPosition}
            onBoxPositionCommit={commitLiveBoxPositions}
            onBoxDragEnd={onBoxPositionDragEnd}
            onResetBoxPositions={handleResetChartLayout}
            titleEdits={titleEdits}
            onTitleEdit={setTitleEdit}
            chartIdSuffix="modal"
          />
        </Box>
      </Box>
    </Fade>
  )
}

export default ChartEditModal
