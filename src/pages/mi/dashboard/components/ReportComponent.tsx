import { Box, Typography } from '@mui/material'
import { useState } from 'react'

import aiImg from '@/assets/ai.svg'
import MIButton from '@/components/common/button/MIButton'
import DataTrendChartDownloadIcon from '@/components/common/data-trend-chart/icons/DataTrendChartDownloadIcon'
import MIDataTrendHeatMapChart from '@/components/common/data-trend-chart/MIDataTrendHeatMapChart'
import MIForecastChart from '@/components/common/forecast-chart/MIForecastChart'
import {
  actualData,
  futuresM1Data,
  futuresM2Data,
  generateChartMonths,
  generateForecastDatasets,
} from '@/components/common/forecast-chart/mockBrentForecastData'
import ArrowUpward from '@/components/common/icons/ArrowUpward'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
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

const ReportMIComponent = () => {
  const [monthSelect, setMonthSelect] = useState('2025-04')
  const { rows, columns } = useMockDataReport()
  const { months } = generateChartMonths()
  const [selectedCase, setSelectedCase] = useState('case1')

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
        <Box borderRadius={'4px'} border={'1px solid #E5EDFA'} bgcolor={'#F6F9FD'} padding={5} mt={10} mb={6}>
          <Typography mb={2.5} component={'div'} variant={'textAI'}>
            <img style={{ verticalAlign: 'sub', marginRight: '4px' }} src={aiImg} alt="" />
            AI Summary
          </Typography>
          <Typography mb={1} variant={'subtext5'} color={'gray.90'} component={'div'}>
            최근 LNG 시장은 북미와 아시아 지역의 수요 증가와 함께 상승세를 보이고 있습니다. 특히 북미 천연가스 가격이 급등하며, 향후 3개월
            내 추가적인 상승이 예상됩니다. 모건 스탠리는 2025년 미국 Henry Hub 가격을 mmBtu당 $4.15로 상향 조정했습니다.{' '}
          </Typography>
          <Typography mb={5} variant={'subtext5'} color={'#365FA2'} component={'div'}>
            차트의 데이터 포인트를 클릭하면 상세 정보가 표시됩니다.
          </Typography>
          <MIButton size={'h42'} type={'outlined'} color={'gray'} startIcon={<FileDownloadIcon />}>
            Download Report
          </MIButton>
        </Box>
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
        <Box p="20px" mb="40px" sx={{ borderRadius: '4px', backgroundColor: '#FAFBFE', border: '0.76px solid', borderColor: '#E9EFFB' }}>
          <Typography component={'div'} variant="infoDocument" color="gray.90" mb="24px">
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
          </Box>
          <Box mb="24px" pb="24px" sx={{ borderBottom: '1px solid', borderColor: theme.palette.gray[30] }}>
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
          </Box>

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
        <Box>
          <MIDataTrendHeatMapChart
            data={[
              [-0.04, -0.04, 0.03, -0.04, -0.04, 0.04, -0.04, -0.01, 0, -0.04, -0.02, -0.04, 0.04, 0.03, -0.02, 0.01],
              [-0.02, -0.02, 0.02, -0.02, -0.02, -0.03, -0.03, -0.04, -0.03, -0.03, -0.02, -0.03, 0.02, 0.01, -0.03, -0.03],
              [-0.04, -0.04, -0.01, -0.04, -0.04, -0.03, -0.03, -0.02, -0.02, -0.01, -0.04, -0.04, 0.03, -0.01, -0.03, 0.03],
              [-0.02, -0.02, 0.04, -0.02, -0.02, -0.03, -0.04, -0.03, -0.01, -0.02, -0.02, -0.02, 0.03, 0.02, -0.04, 0.02],
              [-0.04, -0.04, 0.03, -0.04, -0.04, 0.04, -0.04, -0.01, 0, -0.04, -0.02, -0.04, 0.04, 0.03, -0.02, 0.01],
              [-0.02, -0.02, 0.02, -0.02, -0.02, -0.03, -0.03, -0.04, -0.03, -0.03, -0.02, -0.03, 0.02, 0.01, -0.03, -0.03],
            ]}
            height={345}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default ReportMIComponent
