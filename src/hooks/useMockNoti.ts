import { useMemo } from 'react'

interface MockNotiRow {
  type: string
  title: string
  structuredData: string
  notifications: number
}

export const useMockNoti = (): MockNotiRow[] =>
  useMemo(() => {
    const baseRow = {
      type: 'Data',
      title: 'Global Semiconductor Revenue ($B)',
      structuredData: 'Structured Data name 1',
      notifications: 12,
    }

    return [
      {
        type: 'Data',
        title: 'Eye on the tiger: how higher Indian economic growth could impact global energy markets',
        structuredData: 'Structured Data name 1',
        notifications: 12,
      },
      {
        type: 'MI',
        title: 'Eye on the tiger: how higher Indian economic growth could impact global energy markets',
        structuredData: 'Structured Data name 1',
        notifications: 12,
      },
      ...Array.from({ length: 10 }, () => ({ ...baseRow })),
    ]
  }, [])
