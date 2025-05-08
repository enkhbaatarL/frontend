import { useMemo } from 'react'

export interface EventData {
  id: number
  title: string
  subtitle: string
  location: string
  date: string
}

export const useMockEvents = () => {
  const dataEvent = useMemo<EventData[]>(
    () => [
      {
        id: 1,
        title: 'CERA Week',
        subtitle: 'Influential gathering of global energy leaders',
        location: 'Houston, USA',
        date: 'March 10-14',
      },
      {
        id: 2,
        title: '7th Global LNG Forum',
        subtitle: 'Leading Europe-based LNG event',
        location: 'Barcelona, Spain',
        date: 'April 7-8',
      },
      {
        id: 3,
        title: 'Flame Conference',
        subtitle: 'Major European gas and LNG conference',
        location: 'Amsterdam, Netherlands',
        date: 'May 13-15',
      },
      {
        id: 4,
        title: 'World Gas Conference 2025',
        subtitle: 'Global gas industry gathering',
        location: 'Beijing, China',
        date: 'May 19-23',
      },
      {
        id: 5,
        title: 'Japan Energy Summit',
        subtitle: 'Key event for energy sector in Japan',
        location: 'Tokyo, Japan',
        date: 'June 18-20',
      },
    ],
    [],
  )

  return { dataEvent }
}
