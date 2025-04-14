import { Alert, AlertTitle, Typography } from '@mui/material'
import { closeSnackbar, CustomContentProps, SnackbarContent } from 'notistack'
import { forwardRef, ReactNode, useCallback } from 'react'

import Flex from '@/components/common/display/Flex'
import CloseIcon from '@/components/common/icons/CloseIcon'
import ErrorIconSm from '@/components/common/icons/ErrorIconSm'
import InfoIconSm from '@/components/common/icons/InfoIconSm'
import SuccessIconSm from '@/components/common/icons/SuccessIconSm'
import WarningIconSm from '@/components/common/icons/WarningIconSm'

interface AdminSnackbarProps extends CustomContentProps {
  body?: ReactNode
}

const AdminSnackbar = forwardRef<HTMLDivElement, AdminSnackbarProps>((props, ref) => {
  const { id, message, variant, body } = props

  const handleClose = useCallback(() => {
    if (id) {
      closeSnackbar(id)
    }
  }, [id])

  return (
    <SnackbarContent ref={ref} role="alert">
      <Alert
        sx={{ alignItems: body ? 'start' : 'center' }}
        iconMapping={{
          success: <SuccessIconSm />,
          error: <ErrorIconSm />,
          info: <InfoIconSm />,
          warning: <WarningIconSm />,
        }}
        action={
          <Flex style={{ cursor: 'pointer' }} onClick={handleClose}>
            <CloseIcon />
          </Flex>
        }
        variant="outlined"
        onClose={handleClose}
        severity={variant as 'error' | 'info' | 'success' | 'warning'}
      >
        <AlertTitle>{message}</AlertTitle>
        {body && (
          <Typography paddingBottom={1.5} variant="body2" color="gray.70">
            {body}
          </Typography>
        )}
      </Alert>
    </SnackbarContent>
  )
})

AdminSnackbar.displayName = 'AdminSnackbar'

export default AdminSnackbar
