import dayjs from 'dayjs'
import { useMemo } from 'react'

export type PostStatus = '게시 중' | '게시 안함'
export type PopupUsage = '사용' | '미사용'
export type PinUsage = '사용' | '미사용'

export interface TableRow {
  id: number
  pinned: PinUsage
  popupUsage: PopupUsage
  category: string
  title: string
  author: string
  date: string
  result: string
  status: PostStatus
  target: string[]
}

export const useMockBoardData = (count = 10) => {
  const data: TableRow[] = useMemo(() => {
    const titles = [
      '신규 데이터 라이선스 추가 5',
      '신규 데이터 라이선스 추가 4',
      '신규 데이터 라이선스 추가 3',
      '신규 데이터 라이선스 추가 2',
      '신규 데이터 라이선스 추가 1',
    ]
    const authors = ['관리자 A', '관리자 B', '관리자 C']
    const statusOptions: PostStatus[] = ['게시 중', '게시 안함']
    const popupOptions: PopupUsage[] = ['사용', '미사용']
    const targets = [
      ['SK 실트론', 'SK ON', 'SK 하이닉스', 'SK E&S', 'SK 이노베이션'],
      ['SK 이노베이션'],
      ['SK 실트론', 'SK ON', 'SK 하이닉스', 'SK E&S', 'SK 이노베이션'],
      ['SK 실트론'],
      ['SK ON'],
      ['SK 하이닉스'],
      ['SK E&S'],
    ]

    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      pinned: popupOptions[i === 0 || i === 1 ? 0 : 1],
      popupUsage: popupOptions[i === 0 ? 0 : 1],
      category: '카테고리 A',
      result: '1',
      title: titles[i % titles.length],
      author: authors[i % authors.length],
      date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
      status: statusOptions[i % statusOptions.length],
      target: targets[i % targets.length],
    }))
  }, [count])

  return data
}
