import { useMemo } from 'react'

export interface TableData {
  dataProvider: string
  dataName: string
  description: string
  lastUpdated: string
}

export const useMockMarket = () => {
  const data = useMemo<TableData[]>(
    () => [
      {
        dataProvider: 'LSEG',
        dataName: 'Global Semiconductor Revenue ($B)',
        description: 'Global Semiconductor Revenue ($B)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'LSEG',
        dataName: 'DRAM ASP ($ per Gb)',
        description: 'DRAM ASP ($ per Gb)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'LSEG',
        dataName: 'NAND ASP ($ per Gb)',
        description: 'NAND ASP ($ per Gb)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'LSEG',
        dataName: '12-inch Wafer Price ($ per Wafer)',
        description: '12-Inch Wafer Price ($ per Wafer)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'LSEG',
        dataName: 'Fab Utilization Rate (%)',
        description: 'Fab Utilization Rate (%)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'Bloomberg',
        dataName: 'Foundry Market Share (TSMC, Samsung, etc)',
        description: 'Foundry Market Share (TSMC, Samsung, etc)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'Bloomberg',
        dataName: 'Semiconductor Equipment Spending ($B)',
        description: 'Semiconductor Equipment Spending ($B)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'Bloomberg',
        dataName: 'Semiconductor Inventory Index',
        description: 'Semiconductor Inventory Index',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'Bloomberg',
        dataName: '8-Inch Wafer Price ($ per Wafer)',
        description: '8-Inch Wafer Price ($ per Wafer)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'Bloomberg',
        dataName: 'Fab Utilization Rate (%)',
        description: 'Fab Utilization Rate (%)',
        lastUpdated: '2025-04-26 12:00:00',
      },
      {
        dataProvider: 'Bloomberg',
        dataName: 'Foundry Market Share (TSMC, Samsung, etc)',
        description: 'Foundry Market Share (TSMC, Samsung, etc)',
        lastUpdated: '2025-04-26 12:00:00',
      },
    ],
    [],
  )

  return { data }
}
