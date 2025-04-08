import { SnackbarProvider } from 'notistack'
import { ReactNode, useState, useMemo } from 'react'

import AdminSnackbar from '@/components/admin/AdminSnackbar'
import AxiosErrorHandler from '@/components/common/AxiosErrorHandler'
import { AdminHeaderContext } from '@/contexts/AdminHeaderContext'
import { Nullable } from '@/types/common'

const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [customComponent, setCustomComponent] = useState<Nullable<ReactNode>>(null)

  const value = useMemo(() => ({ customComponent, setCustomComponent }), [customComponent])

  return (
    <AdminHeaderContext.Provider value={value}>
      <SnackbarProvider
        maxSnack={8}
        autoHideDuration={2000}
        preventDuplicate
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        Components={{
          success: AdminSnackbar,
          error: AdminSnackbar,
          info: AdminSnackbar,
          warning: AdminSnackbar,
        }}
      >
        <AxiosErrorHandler />
        {children}
      </SnackbarProvider>
    </AdminHeaderContext.Provider>
  )
}

export default AdminProvider
