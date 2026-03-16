import { Box, Dialog, DialogActions, DialogContent } from '@mui/material'
import { ReactNode, useEffect } from 'react'

import { ActionButton } from './MIConfirm'

import MIButton from '@/components/common/button/MIButton'

interface Props {
  open: boolean
  /** 팝업에 표시할 내용 */
  content: ReactNode
  /** 버튼 정의 (label, variant, color, onClick 등) */
  actions: ActionButton[]
  /** 팝업 닫기 핸들러 (backdrop 클릭 시 호출) */
  handleClose: () => void
  /** 가로 크기 (기본 350px, 최소 350px, 최대 800px) */
  width?: string | number
  /** 세로 크기 (기본 148px, 최소 126px, 최대 800px) */
  height?: string | number
  zIndex?: number
  /** backdrop 클릭 시 닫기 비활성화 */
  disableClose?: boolean
}

const DEFAULT_WIDTH = 350
const DEFAULT_HEIGHT = 148
const MIN_WIDTH = 350
const MIN_HEIGHT = 126
const MAX_WIDTH = 800
const MAX_HEIGHT = 800

const clampSize = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const MISimpleConfirm = ({
  open,
  content,
  actions,
  handleClose,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  zIndex,
  disableClose = false,
}: Props) => {
  const widthNum = typeof width === 'number' ? width : parseInt(String(width), 10) || DEFAULT_WIDTH
  const heightNum = typeof height === 'number' ? height : parseInt(String(height), 10) || DEFAULT_HEIGHT

  const finalWidth = clampSize(widthNum, MIN_WIDTH, MAX_WIDTH)
  const finalHeight = clampSize(heightNum, MIN_HEIGHT, MAX_HEIGHT)

  useEffect(() => {
    const className = 'mi-confirm-open'

    if (open) {
      document.body.classList.add(className)
    } else {
      document.body.classList.remove(className)
    }

    return () => {
      document.body.classList.remove(className)
    }
  }, [open])

  return (
    <Dialog
      slotProps={{
        paper: {
          sx: {
            width: `${finalWidth}px`,
            minWidth: `${MIN_WIDTH}px`,
            maxWidth: `${MAX_WIDTH}px`,
            height: `${finalHeight}px`,
            minHeight: `${MIN_HEIGHT}px`,
            maxHeight: `${MAX_HEIGHT}px`,
            borderRadius: '12px',
            padding: '20px',
            boxSizing: 'border-box',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
      open={open}
      onClose={(_, reason) => {
        if (reason === 'backdropClick' && disableClose) {
          return
        }
        handleClose()
      }}
      sx={{
        zIndex,
        '& .MuiDialog-container': {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <DialogContent
        sx={{
          padding: 0,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          '&:last-of-type': {
            paddingBottom: 0,
          },
        }}
      >
        <Box
          component="div"
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            lineHeight: '140%',
            letterSpacing: '0%',
            color: '#495057',
            whiteSpace: 'pre-line',
          }}
        >
          {content}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          padding: 0,
          paddingTop: '20px',
          margin: 0,
          justifyContent: 'flex-end',
          gap: '10px',
          minHeight: 'auto',
        }}
      >
        {actions.map((action, index) => (
          <MIButton
            size="h34"
            key={index}
            type={action.variant ?? 'filled'}
            color={action.color ?? 'primary'}
            onClick={action.onClick}
            disabled={action.disabled}
            hoverBgColor={action.hoverBgColor}
          >
            {action.label}
          </MIButton>
        ))}
      </DialogActions>
    </Dialog>
  )
}

export default MISimpleConfirm
