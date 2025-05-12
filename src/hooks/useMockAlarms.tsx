import { useMemo } from 'react'

export interface alarmProp {
  id: string
  title: string
  dataName: string
  numberData: number
  status: 'increase' | 'decrease'
  value: string
}
export const useMockAlarms = () =>
  useMemo<alarmProp[]>(
    () => [
      {
        id: '1',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 10,
        status: 'increase',
        value: '상승',
      },
      {
        id: '2',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 10,
        status: 'increase',
        value: '상승',
      },
      {
        id: '3',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 20,
        status: 'increase',
        value: '상승',
      },
      {
        id: '4',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 3,
        status: 'decrease',
        value: '하락',
      },
      {
        id: '5',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 5,
        status: 'decrease',
        value: '하락',
      },
      {
        id: '6',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 20,
        status: 'decrease',
        value: '하락',
      },
      {
        id: '7',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 20,
        status: 'decrease',
        value: '하락',
      },
      {
        id: '8',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 20,
        status: 'decrease',
        value: '하락',
      },
      {
        id: '9',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 20,
        status: 'decrease',
        value: '하락',
      },
      {
        id: '10',
        title: '번호롤',
        dataName: '선택한정형데이터명',
        numberData: 20,
        status: 'decrease',
        value: '하락',
      },
    ],
    [],
  )
