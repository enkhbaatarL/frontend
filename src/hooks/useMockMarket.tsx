import { useMemo } from 'react'

export interface TableData {
  id: string
  dataProvider: string
  dataName: string
  description: string
  lastUpdated: string
}

export const useMockMarket = () => {
  const data = useMemo<TableData[]>(
    () => [
      {
        id: '1',
        dataProvider: 'LSEG 1',
        dataName: 'Global Semiconductor Revenue ($B)',
        description: 'Global Semiconductor Revenue ($B)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '2',
        dataProvider: 'LSEG 2',
        dataName: 'DRAM ASP ($ per Gb)',
        description: 'DRAM ASP ($ per Gb)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '3',
        dataProvider: 'LSEG 3',
        dataName: 'NAND ASP ($ per Gb)',
        description: 'NAND ASP ($ per Gb)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '4',
        dataProvider: 'LSEG 4',
        dataName: '12-inch Wafer Price ($ per Wafer)',
        description: '12-Inch Wafer Price ($ per Wafer)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '5',
        dataProvider: 'LSEG 5',
        dataName: 'Fab Utilization Rate (%)',
        description: 'Fab Utilization Rate (%)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '6',
        dataProvider: 'Bloomberg',
        dataName: 'Foundry Market Share (TSMC, Samsung, etc)',
        description: 'Foundry Market Share (TSMC, Samsung, etc)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '7',
        dataProvider: 'Bloomberg',
        dataName: 'Semiconductor Equipment Spending ($B)',
        description: 'Semiconductor Equipment Spending ($B)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '8',
        dataProvider: 'Bloomberg',
        dataName: 'Semiconductor Inventory Index',
        description: 'Semiconductor Inventory Index',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '9',
        dataProvider: 'Bloomberg',
        dataName: '8-Inch Wafer Price ($ per Wafer)',
        description: '8-Inch Wafer Price ($ per Wafer)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '10',
        dataProvider: 'Bloomberg',
        dataName: 'Fab Utilization Rate (Bloomberg)',
        description: 'Fab Utilization Rate (%)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        id: '11',
        dataProvider: 'Bloomberg',
        dataName: 'Foundry Market Share (Updated)',
        description: 'Foundry Market Share (TSMC, Samsung, etc)',
        lastUpdated: '2025-04-26 12:00:00',
      },
    ],
    [],
  )

  return { data }
}
