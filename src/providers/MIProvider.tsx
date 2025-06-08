import { SnackbarProvider } from 'notistack'
import { ReactNode } from 'react'

import AxiosErrorHandler from '@/components/common/AxiosErrorHandler'
import MISnackbar from '@/components/common/snackbar/MISnackbar'

interface MIProviderProps {
  children: ReactNode
}

const MIProvider = ({ children }: MIProviderProps) => (
  <SnackbarProvider
    maxSnack={8}
    autoHideDuration={2000}
    preventDuplicate
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    Components={{
      success: MISnackbar,
      error: MISnackbar,
      info: MISnackbar,
      warning: MISnackbar,
    }}
    classes={{
      containerRoot: 'mi-snackbar',
    }}
  >
    <AxiosErrorHandler />
    {children}
  </SnackbarProvider>
)

export default MIProvider
