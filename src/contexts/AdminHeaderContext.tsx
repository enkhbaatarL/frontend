import { createContext, useContext, ReactNode } from 'react'

interface IAdminHeaderContext {
  setCustomComponent: (component: ReactNode) => void
  customComponent: ReactNode | null
  setSubHeader: (component: ReactNode) => void
  subHeader: ReactNode | null
  setCustomTitle: (component: ReactNode) => void
  customTitle: ReactNode | null
}

export const AdminHeaderContext = createContext<IAdminHeaderContext>({
  setCustomComponent: () => {},
  customComponent: null,
  setSubHeader: () => {},
  subHeader: null,
  setCustomTitle: () => {},
  customTitle: null,
})

export const useAdminHeader = () => {
  const context = useContext(AdminHeaderContext)

  if (!context) {
    throw new Error('useAdminHeader must be used within AdminHeaderProvider')
  }

  return context
}
