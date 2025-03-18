import { Close } from '@mui/icons-material'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'
import { t } from 'i18next'
import { ReactNode } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import Flex from '@/components/common/display/Flex'
interface Props {
  open: boolean
  title: ReactNode
  children?: ReactNode
  handleClose: () => void
  handleConfirm: () => void
  closeText?: string
  confirmText?: string
}

const AdminConfirm = ({ open, title, children, handleClose, handleConfirm, closeText, confirmText }: Props) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <Flex justify="space-between" gap={4}>
        <DialogTitle>{title}</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            marginRight: '8px',
            color: theme.palette.grey[500],
          })}
        >
          <Close />
        </IconButton>
      </Flex>
      {children && (
        <DialogContent>
          <DialogContentText>{children}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions>
        <AdminButton onClick={handleClose}>{closeText ?? t('취소')}</AdminButton>
        <AdminButton onClick={handleConfirm} autoFocus>
          {confirmText ?? t('확인')}
        </AdminButton>
      </DialogActions>
    </Dialog>
  )
}

export default AdminConfirm
