import { ReactNode, useState, useMemo } from 'react'

import { AdminHeaderContext } from '@/contexts/AdminHeaderContext'

const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [customComponent, setCustomComponent] = useState<ReactNode | null>(null)

  const value = useMemo(() => ({ customComponent, setCustomComponent }), [customComponent])

  return <AdminHeaderContext.Provider value={value}>{children}</AdminHeaderContext.Provider>
}

export default AdminProvider
