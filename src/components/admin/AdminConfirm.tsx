import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'
import { t } from 'i18next'
import { ReactNode } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import CloseIcon from '@/components/common/icons/CloseIcon.tsx'

interface ActionButton {
  label: string
  variant?: 'text' | 'outlined' | 'contained'
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'inherit'
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
}

const AdminConfirm = ({
  open,
  title,
  children,
  width = 400,
  handleClose,
  justifyContentAction = 'end',
  actions = [{ label: t('확인'), variant: 'contained', color: 'primary', onClick: handleClose }],
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
      <span style={{ fontWeight: children ? 700 : 600 }}>{title}</span>
      {children && (
        <IconButton aria-label="close" onClick={handleClose} sx={{ padding: '6px' }}>
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>

    {children && (
      <DialogContent>{typeof children === 'string' ? <DialogContentText>{children}</DialogContentText> : children}</DialogContent>
    )}
    <DialogActions sx={{ paddingTop: children ? '30px' : 0, justifyContent: justifyContentAction }}>
      {actions.map((action, index) => (
        <AdminButton
          size="h34"
          key={action.label + index}
          variant={action.variant ?? 'text'}
          color={action.color ?? 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </AdminButton>
      ))}
    </DialogActions>
  </Dialog>
)

export default AdminConfirm
