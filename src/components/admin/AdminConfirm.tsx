import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'
import { t } from 'i18next'
import { ReactNode } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import CloseIcon from '@/components/common/icons/CloseIcon.tsx'

interface Props {
  open: boolean
  title: ReactNode
  children?: ReactNode
  width?: string | number
  handleClose: () => void
  handleConfirm: () => void
  closeText?: string
  closeVariant?: 'outlined' | 'contained' | 'text'
  closeColor?: 'primary' | 'secondary' | 'gray' | 'success' | 'error' | 'warning' | 'info'
  confirmText?: string
  confirmVariant?: 'outlined' | 'contained' | 'text'
  confirmColor?: 'primary' | 'secondary' | 'gray' | 'success' | 'error' | 'warning' | 'info'
}

const AdminConfirm = ({
  open,
  title,
  children,
  width = 400,
  handleClose,
  handleConfirm,
  closeText,
  closeVariant = 'outlined',
  closeColor = 'secondary',
  confirmText,
  confirmVariant = 'contained',
  confirmColor = 'primary',
}: Props) => (
  <Dialog
    slotProps={{
      paper: {
        sx: {
          width: typeof width === 'number' ? `${width}px` : width,
        },
      },
    }}
    open={open}
    onClose={handleClose}
  >
    <DialogTitle>
      <span>{title}</span>
      {children && (
        <IconButton aria-label="close" onClick={handleClose} sx={{ padding: '6px' }}>
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>

    {children && (
      <DialogContent>
        <DialogContentText>{children}</DialogContentText>
      </DialogContent>
    )}
    <DialogActions sx={{ paddingTop: children ? '30px' : 0 }}>
      {closeText && (
        <AdminButton size="h34" variant={closeVariant} color={closeColor} onClick={handleClose}>
          {closeText ?? t('취소')}
        </AdminButton>
      )}
      {confirmText && (
        <AdminButton size="h34" variant={confirmVariant} color={confirmColor} onClick={handleConfirm}>
          {confirmText ?? t('확인')}
        </AdminButton>
      )}
    </DialogActions>
  </Dialog>
)

export default AdminConfirm
