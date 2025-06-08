import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { t } from 'i18next'
import { ReactNode, useEffect } from 'react'

import MIButton from '@/components/common/button/MIButton'
import CloseIcon from '@/components/common/icons/CloseIcon'

export interface ActionButton {
  label: ReactNode
  variant?: 'filled' | 'outlined' | 'ghost'
  color?: 'primary' | 'gray' | 'white' | 'red' | `#${string}`
  hoverBgColor?: 'primary' | 'gray' | 'gray2' | 'white' | 'red' | `#${string}`
  disabled?: boolean
  disableHoverColor?: boolean
  onClick: () => void | Promise<void>
}

interface Props {
  open: boolean
  title: ReactNode
  children?: ReactNode
  width?: string | number
  handleClose: () => void
  justifyContentAction?: 'space-between' | 'end' | 'start' | 'center'
  actions?: ActionButton[]
  hideFooter?: boolean
  zIndex?: number
  disableClose?: boolean
}

const MIConfirm = ({
  open,
  title,
  children,
  width = 400,
  handleClose,
  justifyContentAction = 'end',
  hideFooter = false,
  actions = [{ label: t('확인'), variant: 'filled', color: 'primary', onClick: handleClose }],
  zIndex,
  disableClose = false,
}: Props) => {
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
            width: typeof width === 'number' ? `${width}px` : width,
            maxHeight: 800,
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
      }}
    >
      <DialogTitle>
        <span style={{ fontWeight: children ? 700 : 600 }}>{title}</span>
        {children && (
          <MIButton
            startIcon={<CloseIcon />}
            size={'h32'}
            type={'ghost'}
            contentType={'icon'}
            color={'gray'}
            onClick={() => {
              if (disableClose) {
                return
              }
              handleClose()
            }}
            disabled={disableClose}
          />
        )}
      </DialogTitle>

      {children && (
        <DialogContent>
          <DialogContentText component="div">{children}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ paddingTop: children ? '30px' : 0, justifyContent: justifyContentAction }}>
        {!hideFooter &&
          actions.map((action, index) => (
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

export default MIConfirm
