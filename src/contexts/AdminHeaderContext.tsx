import { createContext, useContext, ReactNode } from 'react'

interface IAdminHeaderContext {
  setCustomComponent: (component: ReactNode) => void
  customComponent: ReactNode | null
}

export const AdminHeaderContext = createContext<IAdminHeaderContext>({
  setCustomComponent: () => {},
  customComponent: null,
})

export const useAdminHeader = () => {
  const context = useContext(AdminHeaderContext)

  if (!context) {
    throw new Error('useAdminHeader must be used within AdminHeaderProvider')
  }

  return context
}
