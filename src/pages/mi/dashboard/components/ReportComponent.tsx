import { Box, Typography } from '@mui/material'
import { useState } from 'react'

import MISummaryDownloadReport from './MISummaryDownloadReport'

import MIButton from '@/components/common/button/MIButton'
import DataTrendChartDownloadIcon from '@/components/common/data-trend-chart/icons/DataTrendChartDownloadIcon'
import MIForecastChart from '@/components/common/forecast-chart/MIForecastChart'
import { generateChartMonths, generateForecastDataset } from '@/components/common/forecast-chart/mockBrentForecastData'
import ArrowUpward from '@/components/common/icons/ArrowUpward'
import CloseIcon from '@/components/common/icons/CloseIcon'
import MIInfluenceFactorChart from '@/components/common/influence-factor-chart/MIInfluenceFactorChart'
import MIRigCountChart from '@/components/common/influence-factor-chart/MIRigCountChart'
import { generateMonthDataAsStrings } from '@/components/common/influence-factor-chart/mockRigCountData'
import MISegmented from '@/components/common/segmentedbtn/MISegmented'
import MITableUser from '@/components/common/table/MITableUser'
import { useMockDataReport } from '@/hooks/useMockDataReport'
import MonthSelector from '@/pages/mi/dashboard/components/MonthSelector'
import theme from '@/theming'
export type MonthItem = {
  label: string
  value: string
}

const HorizontalChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 18L14 18M4 12L20 12M4 6L10 6" stroke="#343A40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PopupIndicatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="16" viewBox="0 0 28 16" fill="none">
    <path d="M14 0L27.5 16H0.5L14 0Z" fill="#E9ECEF" />
  </svg>
)

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
  const [selectedCase, setSelectedCase] = useState('case1')

  const [showDetailChart, setShowDetailChart] = useState(false)
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
            onViewDetail={() => setShowDetailChart(true)}
            forecastDatasets={[
              {
                ...generateForecastDataset(months, { forecastByMonth: false }),
                label: 'Actual data 1',
                color: '#40597A',
                hidePoint: true,
              },
              {
                ...generateForecastDataset(months),
                label: 'Actual data 2',
                color: '#26757B',
                hidePoint: true,
                type: 'future',
              },
              {
                ...generateForecastDataset(months),
                label: 'Actual data 3',
                color: '#EFA460',
                hidePoint: true,
                type: 'future',
              },
            ]}
            months={months}
            height={598}
            bottomLabel="First Unit"
            topLabel="Unit: USD/bbl"
            lastUpated="April 29, 2025"
          />
        </Box>
        {/* {showDetailChart && ( */}
        <Box p="12px" mb="24px" sx={{ borderRadius: '4px', backgroundColor: '#E9ECEF', position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: '0px', left: '50%', transform: 'translate(-50%, -100%)', '& svg': { display: 'block' } }}>
            <PopupIndicatorIcon />
          </Box>
          <Box px="12px" py="6px" mb="10px" display={'flex'} justifyContent={'space-between'}>
            <Box>
              <Box
                mb="8px"
                sx={{
                  display: 'inline-block',
                  backgroundColor: theme.palette.common.white,
                  padding: '0 8px',
                  borderRadius: '100px',
                }}
              >
                <Typography variant="chip2" color="#495057">
                  Drill-down
                </Typography>
              </Box>
              <Box mb="8px">
                <Typography variant="body2" color="#495057">
                  Dubai Crude Forecast / May 2025
                </Typography>
              </Box>
              <Box>
                <Typography variant="messageText1" color="#212529">
                  65.02
                </Typography>
                <Typography variant="body2SB14" color="#212529">
                  USD/bb
                </Typography>
              </Box>
            </Box>
            <MIButton
              type="ghost"
              contentType="icon"
              size="h32"
              onClick={() => {
                setShowDetailChart(false)
              }}
            >
              <CloseIcon />
            </MIButton>
          </Box>
          <Box p="24px" sx={{ backgroundColor: theme.palette.common.white, border: '1px solid #868E96', borderRadius: '4px' }}>
            <Box display={'flex'} gap="6px">
              <HorizontalChartIcon />
              <Typography component={'div'} variant="infoDocument" color="gray.90" mb="24px">
                주요 요인 분석
              </Typography>
            </Box>
            <Box display={'flex'} gap={'10px'}>
              {[
                {
                  value: 'case1',
                  label: 'Category 1',
                },
                {
                  value: 'case2',
                  label: 'Category 2',
                },
                {
                  value: 'case3',
                  label: 'Category 3',
                },
                {
                  value: 'case4',
                  label: 'Category 4',
                },
              ].map((data, index) => (
                <MISegmented size="h30" active={data.value === selectedCase} onClick={() => setSelectedCase(data.value)} key={index}>
                  {data.label}
                </MISegmented>
              ))}
            </Box>
            <Box px="12px" py="18px">
              <Typography variant="body2R14" color="#495057">
                선택한 요인 분류에 대한 설명이 필요한 경우 여기에 작성합니다. Lorem ipsum dolor sit amet consectetur adipiscing elit.
                Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu
                aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada
                lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra
                inceptos himenaeos.
              </Typography>
            </Box>

            <Box>
              <MIInfluenceFactorChart
                height={150}
                decreasingFactors={[
                  {
                    label: 'Decreasing Factor 1',
                    value: 85.0,
                    color: '#A9141A',
                  },
                  {
                    label: 'D Factor 2',
                    value: 40.0,
                    color: '#5B6773',
                  },
                  {
                    label: 'D Factor 3',
                    value: 30.0,
                    color: '#7A8790',
                  },
                  {
                    label: 'D Factor 4',
                    value: 20.0,
                    color: '#8C98A0',
                  },
                  {
                    label: 'D Factor 5',
                    value: 5.0,
                    color: '#9DAFB9',
                  },
                ]}
                increasingFactors={[
                  {
                    label: 'Increasing Factor 1',
                    value: 100.0,
                    color: '#3C8A36',
                  },
                  {
                    label: 'Rig count',
                    value: 80.0,
                    color: '#5B6773',
                  },
                  {
                    label: 'I Factor 3',
                    value: 65.0,
                    color: '#7A8790',
                  },
                  {
                    label: 'I Factor 4',
                    value: 35.0,
                    color: '#8C98A0',
                  },
                  {
                    label: 'I Factor 5',
                    value: 1.0,
                    color: '#9DAFB9',
                  },
                ]}
              />
            </Box>
          </Box>
        </Box>
        {/* )} */}
        <Box p="20px" mb="40px" sx={{ borderRadius: '4px', backgroundColor: '#FAFBFE', border: '0.76px solid', borderColor: '#E9EFFB' }}>
          {/* <Typography component={'div'} variant="infoDocument" color="gray.90" mb="24px">
            주요 영향력 요인 분석
          </Typography>
          <Box display={'flex'} gap={'13px'} mb="24px">
            {[
              {
                value: 'case1',
                label: 'Case 1',
              },
              {
                value: 'case2',
                label: 'Case 2',
              },
              {
                value: 'case3',
                label: 'Case 3',
              },
              {
                value: 'case4',
                label: 'Case 4',
              },
            ].map((data, index) => (
              <MISegmented size="h30" active={data.value === selectedCase} onClick={() => setSelectedCase(data.value)} key={index}>
                {data.label}
              </MISegmented>
            ))}
          </Box> */}
          {/* <Box mb="24px" pb="24px" sx={{ borderBottom: '1px solid', borderColor: theme.palette.gray[30] }}>
            <MIInfluenceFactorChart
              height={150}
              data={{
                'Case 1': {
                  value: 95,
                  color: '#2c3e50',
                },
                'Case 2': {
                  value: 75,
                  color: '#607d8b',
                },
                'Case 3': {
                  value: 35,
                  color: '#95a5a6',
                },
                'Case 4': {
                  value: 15,
                  color: '#b0bec5',
                },
              }}
            />
          </Box> */}

          <Box>
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} mb="16px">
              <Typography variant="body2SB14" color="gray.90">
                Rig Count
              </Typography>
              <MIButton size="h28" color="gray" type="outlined">
                데이터 상세보기
              </MIButton>
            </Box>

            <Box>
              <Typography
                component={'div'}
                lineHeight={1.6}
                variant="body3R12"
                color="gray.90"
                sx={{ '& svg': { display: 'block' }, display: 'flex', alignItems: 'center' }}
              >
                영향력 점수 :{' '}
                <Typography variant="body3R12" fontWeight={600} ml="6px">
                  85
                </Typography>
                <Typography variant="body3R12" color="gray.60">
                  /10
                </Typography>{' '}
                <Typography variant="body3R12" color="#EB4D4C">
                  <ArrowUpward />
                </Typography>
              </Typography>
              <Typography component={'div'} lineHeight={1.6} variant="body3R12" color="gray.90">
                리그 가동률이 평년 대비 약 12% 회복되었습니다. 이는 새로운 공급을 의미하며, 시장 공급 증가로 이어질 전망입니다.
              </Typography>
            </Box>

            <MIRigCountChart
              height={250}
              data={{
                labels: generateMonthDataAsStrings('2024-10', 7),
                values: [8500, 9200, 9600, 10000, 10400, 10800, 11200],
              }}
            />
          </Box>
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
