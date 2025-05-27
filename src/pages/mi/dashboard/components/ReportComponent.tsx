import { Box, Typography } from '@mui/material'
import { useState } from 'react'

import MISummaryDownloadReport from './MISummaryDownloadReport'

import MIButton from '@/components/common/button/MIButton'
import DataTrendChartDownloadIcon from '@/components/common/data-trend-chart/icons/DataTrendChartDownloadIcon'
import MIForecastChart from '@/components/common/forecast-chart/MIForecastChart'
import {
  actualData,
  futuresM1Data,
  futuresM2Data,
  generateChartMonths,
  generateForecastDatasets,
} from '@/components/common/forecast-chart/mockBrentForecastData'
import MITableUser from '@/components/common/table/MITableUser'
import { useMockDataReport } from '@/hooks/useMockDataReport'
import MonthSelector from '@/pages/mi/dashboard/components/MonthSelector'

export type MonthItem = {
  label: string
  value: string
}

export const monthsData: MonthItem[] = [
  { label: 'Apr 2025 • Latest', value: '2025-04' },
  { label: 'Mar 2025', value: '2025-03' },
  { label: 'Feb 2025', value: '2025-02' },
  { label: 'Jan 2025', value: '2025-01' },
  { label: 'Dec 2024', value: '2024-12' },
  { label: 'Nov 2024', value: '2024-11' },
  { label: 'Oct 2024', value: '2024-10' },
  { label: 'Sep 2024', value: '2024-09' },
  { label: 'Aug 2024', value: '2024-08' },
]

const ReportComponent = ({ companyNo }: { companyNo: number }) => {
  const [monthSelect, setMonthSelect] = useState('2025-04')
  const { rows, columns } = useMockDataReport()
  const { months } = generateChartMonths()
  console.log('-companyNo:', companyNo)
  return (
    <Box>
      <Box paddingY={7.5} textAlign="center">
        <Typography component={'div'} color="gray.90" variant="heading0">
          BEV Forecast
        </Typography>
        <Typography component={'div'} color="#495057" variant="subtext0">
          MI Model for Battery-Electric Vehicle Scales Volume
        </Typography>
      </Box>

      <Box>
        <MonthSelector selected={monthSelect} onSelect={setMonthSelect} months={monthsData} />
        <MISummaryDownloadReport />

        <Box mb="42px" pb="30px">
          <MIForecastChart
            actualData={{
              label: 'Actual data',
              data: actualData,
              color: '#40597A',
            }}
            months={months}
            forecastData={generateForecastDatasets(months)}
            futureDatasets={[
              {
                label: 'Futures M1',
                data: futuresM1Data,
                color: '#EFA460',
              },
              {
                label: 'Futures M2',
                data: futuresM2Data,
                color: '#26757B',
              },
            ]}
            height={598}
            bottomLabel="First Unit"
            topLabel="Unit: USD/bbl"
            lastUpdated="April 29, 2025"
          />
        </Box>
        <Box width={'100%'} mb="40px">
          <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} py="6px" mb="20px">
            <Typography variant="infoDocument" color="gray.90">
              Data Table
            </Typography>
            <Box>
              <MIButton startIcon={<DataTrendChartDownloadIcon />} onClick={() => {}} contentType={'icon'} type="outlined" />
            </Box>
          </Box>
          <MITableUser
            tableProps={{
              noRowMessage: '등록된 내용이 없습니다.',
              columns,
              rows,
              rowId: 'id',
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default ReportComponent
