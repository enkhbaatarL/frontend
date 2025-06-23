import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import MISummaryDownloadReport from './MISummaryDownloadReport'

import MIButton from '@/components/common/button/MIButton'
import DataTrendChartDownloadIcon from '@/components/common/data-trend-chart/icons/DataTrendChartDownloadIcon'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import { MIBaseSkeleton, SkeletonWrapper } from '@/components/mi/MIBaseSkeleton.tsx'
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

/*const formatErrorRateValue = (value: number) => {
  if (value > 0) return { color: '#498B47', displayValue: `+${value.toFixed(2)}` }
  if (value < 0) return { color: '#CC4D50', displayValue: `${value.toFixed(2)}` }
  return { color: '#212529', displayValue: value }
}*/

const ReportComponent = ({ companyNo }: ReportComponentProps) => {
  const [monthSelect, setMonthSelect] = useState('')
  const [selectedContent, setSelectedContent] = useState<SelectedReportChartContent | null>(null)
  const { accessCompanyInfo, user } = useAuthStore()

  const resetState = () => {
    setSelectedContent(null)
  }

  // 대시보드 기본 정보
  const { data: dataInfo, isLoading: dataInfoIsLoading } = useQuery({
    queryKey: ['dashboardInfo'],
    queryFn: () => dashboardDataService.getDashboardBasicInfo(accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 대시보드 차트 조회 가능한 날짜 리스트
  const { data: chartDates, isLoading: chartDatesIsLoading } = useQuery({
    queryKey: ['dashboardChartDates'],
    queryFn: () => dashboardDataService.getDashboardChartDates(accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 대시보드 차트 데이터
  const { data: chartData, isLoading: chartDataIsLoading } = useQuery({
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
        renderCell: ({ row }) => {
          const value = row[chart.resultDate]
          /*          if (row.permission && row.id === 'ERROR_RATE') {
            const { color, displayValue } = formatErrorRateValue(value)
            return <MITableCell value={displayValue} typography={{ color }} />
          }*/
          if (row.permission) {
            return <MITableCell value={value} />
          }
          return (
            <Box position="relative" sx={{ userSelect: 'none' }}>
              <Box sx={{ filter: 'blur(3px)' }}>{value}</Box>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <LockOutlinedIcon
                  style={{
                    width: '12px',
                    height: '15px',
                    color: '#868E96',
                    position: 'absolute',
                    top: 0,
                  }}
                />
              </Box>
            </Box>
          )
        },
      }))

      return [currencyColumn, ...dataColumns]
    } else {
      const headerName = companyNo === 2008 ? 'Millions Units' : 'Vehicles'

      const chartLineDescColumn: GridColDef = {
        field: 'chartLineDescription',
        headerName,
        flex: 1.5,
        align: 'center',
        rowSpanValueGetter: (value) => value,
      }

      const dataType: GridColDef = {
        field: 'dataType',
        headerName: '',
        flex: 1,
        align: 'center',
      }

      const dataColumns: GridColDef[] = (chartData.charts[0].actualChartLines.rawData ?? []).map((chart) => ({
        field: chart.resultDate,
        headerName: formatDate(chart.resultDate),
        flex: 1,
        align: 'center',
        rowSpanValueGetter: () => null,
        renderCell: ({ row }) => (
          <>
            {row.permission ? (
              <MITableCell value={row[chart.resultDate]} />
            ) : (
              <Box position="relative" sx={{ userSelect: 'none' }}>
                <Box sx={{ filter: 'blur(3px)' }}>{row[chart.resultDate]}</Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <LockOutlinedIcon style={{ width: '12px', height: '15px', color: '#868E96', position: 'absolute', top: 0 }} />
                </Box>
              </Box>
            )}
          </>
        ),
      }))
      return [chartLineDescColumn, dataType, ...dataColumns]
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
            permission: chart.forecastChartLines.isPermitted,
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
            permission: chart.actualChartLines.isPermitted,
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
            permission: chart.actualChartLines.isPermitted,
            ...rowData,
          }
        })

      const getErrorObject = () => {
        if (!forecastRows.length || !actualRows.length) return []
        const isYYYYMMFormat = /^\d{4}-(0[1-9]|1[0-2])$/
        return [
          Object.keys(forecastRows?.[0] ?? {}).reduce(
            (acc, col) => {
              const forecastData = forecastRows[0] as Record<string, string | number | boolean>
              const actualData = actualRows[0] as unknown as Record<string, string | number>
              if (isYYYYMMFormat.test(col)) {
                const rateValue = +((actualData[col] as number) / (forecastData[col] as number) - 1).toFixed(2)
                acc[col] = isNaN(rateValue) ? actualData[col] : rateValue
              } else {
                if (col === 'permission') {
                  acc[col] = actualData[col]
                } else if (col === 'id') {
                  acc[col] = 'ERROR_RATE'
                } else {
                  acc[col] = '오차율(%)'
                }
              }
              return acc
            },
            {} as Record<string, string | number>,
          ),
        ]
      }

      const errorObject = getErrorObject()
      return [...forecastRows, ...actualRows, ...futureRows, ...errorObject]
    } else {
      const allRows = chartData.charts.flatMap((chart) => {
        const rows = []

        // 1. Forecast Row
        if (chart.forecastChartLines.dataType === 'FORECAST') {
          const forecastRowData = (chart.forecastChartLines.rawData ?? []).reduce(
            (acc, data) => ({
              ...acc,
              [data.resultDate]: data.value ?? '-',
            }),
            {},
          )

          rows.push({
            id: chart.chartLineDescription.concat(chart.forecastChartLines.dataType),
            chartLineDescription: chart.chartLineDescription,
            dataType: 'Fcst',
            permission: chart.forecastChartLines.isPermitted,
            ...forecastRowData,
          })
        }

        // 2. Actual Row
        if (chart.actualChartLines.dataType === 'ACTUAL') {
          const actualRowData = (chart.actualChartLines.rawData ?? []).reduce(
            (acc, data) => ({
              ...acc,
              [data.resultDate]: data.value ?? '-',
            }),
            {},
          )

          rows.push({
            id: chart.chartLineDescription.concat(chart.actualChartLines.dataType),
            chartLineDescription: chart.chartLineDescription,
            dataType: 'Act',
            permission: chart.actualChartLines.isPermitted,
            ...actualRowData,
          })

          /*          const correspondingForecast = chartData.charts.find(
            (forecastChart) =>
              forecastChart.chartLineDescription === chart.chartLineDescription && forecastChart.forecastChartLines.dataType === 'FORECAST',
          )

          if (correspondingForecast) {
            const errorRowData = (chart.actualChartLines.rawData ?? []).reduce((acc, actualData) => {
              const forecastData = correspondingForecast.forecastChartLines.rawData?.find(
                (fData) => fData.resultDate === actualData.resultDate,
              )

              let errorValue: string | number = '-'

              if (
                actualData.value !== null &&
                actualData.value !== undefined &&
                forecastData?.value !== null &&
                forecastData?.value !== undefined &&
                forecastData.value !== 0
              ) {
                errorValue = (actualData.value / forecastData.value - 1) * 100 // 백분율로 표시
              }

              return {
                ...acc,
                [actualData.resultDate]: errorValue,
              }
            }, {})

            rows.push({
              id: chart.chartLineDescription.concat('ERROR'),
              chartLineDescription: chart.chartLineDescription,
              dataType: 'Err%',
              permission: chart.actualChartLines.isPermitted && correspondingForecast.forecastChartLines.isPermitted,
              ...errorRowData,
            })
          }*/
        }

        return rows
      })

      return allRows
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

  const shouldUseRowSpanning = useMemo(() => chartData?.dashboardMetadata.dataTableType !== 'FORECAST_SINGLE_LAYER', [chartData])

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
      <Box paddingY={7.5} textAlign="center">
        {dataInfoIsLoading ? (
          <MIBaseSkeleton.Table width={'100%'} height={'85px'} sx={{ alignSelf: 'center' }} />
        ) : (
          <>
            <Typography component={'div'} color="gray.90" variant="heading0">
              {dataInfo?.chartPredictSettingNm}
            </Typography>
            <Typography component={'div'} color="#495057" variant="subtext0">
              Updated {formatDataInfoDate}
            </Typography>
          </>
        )}
      </Box>

      <Box>
        {chartDatesIsLoading ? (
          <SkeletonWrapper.Row gap={'8px'} sx={{ justifyContent: 'flex-start' }}>
            <MIBaseSkeleton.InputField width={'158px'} height={'38px'} />
            <MIBaseSkeleton.InputField width={'97px'} height={'38px'} />
            <MIBaseSkeleton.InputField width={'96px'} height={'38px'} />
            <MIBaseSkeleton.InputField width={'95px'} height={'38px'} />
            <MIBaseSkeleton.InputField width={'98px'} height={'38px'} />
            <MIBaseSkeleton.InputField width={'98px'} height={'38px'} />
            <MIBaseSkeleton.InputField width={'95px'} height={'38px'} />
            <MIBaseSkeleton.InputField width={'97px'} height={'38px'} />
            <MIBaseSkeleton.InputField width={'98px'} height={'38px'} />
          </SkeletonWrapper.Row>
        ) : (
          <MonthSelector selected={monthSelect} onSelect={setMonthSelect} months={monthsData ?? []} />
        )}

        <MISummaryDownloadReport companyNo={companyNo} monthSelect={monthSelect} />

        {/* CompanyChartRenderer에 props로 받은 companyNo 전달 */}
        {chartDataIsLoading || !chartData ? (
          <MIBaseSkeleton.BaseElement2 width={'100%'} height={'656px'} sx={{ mb: '24px' }} />
        ) : (
          <CompanyChartRenderer
            data={chartData}
            companyNo={companyNo}
            months={chartMonths}
            selectedContent={selectedContent}
            onSelectedContent={setSelectedContent}
            userRoleCd={user?.userRoleCd ?? ''}
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

          {chartDataIsLoading || !chartData ? (
            <MIBaseSkeleton.BaseElement2 width={'100%'} height={'236px'} />
          ) : (
            <MITableUser
              tableProps={{
                noRowMessage: '등록된 내용이 없습니다.',
                columns: tableColumns,
                rows: tableRows,
                rowId: 'id',
                unstable_rowSpanning: shouldUseRowSpanning,
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ReportComponent
