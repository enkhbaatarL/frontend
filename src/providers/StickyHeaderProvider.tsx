import { ReactNode, useState, useMemo, useCallback, useRef } from 'react'

import { StickyHeaderContext, StickyHeaderRegisterOptions } from '@/contexts/StickyHeaderContext'

interface StickyHeaderProviderProps {
  children: ReactNode
}

export const StickyHeaderProvider = ({ children }: StickyHeaderProviderProps) => {
  const [stickyHeaderState, setStickyHeaderState] = useState<ReactNode | null>(null)
  const [stickyHeaderOptions, setStickyHeaderOptions] = useState<StickyHeaderRegisterOptions>({})
  const stickyHeaderPresentRef = useRef(false)

  const setStickyHeader = useCallback((header: ReactNode | null, options?: StickyHeaderRegisterOptions) => {
    stickyHeaderPresentRef.current = header !== null
    setStickyHeaderState(header)
    setStickyHeaderOptions(header === null ? {} : (options ?? {}))
  }, [])

  const patchStickyHeaderOptions = useCallback((patch: Partial<StickyHeaderRegisterOptions>) => {
    if (!stickyHeaderPresentRef.current) return
    setStickyHeaderOptions((prev) => ({ ...prev, ...patch }))
  }, [])

  const setStickyHeaderPinMari = useCallback(
    (header: ReactNode | null) => setStickyHeader(header, { pinMariPosition: true }),
    [setStickyHeader],
  )

  const value = useMemo(
    () => ({
      stickyHeader: stickyHeaderState,
      stickyHeaderOptions,
      setStickyHeader,
      patchStickyHeaderOptions,
      setStickyHeaderPinMari,
    }),
    [stickyHeaderState, stickyHeaderOptions, setStickyHeader, patchStickyHeaderOptions, setStickyHeaderPinMari],
  )

  return <StickyHeaderContext.Provider value={value}>{children}</StickyHeaderContext.Provider>
}
