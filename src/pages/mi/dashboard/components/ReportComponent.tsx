import { Box, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import MISummaryDownloadReport from './MISummaryDownloadReport'

import MIButton from '@/components/common/button/MIButton'
import DataTrendChartDownloadIcon from '@/components/common/data-trend-chart/icons/DataTrendChartDownloadIcon'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import CompanyChartRenderer from '@/pages/mi/dashboard/components/CompanyChartRenderer'
import DrillDownPopup from '@/pages/mi/dashboard/components/DrillDownPopup.tsx'
import MonthSelector from '@/pages/mi/dashboard/components/MonthSelector'
import dashboardDataService from '@/service/mi/dashboardData'
import useAuthStore from '@/store/useAuthStore'
import { downloadFile } from '@/utils/file'

export type MonthItem = {
  label: string
  value: string
}

export interface SelectedReportChartContent {
  label: string
  date: string
  value: number
  goodsDataSourceNo?: number
}
interface ReportComponentProps {
  companyNo?: number
}

const ReportComponent = ({ companyNo }: ReportComponentProps) => {
  const [monthSelect, setMonthSelect] = useState('')
  const [selectedContent, setSelectedContent] = useState<SelectedReportChartContent | null>(null)
  const { accessCompanyInfo, user } = useAuthStore()

  const resetState = () => {
    setSelectedContent(null)
  }

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

        if (index === 0) {
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(2, '0')

          return {
            label: `${year}-${month}-${day} • Latest`,
            value: date,
          }
        }

        const year = dateObj.getFullYear()
        const month = dateObj.toLocaleString('en-US', { month: 'short' })

        return {
          label: `${month} ${year}`,
          value: date,
        }
      }),
    [chartDates],
  )

  const chartMonths = useMemo(() => {
    if (!chartData?.charts[0]?.actualChartLines?.rawData) return []
    return chartData.charts[0].actualChartLines.rawData.map((data) => data.resultDate)
  }, [chartData])

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

      const dataColumns: GridColDef[] = (chartData.charts[0].actualChartLines.rawData ?? []).map((chart) => ({
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
          const rowData = (chart.forecastChartLines.rawData ?? []).reduce(
            (acc, data) => ({
              ...acc,
              [data.resultDate]: data.value ?? '-',
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
          const rowData = (chart.actualChartLines.rawData ?? []).reduce(
            (acc, data) => ({
              ...acc,
              [data.resultDate]: data.value ?? '-',
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
          const rowData = (chart.actualChartLines.rawData ?? []).reduce(
            (acc, data) => ({
              ...acc,
              [data.resultDate]: data.value ?? '-',
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

  // 데이터 테이블 다운로드
  const downloadDataTable = async () => {
    try {
      const response = await dashboardDataService.getDashboardChartDataDownload(
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

  useEffect(() => {
    if (monthSelect) resetState()
  }, [monthSelect])

  return (
    <Box maxWidth={'1070px'}>
      {dataInfo && (
        <Box paddingY={7.5} textAlign="center">
          <Typography component={'div'} color="gray.90" variant="heading0">
            {dataInfo.chartPredictSettingNm}
          </Typography>
          <Typography component={'div'} color="#495057" variant="subtext0">
            Updated {formatDataInfoDate}
          </Typography>
        </Box>
      )}

      <Box>
        <MonthSelector selected={monthSelect} onSelect={setMonthSelect} months={monthsData ?? []} />
        <MISummaryDownloadReport companyNo={companyNo} monthSelect={monthSelect} />

        {/* CompanyChartRenderer에 props로 받은 companyNo 전달 */}
        {chartData && (
          <CompanyChartRenderer
            data={chartData}
            companyNo={companyNo}
            months={chartMonths}
            selectedContent={selectedContent}
            onSelectedContent={setSelectedContent}
          />
        )}

        <Box
          sx={{
            transition: 'all 0.3s ease-in-out',
            opacity: selectedContent ? 1 : 0,
            transform: selectedContent ? 'translateY(0)' : 'translateY(-10px)',
          }}
        >
          {selectedContent && (
            <DrillDownPopup monthSelect={monthSelect} selectedContent={selectedContent} onClose={resetState} companyNo={companyNo} />
          )}
        </Box>
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
