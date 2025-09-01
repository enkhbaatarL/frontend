import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { ActionButton } from '@/components/common/confirm/MIConfirm'

interface DialogContentState {
  title: React.ReactNode
  children?: React.ReactNode
  width?: string | number
  justifyContentAction?: 'space-between' | 'end' | 'start' | 'center'
  actions?: ActionButton[]
  hideFooter?: boolean
  zIndex?: number
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
          const item = localStorage.getItem(name)
          return item ? JSON.parse(item) : null
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
)

export default useDialog
