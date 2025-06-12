import { SnackbarProvider } from 'notistack'
import { ReactNode, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import AxiosErrorHandler from '@/components/common/AxiosErrorHandler'
import MISnackbar from '@/components/common/snackbar/MISnackbar'
import { AdminHeaderContext } from '@/contexts/AdminHeaderContext'
import useAuthStore from '@/store/useAuthStore'
import { Nullable } from '@/types/common'

const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [customComponent, setCustomComponent] = useState<Nullable<ReactNode>>(null)
  const [subHeader, setSubHeader] = useState<Nullable<ReactNode>>(null)
  const [customTitle, setCustomTitle] = useState<Nullable<ReactNode>>(null)

  const navigate = useNavigate()
  const { user } = useAuthStore()

  if (user?.userRoleCd === 'USER') {
    navigate('/mi')
  }

  const value = useMemo(
    () => ({ customComponent, setCustomComponent, subHeader, setSubHeader, customTitle, setCustomTitle }),
    [customComponent, customTitle, subHeader],
  )

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
          success: MISnackbar,
          error: MISnackbar,
          info: MISnackbar,
          warning: MISnackbar,
        }}
      >
        <AxiosErrorHandler />
        {children}
      </SnackbarProvider>
    </AdminHeaderContext.Provider>
  )
}

export default AdminProvider
