import LocalSeeOutlinedIcon from '@mui/icons-material/LocalSeeOutlined'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import { Box, Grid2 as Grid, Stack, Switch, Tooltip, Typography } from '@mui/material'
import { Dayjs } from 'dayjs'
import { useCallback, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MIChart from '@/components/common/chart/MIChart'
import MIChartContrller from '@/components/common/chart/MIChartController'
import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import SettingModalComponent from '@/pages/user/datavisualization/components/SettingModalComponent'
import { calculateBollingerBands, calculateSMA, getMockOHLCData } from '@/utils/mock-data'

const mockMainData = getMockOHLCData(200)
const genMockSMA = (day: number) => {
  const rawData = calculateSMA(
    mockMainData.map((d) => d.close),
    day,
  )

  return mockMainData.map((d, i) => ({
    time: d.time,
    value: i >= day ? rawData[i - day] : null,
  }))
}

const genMockBB = () => {
  const rawData = calculateBollingerBands(
    mockMainData.map((d) => d.close),
    120,
    2,
  )

  const upper = mockMainData.map((d, i) => ({
    time: d.time,
    value: i >= 119 ? rawData.upper[i - 119] : null,
  }))

  const lower = mockMainData.map((d, i) => ({
    time: d.time,
    value: i >= 119 ? rawData.lower[i - 119] : null,
  }))

  return {
    upper,
    lower,
  }
}

const mockSMA5 = genMockSMA(5)
const mockSMA20 = genMockSMA(20)
const mockSMA60 = genMockSMA(60)
const mockSMA120 = genMockSMA(120)
const mockbb = genMockBB()

const comparisionData1 = getMockOHLCData(200).map((item) => ({ time: item.time, value: item.close }))
const comparisionData2 = getMockOHLCData(200).map((item) => ({ time: item.time, value: item.close }))
const comparisionData3 = getMockOHLCData(200).map((item) => ({ time: item.time, value: item.close }))

const ChartComponent = () => {
  const [selectedCompany, setSelectedCompany] = useState({
    label: '정형 데이터 이름 1',
    value: 'structured-data-name-1',
  })
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

  const handleDateChange = ({ startDate, endDate }: { startDate: Dayjs | null; endDate: Dayjs | null }) => {
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
            onChange={(option) => setSelectedCompany(option)}
            type={'ghost'}
            color={'gray'}
            minWidth={150}
            valueSelect={selectedCompany}
            options={[
              { label: 'Structured Data name 1234', value: 'structured-data-name-1234' },
              { label: '정형 데이터 이름 1', value: 'structured-data-name-1' },
              { label: 'Structured name test data', value: 'structured-name-test-data' },
              { label: 'Data name-structured', value: 'data-name-structured' },
              { label: 'Structured data 334', value: 'structured-data-334' },
            ]}
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
        <Box display={'flex'} maxWidth={'100%'} flexDirection={'column'} p={5} height={'642px'} sx={{ boxSizing: 'border-box' }}>
          <MIChartContrller />
          <MIChart
            height={'100%'}
            mainData={{
              label: '주인공',
              data: mockMainData,
              unit: '$/MMbtu',
              sma5: mockSMA5,
              sma20: mockSMA20,
              sma60: mockSMA60,
              sma120: mockSMA120,
              bb: mockbb,
            }}
            comparisionDataGroup={[
              {
                label: '비교군 1',
                data: comparisionData1,
                unit: 'mg',
              },
              {
                label: '비교군 2',
                data: comparisionData2,
                unit: 'mg',
              },
              {
                label: '비교군 3',
                data: comparisionData3,
                unit: '$/MMbtu',
              },
            ]}
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
          <Typography ml={'auto'} variant={'body3M12'} color={'gray.60'}>
            Updated Date : 2025-04-02
          </Typography>
        </Grid>
      </Box>

      <SettingModalComponent open={isOpenSetting} onClose={() => setIsOpenSetting(false)} />
    </>
  )
}

export default ChartComponent
