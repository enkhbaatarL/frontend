import LocalSeeOutlinedIcon from '@mui/icons-material/LocalSeeOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import { Box, Grid2 as Grid, Stack, Switch, Tooltip, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MIChart from '@/components/common/chart/MIChart'
import MIChartController from '@/components/common/chart/MIChartController'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import SettingModalComponent from '@/pages/mi/dataDetail/components/SettingModalComponent'
import dataDetailService, { IProductDataStructuredChartRequest, IProductDataStructuredData } from '@/service/mi/dataDetail'
import { ChartRange, ChartType } from '@/types/dataDetailChart'

interface ChartComponentProps {
  goodsNo: number
  goodsDataNo: number
  goodsDataSourceNo?: number
  setGoodsDataSourceNo: Dispatch<SetStateAction<number | undefined>>
  structuredDataList?: IProductDataStructuredData[]
  modifyDt?: string
}

const ChartComponent = ({
  goodsNo,
  goodsDataNo,
  goodsDataSourceNo,
  setGoodsDataSourceNo,
  structuredDataList,
  modifyDt,
}: ChartComponentProps) => {
  const [chartType, setChartType] = useState<ChartType>(ChartType.LINE)
  const [isInitialState, setIsInitialState] = useState(true)
  const [searchFilter, setSearchFilter] = useState<IProductDataStructuredChartRequest>({
    range: ChartRange.MONTH,
  })

  const selectedDataSource = useMemo(
    () => structuredDataList?.find((item) => item.goodsDataSourceNo === goodsDataSourceNo),
    [goodsDataSourceNo, structuredDataList],
  )

  const selectedDataSourceOption = useMemo(
    () => ({
      label: selectedDataSource?.goodsDataSourceNm ?? '',
      value: String(selectedDataSource?.goodsDataSourceNo ?? 0),
    }),
    [selectedDataSource],
  )

  const { data: chartData } = useQuery({
    queryKey: ['productDataStructuredChartData', goodsNo, goodsDataNo, goodsDataSourceNo],
    queryFn: () => dataDetailService.getProductDataStructuredChartData(goodsNo, goodsDataNo, goodsDataSourceNo!, {}),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!goodsDataSourceNo,
  })

  useEffect(() => {
    if (chartData && isInitialState) {
      setSearchFilter({
        interval: chartData.metadata.currentInterval,
        unitCd: chartData.metadata.currentUnitCd,
      })
      setChartType(chartData.metadata.initialChartType)
      setIsInitialState(false)
    }
  }, [chartData, isInitialState, searchFilter])

  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [timeRangeSelected, setTimeRangeSelected] = useState<string>('')
  const [isOpenSetting, setIsOpenSetting] = useState(false)

  const timeRanges = [
    { label: '1 Week', value: '1w' },
    { label: '1 Month', value: '1m' },
    { label: '3 Months', value: '3m' },
    { label: '6 Months', value: '6m' },
    { label: '1 Year', value: '1y' },
    { label: '2 Year', value: '2y' },
    { label: 'Custom', value: 'custom' },
  ]

  const handleDateChange = ({ startDate, endDate }: { startDate?: Dayjs; endDate?: Dayjs }) => {
    setStartDate(startDate?.format('YYYYMMDD') ?? '')
    setEndDate(endDate?.format('YYYYMMDD') ?? '')
  }
  const handleSelectTimeRange = useCallback((value: string) => {
    setTimeRangeSelected((prev) => (prev === value ? '' : value))
  }, [])

  return (
    <>
      <Box borderRadius={1} maxWidth={'100%'} border={'1px solid'} borderColor={'gray.30'}>
        {/*Chart header*/}
        <Grid
          px={3}
          py={2.5}
          container
          gap={2.5}
          justifyContent={'space-between'}
          alignItems={'center'}
          borderBottom={'1px solid'}
          borderColor={'gray.30'}
        >
          <MIButton
            contentType={'select'}
            onChange={({ value }) => setGoodsDataSourceNo(Number(value))}
            type={'ghost'}
            color={'gray'}
            minWidth={150}
            valueSelect={selectedDataSourceOption}
            options={(structuredDataList ?? []).map(({ goodsDataSourceNm, goodsDataSourceNo }) => ({
              label: goodsDataSourceNm,
              value: String(goodsDataSourceNo),
            }))}
          />

          <MIButton
            toolTip={'알람 등록'}
            color={'gray'}
            type={'outlined'}
            contentType={'icon'}
            startIcon={<NotificationsNoneIcon fontSize={'small'} />}
          />

          <MIButton
            toolTip={'그래프 다운로드'}
            color={'gray'}
            type={'outlined'}
            contentType={'icon'}
            startIcon={<LocalSeeOutlinedIcon fontSize={'small'} />}
          />

          <Tooltip title={'그래프 설정 초기화'}>
            <Stack direction="row" alignItems="center" sx={{ ml: 'auto' }}>
              <Switch
                checked={isOpenSetting}
                onChange={(e) => {
                  e.preventDefault()
                  setIsOpenSetting(e.target.checked)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setIsOpenSetting((prev) => !prev)
                }}
              />
              <Typography variant="body2M14" color={'gray.70'} onClick={(e) => e.stopPropagation()}>
                Save last setting
              </Typography>
            </Stack>
          </Tooltip>
        </Grid>

        {/*Chart content*/}
        <Box display={'flex'} maxWidth={'100%'} flexDirection={'column'} p={5} height={'700px'} sx={{ boxSizing: 'border-box' }}>
          <MIChartController
            chartType={chartType}
            setChartType={setChartType}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            unitList={chartData?.metadata.changeableUnitCd ?? []}
          />
          <MIChart
            height={'100%'}
            chartType={chartType}
            mainData={{
              data: chartData?.mainChart,
              unit: chartData?.mainChart.unitCd ?? '',
            }}
            indicators={chartData?.indicators}
            comparisonCharts={chartData?.comparisonCharts}
          />
        </Box>

        {/*Chart footer*/}
        <Grid
          px={3}
          py={2.5}
          container
          justifyContent={'space-between'}
          alignItems={'center'}
          borderTop={'1px solid'}
          borderColor={'gray.30'}
          minHeight={51}
        >
          {timeRanges.map((item, index) => (
            <MIButton
              active={timeRangeSelected === item.value}
              onClick={() => handleSelectTimeRange(item.value)}
              key={index}
              color={'gray'}
              type={'ghost'}
              size={'h28'}
            >
              {item.label}
            </MIButton>
          ))}
          {timeRangeSelected === 'custom' && (
            <Grid container maxWidth={357} wrap={'nowrap'} alignItems={'center'} direction={'row'} ml={2.5} gap={2.5}>
              <MIDateRangePicker sizeInput={'h26'} onChange={handleDateChange} />
              <MIButton onClick={() => console.log(startDate, endDate)} size={'h28'}>
                확인
              </MIButton>
            </Grid>
          )}
          {modifyDt && (
            <Typography ml={'auto'} variant={'body3M12'} color={'gray.60'}>
              Updated Date : {dayjs(modifyDt).format('YYYY-MM-DD')}
            </Typography>
          )}
        </Grid>
      </Box>

      <SettingModalComponent open={isOpenSetting} onClose={() => setIsOpenSetting(false)} />
    </>
  )
}

export default ChartComponent
