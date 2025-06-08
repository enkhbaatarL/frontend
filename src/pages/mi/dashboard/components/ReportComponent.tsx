import { Box, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import MISummaryDownloadReport from './MISummaryDownloadReport'

import MIButton from '@/components/common/button/MIButton'
import DataTrendChartDownloadIcon from '@/components/common/data-trend-chart/icons/DataTrendChartDownloadIcon'
import { generateChartMonths } from '@/components/common/forecast-chart/mockBrentForecastData'
import CloseIcon from '@/components/common/icons/CloseIcon'
import MIInfluenceFactorChart from '@/components/common/influence-factor-chart/MIInfluenceFactorChart'
import MISegmented from '@/components/common/segmentedbtn/MISegmented'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import CompanyChartRenderer from '@/pages/mi/dashboard/components/CompanyChartRenderer'
import MonthSelector from '@/pages/mi/dashboard/components/MonthSelector'
import dashboardDataService from '@/service/mi/dashboardData'
import useAuthStore from '@/store/useAuthStore'
import theme from '@/theming'
import { downloadFile } from '@/utils/file'
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

interface ReportComponentProps {
  companyNo: number | undefined
}

const ReportComponent = ({ companyNo }: ReportComponentProps) => {
  const [monthSelect, setMonthSelect] = useState('')
  const { months } = generateChartMonths()
  const [selectedCase, setSelectedCase] = useState('case1')
  const [selectedContent, setSelectedContent] = useState<{ label?: string; value?: string; category?: string; date?: string } | null>(null)
  const [showDetailChart, setShowDetailChart] = useState(false)
  const { accessCompanyInfo, user } = useAuthStore()

  // 대시보드 기본 정보
  const { data: dataInfo } = useQuery({
    queryKey: ['dashboardInfo'],
    queryFn: () => dashboardDataService.getDashboardBasicInfo(accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 대시보드 차트 조회 가능한 날짜 리스트
  const { data: chartDates } = useQuery({
    queryKey: ['dashboardChartDates'],
    queryFn: () => dashboardDataService.getDashboardChartDates(accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 대시보드 차트 데이터
  const { data: chartData } = useQuery({
    queryKey: ['dashboardChartData', monthSelect],
    queryFn: () =>
      dashboardDataService.getDashboardChartData(
        accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0,
        monthSelect.replace('-', '').slice(0, 6),
      ),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!monthSelect,
  })

  const monthsData = useMemo(
    () =>
      chartDates?.dates.map((date, index) => {
        const dateObj = new Date(date)

        const month = dateObj.toLocaleString('en-US', { month: 'short' })
        const year = dateObj.getFullYear()
        if (index === 0) {
          return {
            label: `${month} ${year} • Latest`,
            value: date,
          }
        }
        return {
          label: `${month} ${year}`,
          value: date,
        }
      }),
    [chartDates],
  )

  const formatDate = (date: string) => {
    const [year, month] = date.split('-')
    const shortYear = year.slice(2)
    return `${shortYear}-${month}`
  }

  const tableColumns = useMemo<GridColDef[]>(() => {
    if (!chartData) return []

    const isForecastSingleLayer = chartData.dashboardMetadata.dataTableType === 'FORECAST_SINGLE_LAYER'

    if (isForecastSingleLayer) {
      const currencyColumn: GridColDef = {
        field: chartData.dashboardMetadata.currency,
        headerName: `${chartData.dashboardMetadata.currency}/${chartData.dashboardMetadata.currentUnitCd}`,
        flex: 1.5,
        align: 'center',
      }

      const dataColumns: GridColDef[] = chartData.charts[0].actualChartLines.rawData.map((chart) => ({
        field: chart.resultDate,
        headerName: formatDate(chart.resultDate),
        flex: 1,
        align: 'center',
        renderCell: (params: GridRenderCellParams) => <MITableCell value={params.value} />,
      }))

      return [currencyColumn, ...dataColumns]
    }

    return []
  }, [chartData])

  const tableRows = useMemo(() => {
    if (!chartData) return []

    const isForecastSingleLayer = chartData.dashboardMetadata.dataTableType === 'FORECAST_SINGLE_LAYER'

    if (isForecastSingleLayer) {
      const forecastRows = chartData.charts
        .filter((chart) => chart.forecastChartLines.dataType === 'FORECAST')
        .map((chart) => {
          const rowData = chart.forecastChartLines.rawData.reduce(
            (acc, data) => ({
              ...acc,
              [data.resultDate]: data.value,
            }),
            {},
          )

          return {
            id: chart.forecastChartLines.dataType,
            [chartData.dashboardMetadata.currency]:
              chart.forecastChartLines.dataType[0] + chart.forecastChartLines.dataType.slice(1).toLowerCase(),
            ...rowData,
          }
        })

      const actualRows = chartData.charts
        .filter((chart) => chart.actualChartLines.dataType === 'ACTUAL')
        .map((chart) => {
          const rowData = chart.actualChartLines.rawData.reduce(
            (acc, data) => ({
              ...acc,
              [data.resultDate]: data.value,
            }),
            {},
          )

          return {
            id: chart.actualChartLines.dataType,
            [chartData.dashboardMetadata.currency]:
              chart.actualChartLines.dataType[0] + chart.actualChartLines.dataType.slice(1).toLowerCase(),
            ...rowData,
          }
        })
      const futureRows = chartData.charts
        .filter((chart) => chart.actualChartLines.dataType === 'FUTURE')
        .map((chart) => {
          const rowData = chart.actualChartLines.rawData.reduce(
            (acc, data) => ({
              ...acc,
              [data.resultDate]: data.value,
            }),
            {},
          )

          return {
            id: chart.chartLineDescription,
            [chartData.dashboardMetadata.currency]: chart.chartLineDescription,
            ...rowData,
          }
        })
      return [...forecastRows, ...actualRows, ...futureRows]
    }

    return []
  }, [chartData])

  const formatDataInfoDate = useMemo(() => {
    const date = new Date(dataInfo?.lastUpdateDt ?? '')

    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()

    return `${month} ${day}, ${year}`
  }, [dataInfo])

  const handleViewDetail = (content: { label?: string; value?: number; category?: string; color?: string }, label: string) => {
    setSelectedContent({
      date: label ?? '',
      label: content.label ?? '',
      value: Number(content.value).toFixed(2) ?? '0',
      category: content.category ?? '',
    })
    setShowDetailChart(true)
  }

  // 데이터 테이블 다운로드
  const downloadDataTable = async () => {
    try {
      const response = await dashboardDataService.getdashboardChartDataDownload(
        accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0,
        monthSelect.replace('-', '').slice(0, 6),
      )
      downloadFile(response.data, 'Data Table.xlsx')
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (monthSelect === '') {
      setMonthSelect(monthsData?.[0]?.value ?? '')
    }
  }, [monthsData])

  return (
    <Box maxWidth={'1070px'}>
      {dataInfo && (
        <>
          <Box paddingY={7.5} textAlign="center">
            <Typography component={'div'} color="gray.90" variant="heading0">
              {dataInfo.chartPredictSettingNm}
            </Typography>
            <Typography component={'div'} color="#495057" variant="subtext0">
              Updated {formatDataInfoDate}
            </Typography>
          </Box>
        </>
      )}

      <Box>
        <MonthSelector selected={monthSelect} onSelect={setMonthSelect} months={monthsData ?? []} />
        <MISummaryDownloadReport />

        {/* CompanyChartRenderer에 props로 받은 companyNo 전달 */}
        <CompanyChartRenderer companyNo={companyNo} months={months} onViewDetail={handleViewDetail} />

        {showDetailChart && (
          <Box width={'1006px'} mb="24px" gap={'6px'} sx={{ borderRadius: '4px', backgroundColor: '#E9ECEF', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: '0px', left: '50%', transform: 'translate(-50%, -100%)', '& svg': { display: 'block' } }}>
              <PopupIndicatorIcon />
            </Box>
            <Box p={'12px'}>
              <Box px={'12px'} pt={'12px'} pb={'10px'} display={'flex'} justifyContent={'space-between'}>
                <Box>
                  <Box
                    mb="8px"
                    sx={{
                      display: 'inline-flex',
                      backgroundColor: theme.palette.common.white,
                      padding: '0 8px',
                      borderRadius: '100px',
                      alignItems: 'center',
                    }}
                    height={'20px'}
                  >
                    <Typography variant="chip2" color="#495057">
                      Drill-down
                    </Typography>
                  </Box>
                  <Box mb="8px">
                    <Typography variant="body2" color="#495057">
                      {selectedContent?.label} / {selectedContent?.date}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="messageText1" color="#212529" sx={{ marginRight: '2px' }}>
                      {selectedContent?.value}
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

              <Box p={'6px'} mt={'10px'}>
                <Box maxWidth={'994px'} p={'24px'} sx={{ backgroundColor: theme.palette.common.white, borderRadius: '4px' }}>
                  <Box display={'flex'} gap="6px" mb={'12px'}>
                    <HorizontalChartIcon />
                    <Typography component={'div'} variant="infoDocument" color="gray.90">
                      주요 요인 분석
                    </Typography>
                  </Box>
                  <Box
                    display={'flex'}
                    gap={'10px'}
                    maxWidth={'946px'}
                    maxHeight={'100%'}
                    flexWrap={'wrap'}
                    paddingTop={'10px'}
                    paddingBottom={'10px'}
                  >
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
                  <Box padding={'18px 12px 18px 12px'}>
                    <Typography variant="body2R14" color="#495057">
                      선택한 요인 분류에 대한 설명이 필요한 경우 여기에 작성합니다. Lorem ipsum dolor sit amet consectetur adipiscing elit.
                      Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo
                      eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl
                      malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per
                      conubia nostra inceptos himenaeos.
                    </Typography>
                  </Box>

                  <Box mt={'12px'}>
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
            </Box>
          </Box>
        )}
        <Box width={'100%'}>
          <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} py="6px" mb="20px">
            <Typography variant="infoDocument" color="gray.90">
              Data Table
            </Typography>
            <Box>
              <MIButton startIcon={<DataTrendChartDownloadIcon />} onClick={downloadDataTable} contentType={'icon'} type="outlined" />
            </Box>
          </Box>
          {chartData && (
            <MITableUser
              tableProps={{
                noRowMessage: '등록된 내용이 없습니다.',
                columns: tableColumns,
                rows: tableRows,
                rowId: 'id',
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ReportComponent
