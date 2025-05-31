import LocalSeeOutlinedIcon from '@mui/icons-material/LocalSeeOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import { Box, CircularProgress, Grid2 as Grid, Stack, Switch, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MIChart, { DisplayDataInfo } from '@/components/common/chart/MIChart'
import MIChartController from '@/components/common/chart/MIChartController'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import SettingModalComponent from '@/pages/mi/dataDetail/components/SettingModalComponent'
import { UserRole } from '@/service/admin/members'
import dataDetailService, { IProductDataStructuredChartRequest, IProductDataStructuredData } from '@/service/mi/dataDetail'
import useAuthStore from '@/store/useAuthStore'
import { ChartInterval, ChartRange, ChartType } from '@/types/dataDetailChart'

interface ChartComponentProps {
  goodsNo: number
  goodsDataNo: number
  goodsDataSourceNo?: number
  setGoodsDataSourceNo: Dispatch<SetStateAction<number | undefined>>
  structuredDataList?: IProductDataStructuredData[]
  isDownloadable?: boolean
}

const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  [ChartRange.WEEK]: '1 Week',
  [ChartRange.MONTH]: '1 Month',
  [ChartRange.THREE_MONTHS]: '3 Months',
  [ChartRange.SIX_MONTHS]: '6 Months',
  [ChartRange.YEAR]: '1 Year',
  [ChartRange.TWO_YEARS]: '2 Year',
  [ChartRange.CUSTOM]: 'Custom',
}

const INTERVAL_LABELS: Record<ChartInterval, string> = {
  [ChartInterval.DAY]: '1 day',
  [ChartInterval.WEEK]: '1 week',
  [ChartInterval.TWO_WEEKS]: '2 week',
  [ChartInterval.MONTH]: '1 month',
  [ChartInterval.THREE_MONTHS]: '3 months',
  [ChartInterval.SIX_MONTHS]: '6 months',
  [ChartInterval.YEAR]: '1 year',
}

