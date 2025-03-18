import { Close } from '@mui/icons-material'
import { IconButton } from '@mui/material'
import { closeSnackbar, CustomContentProps, SnackbarContent } from 'notistack'
import { forwardRef, ReactNode } from 'react'

import Flex from '@/components/common/display/Flex.tsx'

interface AdminSnackbarProps extends CustomContentProps {
  body?: ReactNode
}

const AdminSnackbar = forwardRef<HTMLDivElement, AdminSnackbarProps>((props, ref) => {
  const { id, message, variant, iconVariant, body } = props

  return (
    <SnackbarContent ref={ref} role="alert">
      <Flex className="full-width" direction="column" gap={4} align="start">
        <Flex className="full-width" gap={4}>
          {iconVariant[variant]}
          <div className="flex-grow-1">{message}</div>
          <IconButton aria-label="close" onClick={() => closeSnackbar(id)}>
            <Close />
          </IconButton>
        </Flex>
        <div>{body}</div>
      </Flex>
    </SnackbarContent>
  )
})

AdminSnackbar.displayName = 'AdminSnackbar'

export default AdminSnackbar
