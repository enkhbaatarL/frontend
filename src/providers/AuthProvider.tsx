import React, { useState, useMemo } from 'react'

import { AuthContext, IUser } from '@/contexts/AuthContext'

const AuthProvider = (props: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null)

  const value = useMemo(
    () => ({
      user,
      setUser,
    }),
    [user, setUser],
  )

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
}

export default AuthProvider
