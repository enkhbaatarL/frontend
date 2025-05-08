import { useMemo } from 'react'

export type Notice = {
  id: number
  trend: 'up' | 'down'
  title: string
  subtitle: string
  date: string
  isRead: boolean
}

function getRandomTrend(): 'up' | 'down' {
  return Math.random() > 0.5 ? 'up' : 'down'
}

function getRandomSubtitle(trend: 'up' | 'down') {
  const value = (100 + Math.random() * 50).toFixed(2)

  return `${trend === 'up' ? '상승' : '하락'} ${value}$/MMbtu`
}

function getRandomDate(offset: number) {
  const date = new Date()

  date.setDate(date.getDate() - offset)

  return date.toISOString().slice(0, 10)
}

export default function useMockNotice(count = 20): Notice[] {
  const notices = useMemo(() => {
    const list = Array.from({ length: count }, (_, i) => {
      const trend = getRandomTrend()

      return {
        id: i + 1,
        trend,
        title: 'DRAM Price Index',
        subtitle: getRandomSubtitle(trend),
        date: getRandomDate(i),
        isRead: Math.random() > 0.5,
      }
    })

    // 🔽 Sắp xếp chưa đọc lên trước
    list.sort((a, b) => Number(a.isRead) - Number(b.isRead))

    return list
  }, [count])

  return notices
}
