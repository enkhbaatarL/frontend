import { ReactNode } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { ActionButton } from '@/components/common/confirm/MIConfirm'

interface DialogContentState {
  title: ReactNode
  children?: ReactNode
  width?: string | number
  justifyContentAction?: 'space-between' | 'end' | 'start' | 'center'
  actions?: ActionButton[]
  hideFooter?: boolean
  zIndex?: number
  disableClose?: boolean
}
interface DialogState {
  visible: boolean
  dialog: DialogContentState | null
  onShow: (dialog: DialogContentState) => void
  onHide: () => void
}
const useDialog = create<DialogState>()(
  persist(
    (set) => ({
      visible: false,
      dialog: null,
      onShow: (dialog) => set({ visible: true, dialog }),
      onHide: () => set({ visible: false, dialog: null }),
      onConfirm: () => set({ visible: false, dialog: null }),
    }),
    {
      name: 'dialog-storage',
      storage: {
        getItem: (name) => {
          const item = sessionStorage.getItem(name)
          return item ? JSON.parse(item) : null
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    },
  ),
)

export default useDialog
