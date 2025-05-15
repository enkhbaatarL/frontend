import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { t } from 'i18next'
import { ReactNode, useEffect } from 'react'

import MIButton from '@/components/common/button/MIButton'
import CloseIcon from '@/components/common/icons/CloseIcon'

interface ActionButton {
  label: ReactNode
  variant?: 'filled' | 'outlined' | 'ghost'
  color?: 'primary' | 'gray' | 'white' | 'red'
  disabled?: boolean
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
}

const AdminConfirm = ({
  open,
  title,
  children,
  width = 400,
  handleClose,
  justifyContentAction = 'end',
  hideFooter = false,
  actions = [{ label: t('확인'), variant: 'filled', color: 'primary', onClick: handleClose }],
}: Props) => {
  useEffect(() => {
    const className = 'admin-confirm-open'

    if (open) {
      document.body.classList.add(className)
    } else {
      document.body.classList.remove(className)
    }

    return () => {
      document.body.classList.remove(className)
    }
  }, [open])

  useEffect(() => {
    const preventScroll = (e: Event) => e.preventDefault()

    if (open) {
      window.addEventListener('wheel', preventScroll, { passive: false })
      window.addEventListener('touchmove', preventScroll, { passive: false })
    } else {
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
    }

    return () => {
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
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
      onClose={handleClose}
    >
      <DialogTitle>
        <span style={{ fontWeight: children ? 700 : 600 }}>{title}</span>
        {children && (
          <MIButton startIcon={<CloseIcon />} size={'h32'} type={'ghost'} contentType={'icon'} color={'gray'} onClick={handleClose} />
        )}
      </DialogTitle>

      {children && (
        <DialogContent>
          <DialogContentText>{children}</DialogContentText>
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
            >
              {action.label}
            </MIButton>
          ))}
      </DialogActions>
    </Dialog>
  )
}

export default AdminConfirm
