import { Box } from '@mui/material'
import { useState } from 'react'

import MIChip, { MIChipProps } from '../chip/MIChip'

export default function MIChartMAToggle() {
  const [mas, setMas] = useState<Array<Record<string, string | boolean>>>([
    {
      label: '5',
      isShow: false,
      color: 'green',
    },
    {
      label: '20',
      isShow: false,
      color: 'red',
    },
    {
      label: '60',
      isShow: false,
      color: 'orange',
    },
    {
      label: '120',
      isShow: false,
      color: 'purple',
    },
  ])

  const toggle = (label: string) => {
    const cloneListMA = [...mas]

    cloneListMA.forEach((item) => {
      if (item.label === label) {
        item.isShow = !item.isShow
      }
    })

    setMas(cloneListMA)
  }

  return (
    <Box display={'flex'} gap={'4px'} sx={{ cursor: 'pointer' }}>
      {mas.map((ma) => (
        <MIChip
          key={ma.label as string}
          label={ma.label}
          color={ma.color as MIChipProps['color']}
          type={ma.isShow ? 'filled' : 'outlined'}
          onClick={() => toggle(ma.label as string)}
        />
      ))}
    </Box>
  )
}