const ChartComponent = ({
  goodsNo,
  goodsDataNo,
  goodsDataSourceNo,
  setGoodsDataSourceNo,
  structuredDataList,
  isDownloadable,
}: ChartComponentProps) => {
  const miChartRef = useRef<HTMLCanvasElement | null>(null)

  const [searchFilter, setSearchFilter] = useState<IProductDataStructuredChartRequest>({})
  const [useSaveLastSetting, setUseSaveLastSetting] = useState(false)

  const [chartType, setChartType] = useState<ChartType>(ChartType.LINE)
  const [isInitialState, setIsInitialState] = useState(true)

  const [displayDataInfo, setDisplayDataInfo] = useState<DisplayDataInfo>({
    BB: true,
    MA: {
      MA5: true,
      MA20: true,
      MA60: true,
      MA120: true,
    },
  })

  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'year').format('YYYYMMDD'))
  const [endDate, setEndDate] = useState(dayjs().format('YYYYMMDD'))
  const [isOpenSetting, setIsOpenSetting] = useState(false)

  const selectedDataSource = useMemo(
    () => structuredDataList?.find((item) => item.goodsDataSourceNo === goodsDataSourceNo),
    [goodsDataSourceNo, structuredDataList],
  )

  const { user } = useAuthStore()

  const selectedDataSourceOption = useMemo(
    () => ({
      label: selectedDataSource?.goodsDataSourceNm ?? '',
      value: String(selectedDataSource?.goodsDataSourceNo ?? 0),
    }),
    [selectedDataSource],
  )

  const { data: chartMetaData } = useQuery({
    queryKey: ['productDataStructuredChartMetaData', goodsNo, goodsDataNo, goodsDataSourceNo],
    queryFn: () => dataDetailService.getProductDataStructuredChartMetaData(goodsNo, goodsDataNo, goodsDataSourceNo!),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!goodsDataSourceNo,
  })

  const { data: chartData, isLoading } = useQuery({
    queryKey: [
      'productDataStructuredChartData',
      goodsNo,
      goodsDataNo,
      searchFilter.goodsDataSourceNo,
      searchFilter.interval,
      searchFilter.range,
      startDate,
      endDate,
      searchFilter.unitCd,
    ],
    queryFn: () =>
      dataDetailService.getProductDataStructuredChartData(goodsNo, goodsDataNo, searchFilter.goodsDataSourceNo!, {
        range: searchFilter.range,
        interval: searchFilter.interval,
        ...(searchFilter.range === ChartRange.CUSTOM && { startDate, endDate }),
        unitCd: searchFilter.unitCd,
      }),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !isInitialState,
  })

  const chartIntervalOptions = useMemo(
    () =>
      selectedDataSource?.allowedPeriods
        .find((item) => item.range === searchFilter.range)
        ?.intervals.map((interval) => ({
          value: interval,
          label: INTERVAL_LABELS[interval],
        })) ?? [],
    [selectedDataSource, searchFilter.range],
  )

  const handleDateChange = ({ startDate, endDate }: { startDate?: Dayjs; endDate?: Dayjs }) => {
    setStartDate(startDate?.format('YYYYMMDD') ?? '')
    setEndDate(endDate?.format('YYYYMMDD') ?? '')
  }

  const handleRangeChange = (range: ChartRange) => {
    const newInterval = selectedDataSource?.allowedPeriods.find((item) => item.range === range)?.defaultInterval ?? ChartInterval.DAY
    setSearchFilter((prev) => ({
      ...prev,
      range,
      interval: newInterval,
      startDate: range === ChartRange.CUSTOM ? startDate : undefined,
      endDate: range === ChartRange.CUSTOM ? endDate : undefined,
    }))
  }

  useEffect(() => {
    if (chartMetaData) {
      setSearchFilter({
        goodsDataSourceNo,
        interval: chartMetaData.currentInterval,
        unitCd: chartMetaData.currentUnitCd,
        range: chartMetaData.currentRange,
      })
      setChartType(chartMetaData.initialChartType)
      setIsInitialState(false)
    }
  }, [chartMetaData])

  const xInterval = useMemo(() => {
    switch (chartMetaData?.currentInterval) {
      case ChartInterval.DAY:
        return 'day'
      case ChartInterval.WEEK:
      case ChartInterval.TWO_WEEKS:
        return 'week'
      case ChartInterval.MONTH:
      case ChartInterval.THREE_MONTHS:
      case ChartInterval.SIX_MONTHS:
        return 'month'
      case ChartInterval.YEAR:
        return 'year'
      default:
        return 'day'
    }
  }, [chartMetaData?.currentInterval])

  return (
    <>
      <Box borderRadius={1} maxWidth={'100%'} border={'1px solid'} borderColor={'gray.30'} sx={{ position: 'relative' }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
            }}
          />
        )}
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
            disabled={user?.userRoleCd === UserRole.ADMIN}
            onClick={() => setIsOpenSetting(true)}
          />

          <MIButton
            toolTip={'그래프 다운로드'}
            color={'gray'}
            type={'outlined'}
            contentType={'icon'}
            startIcon={<LocalSeeOutlinedIcon fontSize={'small'} />}
            onClick={() => {
              if (!miChartRef.current) return

              const canvas = miChartRef.current

              const tempCanvas = document.createElement('canvas')
              tempCanvas.width = canvas.width
              tempCanvas.height = canvas.height
              const tempCtx = tempCanvas.getContext('2d')

              if (!tempCtx) return

              tempCtx.fillStyle = '#ffffff'
              tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
              tempCtx.drawImage(canvas, 0, 0)

              const link = document.createElement('a')
              link.download = `${chartData?.mainChart.goodDataName}-${chartData?.mainChart.goodsDataSourceName}-${searchFilter.unitCd}-${dayjs().format('YYYYMMDD')}.png`
              link.href = tempCanvas.toDataURL('image/png')
              link.click()
            }}
            disabled={!isDownloadable || !chartData}
          />

          <Stack direction="row" alignItems="center" sx={{ ml: 'auto' }}>
            <Switch
              checked={useSaveLastSetting}
              onChange={(_) => {
                setUseSaveLastSetting((prev) => !prev)
              }}
            />
            <Typography variant="body2M14" color={'gray.70'} onClick={(e) => e.stopPropagation()}>
              Save last setting
            </Typography>
          </Stack>
        </Grid>

        {/*Chart content*/}
        <Box display={'flex'} maxWidth={'100%'} flexDirection={'column'} p={5} height={'700px'} sx={{ boxSizing: 'border-box' }}>
          <MIChartController
            chartType={chartType}
            setChartType={setChartType}
            isCandlestick={chartData?.mainChart.chartType === ChartType.CANDLE}
            chartInterval={searchFilter.interval ?? ChartInterval.DAY}
            setChartInterval={(interval: ChartInterval) => {
              setSearchFilter((prev) => ({
                ...prev,
                interval,
              }))
            }}
            chartIntervalOptions={chartIntervalOptions}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            unitList={chartMetaData?.changeableUnitCd ?? []}
            displayDataInfo={displayDataInfo}
            onDisplayDataInfoChange={({ label, isShow }) => {
              if (label === 'BB') {
                setDisplayDataInfo((prev) => ({
                  ...prev,
                  BB: isShow,
                }))
              } else if (label === 'MA') {
                setDisplayDataInfo((prev) => ({
                  ...prev,
                  MA: {
                    MA5: isShow,
                    MA20: isShow,
                    MA60: isShow,
                    MA120: isShow,
                  },
                }))
              } else {
                setDisplayDataInfo((prev) => {
                  const updatedMA = {
                    ...prev.MA,
                    [label]: isShow,
                  }

                  const isAnyMAVisible = Object.values(updatedMA).some((value) => value)

                  return {
                    ...prev,
                    MA: updatedMA,
                    ...(isAnyMAVisible ? {} : { BB: prev.BB }),
                  }
                })
              }
            }}
          />
          <Box height={'100%'}>
            {isLoading ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress sx={{ color: 'gray.40' }} />
              </Box>
            ) : (
              <MIChart
                ref={miChartRef}
                height={'100%'}
                chartType={chartType}
                interval={xInterval}
                unitCd={searchFilter.unitCd}
                mainChart={chartData?.mainChart}
                indicators={chartData?.indicators}
                comparisonCharts={chartData?.comparisonCharts}
                currentRangeBetween={chartMetaData?.currentRangeBetween ?? []}
                displayDataInfo={displayDataInfo}
              />
            )}
          </Box>
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
          gap={0.5}
        >
          {selectedDataSource?.allowedPeriods.map(({ range }) => (
            <MIButton
              active={searchFilter.range === range}
              onClick={() => handleRangeChange(range)}
              key={range}
              color={'gray'}
              type={'ghost'}
              size={'h28'}
            >
              {CHART_RANGE_LABELS[range]}
            </MIButton>
          ))}
          {searchFilter.range === ChartRange.CUSTOM && (
            <Grid container maxWidth={357} wrap={'nowrap'} alignItems={'center'} direction={'row'} ml={2.5}>
              <MIDateRangePicker sizeInput={'h26'} onChange={handleDateChange} startDate={startDate} endDate={endDate} />
            </Grid>
          )}
          <Typography ml={'auto'} variant={'body3M12'} color={'gray.60'}>
            {chartMetaData?.latestDate && <>Updated Date : {dayjs(chartMetaData?.latestDate).format('YYYY-MM-DD')}</>}
          </Typography>
        </Grid>
      </Box>

      <SettingModalComponent open={isOpenSetting} onClose={() => setIsOpenSetting(false)} goodsDataSourceNo={goodsDataSourceNo} />
    </>
  )
}

export default ChartComponent
