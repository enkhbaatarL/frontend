import { createContext, Dispatch, useContext, SetStateAction } from 'react'

import { UserRole } from '@/service/admin/members'

export interface IUser {
  role: UserRole
  userNo: string | null
  userNm: string | null
  companyNm: string | null
  departmentNm: string | null
}

export const AuthContext = createContext<{
  user: IUser | null
  setUser: Dispatch<SetStateAction<IUser | null>>
} | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
