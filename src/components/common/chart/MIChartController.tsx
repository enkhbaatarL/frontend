import { Box } from '@mui/material'
import { useState } from 'react'

import MIChartMAToggle from './MIChartMAToggle'
import MIChartViewToggle from './MIChartViewToogle'
import CandlestickChartOutlineIcon from '../icons/CandlestickChartOutlineIcon'
import ShowChartIcon from '../icons/ShowChartIcon'

import MIButton from '@/components/common/button/MIButton'

export default function MIChartContrller() {
  const options = [
    {
      value: 'line',
      label: 'Line',
      icon: <ShowChartIcon />,
    },
    {
      value: 'candles',
      label: 'Candles',
      icon: <CandlestickChartOutlineIcon />,
    },
  ]

  const [selectedChart, setSelectedChart] = useState(options[0])

  const [selectedUnit, setSelectedUnit] = useState({
    value: 'mmBtu',
    label: 'MMBtu',
  })
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
          onChange={(option) => {
            const matchedOption = options.find((opt) => opt.value === option.value)

            if (matchedOption) {
              setSelectedChart(matchedOption)
            }
          }}
          options={options.map(({ icon, value, label }) => ({ icon, value, label }))}
          minWidth="130px"
        />
        <MIButton
          type={'ghost'}
          color={'gray'}
          contentType={'select'}
          valueSelect={selectedUnit}
          onChange={(option) => setSelectedUnit(option)}
          options={[
            {
              value: 'm3',
              label: 'm3', ///
              // (
              //   <span>
              //     m<sup>3</sup>
              //   </span>
              // ),
            },
            {
              value: 'mmBtu',
              label: 'MMBtu',
            },
            {
              value: 'cf',
              label: 'cf',
            },
            {
              value: 'bcf',
              label: 'Bcf',
            },
            {
              value: 'tcf',
              label: 'Tcf',
            },
            {
              value: 'mt',
              label: 'mt',
            },
          ]}
          minWidth="95px"
        />
      </Box>
    </Box>
  )
}
