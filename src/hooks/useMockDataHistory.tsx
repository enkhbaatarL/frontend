import { useMemo } from 'react'

export interface TableData {
  month: string
  forecast: number
  actual: number
  m1: number
  m2: number
  m3: number
  error: number
  report: string
}

export const useMockDataHistory = () => {
  const data = useMemo<TableData[]>(
    () => [
      {
        month: '2024-01월',
        forecast: 0,
        actual: 0,
        m1: 0,
        m2: 0,
        m3: 0,
        error: 0,
        report: 'value',
      },
      {
        month: '2024-02월',
        forecast: 10000,
        actual: 9000,
        m1: 9500,
        m2: 9200,
        m3: 9100,
        error: +11.11,
        report: 'value',
      },
      {
        month: '2024-03월',
        forecast: 8500,
        actual: 9500,
        m1: 9000,
        m2: 9200,
        m3: 8900,
        error: -10.53,
        report: 'value',
      },
      {
        month: '2024-04월',
        forecast: 9000,
        actual: 9500,
        m1: 9100,
        m2: 9300,
        m3: 9250,
        error: -5.26,
        report: 'value',
      },
      {
        month: '2024-05월',
        forecast: 9500,
        actual: 9000,
        m1: 9400,
        m2: 9200,
        m3: 9100,
        error: +5.56,
        report: 'value',
      },
      {
        month: '2024-06월',
        forecast: 9500,
        actual: 10500,
        m1: 9800,
        m2: 9700,
        m3: 9600,
        error: -9.52,
        report: 'value',
      },
      {
        month: '2024-07월',
        forecast: 10500,
        actual: 10000,
        m1: 10400,
        m2: 10200,
        m3: 10100,
        error: +5.0,
        report: 'value',
      },
      {
        month: '2024-08월',
        forecast: 9700,
        actual: 9200,
        m1: 9400,
        m2: 9500,
        m3: 9300,
        error: +5.43,
        report: 'value',
      },
      {
        month: '2024-09월',
        forecast: 9200,
        actual: 9500,
        m1: 9000,
        m2: 9100,
        m3: 8900,
        error: -3.16,
        report: 'value',
      },
      {
        month: '2024-10월',
        forecast: 9400,
        actual: 9200,
        m1: 9300,
        m2: 9250,
        m3: 9150,
        error: +2.17,
        report: 'value',
      },
      {
        month: '2024-11월',
        forecast: 10000,
        actual: 10000,
        m1: 10000,
        m2: 10000,
        m3: 10000,
        error: 0,
        report: 'value',
      },
      {
        month: '2024-12월',
        forecast: 11000,
        actual: 10000,
        m1: 10500,
        m2: 10700,
        m3: 10800,
        error: +10.0,
        report: 'value',
      },
      {
        month: '2025-01월',
        forecast: 9000,
        actual: 10000,
        m1: 9500,
        m2: 9700,
        m3: 9400,
        error: -10.0,
        report: 'value',
      },
      {
        month: '2025-02월',
        forecast: 10000,
        actual: 9000,
        m1: 9800,
        m2: 9600,
        m3: 9400,
        error: +11.11,
        report: 'value',
      },
      {
        month: '2025-03월',
        forecast: 10500,
        actual: 10500,
        m1: 10500,
        m2: 10400,
        m3: 10300,
        error: 0,
        report: 'value',
      },
      {
        month: '2025-04월',
        forecast: 10200,
        actual: 10000,
        m1: 10100,
        m2: 10200,
        m3: 10000,
        error: +2.0,
        report: 'value',
      },
    ],
    [],
  )

  return { data }
}
