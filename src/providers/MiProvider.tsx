import { SnackbarProvider } from 'notistack'
import { ReactNode } from 'react'

import AxiosErrorHandler from '@/components/common/AxiosErrorHandler'

interface MiProviderProps {
  children: ReactNode
}

const MiProvider = ({ children }: MiProviderProps) => (
  <SnackbarProvider
    maxSnack={8}
    autoHideDuration={2000}
    preventDuplicate
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    Components={
      {
        // success: MiSnackbar,
        // error: MiSnackbar,
        // info: MiSnackbar,
        // warning: MiSnackbar,
      }
    }
  >
    <AxiosErrorHandler />
    {children}
  </SnackbarProvider>
)

export default MiProvider
