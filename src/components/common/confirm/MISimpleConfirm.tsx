import { Dialog, DialogActions, DialogContent, DialogProps, Typography } from '@mui/material'
import { ReactNode, useEffect } from 'react'

import MIBaseButton, { MIBaseButtonProps } from '@/components/common/button/MIBaseButton'

export type MISimpleConfirmAction = MIBaseButtonProps & {
  onClick: () => void | Promise<void>
}

interface MISimpleConfirmProps extends Omit<DialogProps, 'children' | 'content'> {
  content: ReactNode
  actions: MISimpleConfirmAction[]
  handleClose: () => void
  width?: number // 기본 350px, 최소 350px, 최대 800px
  height?: number // 기본 148px, 최소 126px, 최대 800px
  disableClose?: boolean
}

const DEFAULT_WIDTH = 350
const DEFAULT_HEIGHT = 148
const MIN_WIDTH = 350
const MIN_HEIGHT = 126
const MAX_WIDTH = 800
const MAX_HEIGHT = 800

const MISimpleConfirm = ({
  open,
  content,
  actions,
  handleClose,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  disableClose = false,
  slotProps: slotPropsProp,
  sx: sxProp,
  ...rest
}: MISimpleConfirmProps) => {
  const paperSx = {
    width: `${width}px`,
    minWidth: `${MIN_WIDTH}px`,
    maxWidth: `${MAX_WIDTH}px`,
    height: 'auto',
    minHeight: `${MIN_HEIGHT}px`,
    maxHeight: `min(${height}px, ${MAX_HEIGHT}px)`,
    borderRadius: '12px',
    padding: '20px',
    boxSizing: 'border-box',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
  }

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
      {...rest}
      open={open}
      onClose={(_, reason) => {
        if (reason === 'backdropClick' && disableClose) {
          return
        }
        handleClose()
      }}
      slotProps={{
        ...slotPropsProp,
        paper: {
          ...(typeof slotPropsProp?.paper === 'object' && slotPropsProp?.paper),
          sx: [paperSx, ...((slotPropsProp?.paper as { sx?: object })?.sx ? [(slotPropsProp!.paper as { sx: object }).sx] : [])],
        },
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'center',
          justifyContent: 'center',
        },
        ...(sxProp && typeof sxProp === 'object' && !Array.isArray(sxProp) ? sxProp : {}),
      }}
    >
      <DialogContent
        sx={{
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          '&:last-of-type': {
            paddingBottom: 0,
          },
        }}
      >
        <Typography component="div" variant="body1" color="content.textNormal">
          {content}
        </Typography>
      </DialogContent>

      <DialogActions
        disableSpacing
        sx={{
          padding: 0,
          paddingTop: '20px',
          margin: 0,
          justifyContent: 'flex-end',
          gap: '10px',
          minHeight: 'auto',
        }}
      >
        {actions.map((action, index) => {
          const { sx, ...buttonProps } = action

          return (
            <MIBaseButton
              key={index}
              {...buttonProps}
              sx={sx && typeof sx === 'object' && !Array.isArray(sx) ? { height: '34px', ...sx } : { height: '34px' }}
            />
          )
        })}
      </DialogActions>
    </Dialog>
  )
}

export default MISimpleConfirm
