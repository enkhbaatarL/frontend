import { Box } from '@mui/material'
import { Dispatch, SetStateAction, useMemo } from 'react'

import MIChartViewToggle from './MIChartViewToogle'
import CandlestickChartOutlineIcon from '../icons/CandlestickChartOutlineIcon'
import ShowChartIcon from '../icons/ShowChartIcon'

import MIButton from '@/components/common/button/MIButton'
import { DisplayDataInfo } from '@/components/common/chart/MIChart'
import MIChip, { MIChipProps } from '@/components/common/chip/MIChip'
import { IProductDataStructuredChartRequest } from '@/service/mi/dataDetail'
import { ChartInterval, ChartType } from '@/types/dataDetailChart'

interface MIChartControllerProps {
  chartType: ChartType
  setChartType: Dispatch<SetStateAction<ChartType>>
  isCandlestick?: boolean
  unitList: string[] | null
  chartInterval: ChartInterval
  setChartInterval: Dispatch<SetStateAction<ChartInterval>>
  chartIntervalOptions: { label: string; value: string }[]
  searchFilter: IProductDataStructuredChartRequest
  setSearchFilter: Dispatch<SetStateAction<IProductDataStructuredChartRequest>>
  displayDataInfo?: DisplayDataInfo
  onDisplayDataInfoChange?: (value: { label: string; isShow: boolean }) => void
}

export default function MIChartController({
  chartType,
  setChartType,
  isCandlestick = false,
  unitList,
  chartInterval,
  setChartInterval,
  chartIntervalOptions,
  searchFilter,
  setSearchFilter,
  displayDataInfo,
  onDisplayDataInfoChange,
}: Readonly<MIChartControllerProps>) {
  const chartTypeOptions = useMemo(() => {
    const options = [
      {
        value: ChartType.LINE,
        label: 'Line',
        icon: <ShowChartIcon />,
      },
    ]

    if (isCandlestick) {
      options.push({
        value: ChartType.CANDLE,
        label: 'Candles',
        icon: <CandlestickChartOutlineIcon />,
      })
    }

    return options
  }, [isCandlestick])

  const selectedChart = useMemo(
    () => chartTypeOptions.find((option) => option.value === chartType) ?? chartTypeOptions[0],
    [chartType, chartTypeOptions],
  )

  return (
    <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
      <Box display={'flex'} alignItems={'center'} gap={'10px'}>
        <MIButton
          type={'ghost'}
          color={'gray'}
          valueSelect={chartIntervalOptions.find((option) => option.value === chartInterval) ?? chartIntervalOptions[0]}
          contentType={'select'}
          onChange={({ value }) => setChartInterval(value as ChartInterval)}
          options={chartIntervalOptions}
          minWidth={84}
        />
        <Box display={'flex'} gap={'6px'}>
          <MIChartViewToggle
            label="BB"
            onChange={(value) => {
              onDisplayDataInfoChange?.(value)
            }}
          />
          <MIChartViewToggle
            label="MA"
            value={Object.values(displayDataInfo?.MA ?? {}).some((value) => value)}
            onChange={(value) => {
              onDisplayDataInfoChange?.(value)
            }}
          />
        </Box>

        <Box display={'flex'} gap={'4px'} sx={{ cursor: 'pointer' }}>
          {[
            { label: 'MA5', color: 'green' },
            { label: 'MA20', color: 'pink' },
            { label: 'MA60', color: 'orange' },
            { label: 'MA120', color: 'purple' },
          ].map(({ label, color }) => (
            <MIChip
              key={label}
              label={label.replace('MA', '')}
              color={color as MIChipProps['color']}
              type={displayDataInfo?.MA[label] ? 'filled' : 'outlined'}
              onClick={() => onDisplayDataInfoChange?.({ label, isShow: !displayDataInfo?.MA[label] })}
              disableHover
            />
          ))}
        </Box>
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
        {unitList && (
          <MIButton
            type={'ghost'}
            color={'gray'}
            contentType={'select'}
            valueSelect={{
              value: searchFilter.unitCd ?? '',
              label: searchFilter.unitCd?.split('#').at(-1) ?? '',
            }}
            onChange={({ value }) => {
              setSearchFilter((prev) => ({ ...prev, unitCd: value }))
            }}
            options={
              unitList?.map((unit) => ({
                value: unit,
                label: unit?.split('#').at(-1) ?? unit ?? '',
              })) ?? []
            }
            minWidth="95px"
          />
        )}
      </Box>
    </Box>
  )
}
