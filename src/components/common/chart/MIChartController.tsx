import { Box } from '@mui/material'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import MIChartMAToggle from './MIChartMAToggle'
import MIChartViewToggle from './MIChartViewToogle'
import CandlestickChartOutlineIcon from '../icons/CandlestickChartOutlineIcon'
import ShowChartIcon from '../icons/ShowChartIcon'

import MIButton from '@/components/common/button/MIButton'
import { IProductDataStructuredChartRequest } from '@/service/mi/dataDetail'
import { ChartType } from '@/types/dataDetailChart'

interface MIChartControllerProps {
  chartType: ChartType
  setChartType: Dispatch<SetStateAction<ChartType>>
  unitList: string[]
  searchFilter: IProductDataStructuredChartRequest
  setSearchFilter: Dispatch<SetStateAction<IProductDataStructuredChartRequest>>
}

const chartTypeOptions = [
  {
    value: ChartType.LINE,
    label: 'Line',
    icon: <ShowChartIcon />,
  },
  {
    value: ChartType.CANDLE,
    label: 'Candles',
    icon: <CandlestickChartOutlineIcon />,
  },
]

export default function MIChartController({
  chartType,
  setChartType,
  unitList,
  searchFilter,
  setSearchFilter,
}: Readonly<MIChartControllerProps>) {
  const unitOptions = unitList.map((unit) => ({
    value: unit,
    label: unit,
  }))

  const selectedChart = useMemo(() => chartTypeOptions.find((option) => option.value === chartType) ?? chartTypeOptions[0], [chartType])

  const [selectedTime, setSelectedTime] = useState({
    value: 'day',
    label: '1 day',
  })

  return (
    <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
      <Box display={'flex'} alignItems={'center'} gap={'10px'}>
        <MIButton
          type={'ghost'}
          color={'gray'}
          valueSelect={selectedTime}
          contentType={'select'}
          onChange={(option) => setSelectedTime(option)}
          options={[
            {
              value: 'day',
              label: '1 day',
            },
            {
              value: 'week',
              label: '1 week',
            },
            {
              value: 'month',
              label: '1 month',
            },
          ]}
          minWidth={84}
        />
        <Box display={'flex'} gap={'6px'}>
          <MIChartViewToggle label="BB" />
          <MIChartViewToggle label="MA" />
        </Box>

        <MIChartMAToggle />
      </Box>
      <Box display={'flex'} alignItems={'center'} gap={'10px'}>
        <MIButton
          type={'ghost'}
          color={'gray'}
          valueSelect={selectedChart}
          startIcon={selectedChart.icon}
          contentType={'select'}
          onChange={({ value }) => {
            setChartType(value as ChartType)
          }}
          options={chartTypeOptions}
          minWidth="130px"
        />
        <MIButton
          type={'ghost'}
          color={'gray'}
          contentType={'select'}
          valueSelect={{
            value: searchFilter.unitCd ?? '',
            label: searchFilter.unitCd ?? '',
          }}
          onChange={({ value }) => {
            setSearchFilter((prev) => ({ ...prev, unitCd: value }))
          }}
          options={unitOptions}
          minWidth="95px"
        />
      </Box>
    </Box>
  )
}
