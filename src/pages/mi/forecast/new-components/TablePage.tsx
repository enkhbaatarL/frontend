import { Box, Divider, Stack, Tooltip } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useMemo, useState, useEffect } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import MIDateRangePickerMenu, { DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import { IForecastChartData, IForecastReport } from '@/service/mi/forecast'
import theme from '@/theming'

interface TablePageProps {
  chartData?: IForecastChartData
  chartDataIsLoading?: boolean
  onMonthSelectChange: (monthSelect: string) => void
  hoverReportCardInfo?: IForecastReport | null
}

const TablePage = ({ chartData, chartDataIsLoading, onMonthSelectChange, hoverReportCardInfo }: TablePageProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    if (dateRange?.startDate) {
      const dateStr = dateRange.startDate.format('YYYY-MM-DD')
      onMonthSelectChange(dateStr)
    }
  }, [dateRange, onMonthSelectChange])

  // hoverReportCardInfo가 있으면 predictionResultList를 사용하여 chartData 변환
  const transformedChartData = useMemo<IForecastChartData | undefined>(() => {
    if (hoverReportCardInfo?.predictionResultList && hoverReportCardInfo.predictionResultList.length > 0) {
      const resultList = hoverReportCardInfo.predictionResultList
      
      // 날짜 형식 변환: "20251215" -> "2025-12-15"
      const formatDate = (dateStr: string) => {
        if (dateStr.length === 8) {
          return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        }
        return dateStr
      }
      
      const transformed = {
        dashboardMetadata: {
          marketIndexAnalysisTargetCd: hoverReportCardInfo.marketIndexAnalysisTargetCd,
          lastUpdateDt: hoverReportCardInfo.predictionFulfillDt,
          currency: chartData?.dashboardMetadata.currency || '',
          currentUnitCd: chartData?.dashboardMetadata.currentUnitCd || '',
          baseDate: hoverReportCardInfo.startPredictionResultDt,
          dataTableType: 'FORECAST_SINGLE_LAYER',
          tableHeader: hoverReportCardInfo.predictChartDetailExpn,
        },
        charts: [
          {
            chartLineDescription: hoverReportCardInfo.predictChartDetailExpn,
            chartLineType: 'FORECAST',
            actualChartLines: {
              dataExplanation: '',
              isPermitted: true,
              dataType: 'ACTUAL',
              goodsDataSourceNo: hoverReportCardInfo.associatedGoodsDataSourceNo,
              rawData: null,
            },
            forecastChartLines: {
              dataExplanation: '',
              isPermitted: true,
              dataType: 'FORECAST',
              goodsDataSourceNo: hoverReportCardInfo.associatedGoodsDataSourceNo,
              rawData: resultList.map((item) => ({
                resultDate: formatDate(item.date),
                predictDate: formatDate(item.date),
                value: item.value,
              })),
            },
          },
        ],
        dashboardDataSources: [
          {
            goodsDataSourceNo: hoverReportCardInfo.associatedGoodsDataSourceNo,
            dashboardLineName: hoverReportCardInfo.predictChartDetailExpn,
          },
        ],
        isFileDownload: false,
      }
      
      return transformed
    }
    return chartData
  }, [chartData, hoverReportCardInfo])

  const tableColumns = useMemo<GridColDef[]>(() => {
    if (!transformedChartData) return []

    const isForecastSingleLayer = transformedChartData.dashboardMetadata.dataTableType === 'FORECAST_SINGLE_LAYER'
    const currency = transformedChartData.dashboardMetadata.currency || ''
    const currentUnitCd = transformedChartData.dashboardMetadata.currentUnitCd || ''

    const dateColumn: GridColDef = {
      field: 'date',
      headerName: currency && currentUnitCd ? `${currency}/${currentUnitCd}` : transformedChartData.dashboardMetadata.tableHeader || '',
      flex: 1.5,
      align: 'center',
    }

    if (isForecastSingleLayer) {
      const labelColumns: GridColDef[] = []

      const forecastCharts = transformedChartData.charts.filter((chart) => chart.forecastChartLines.dataType === 'FORECAST')
      if (forecastCharts.length > 0) {
        labelColumns.push({
          field: 'Forecast',
          headerName: 'Forecast',
          flex: 1,
          align: 'center',
          renderCell: ({ row }) => {
            const value = row['Forecast']
            const permission = row['Forecast_permission']
            if (permission) {
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
        })
      }

      const actualCharts = transformedChartData.charts.filter((chart) => chart.actualChartLines.dataType === 'ACTUAL')
      if (actualCharts.length > 0) {
        labelColumns.push({
          field: 'Actual',
          headerName: 'Actual',
          flex: 1,
          align: 'center',
          renderCell: ({ row }) => {
            const value = row['Actual']
            const permission = row['Actual_permission']
            if (permission) {
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
        })
      }

      const futureCharts = transformedChartData.charts.filter((chart) => chart.actualChartLines.dataType === 'FUTURE')
      futureCharts.forEach((chart) => {
        labelColumns.push({
          field: chart.chartLineDescription,
          headerName: chart.chartLineDescription,
          flex: 1,
          align: 'center',
          renderCell: ({ row }) => {
            const value = row[chart.chartLineDescription]
            const permission = row[`${chart.chartLineDescription}_permission`]
            if (permission) {
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
        })
      })

      return [dateColumn, ...labelColumns]
    } else {
      const labelColumns: GridColDef[] = []

      transformedChartData.charts.forEach((chart) => {
        if (chart.forecastChartLines.dataType === 'FORECAST') {
          labelColumns.push({
            field: `${chart.chartLineDescription}_Fcst`,
            headerName: `${chart.chartLineDescription} (Fcst)`,
            flex: 1,
            align: 'center',
            renderCell: ({ row }) => {
              const value = row[`${chart.chartLineDescription}_Fcst`]
              const permission = row[`${chart.chartLineDescription}_Fcst_permission`]
              if (permission) {
                return <MITableCell value={value} />
              }
              return (
                <Box position="relative" sx={{ userSelect: 'none' }}>
                  <Box sx={{ filter: 'blur(3px)' }}>{value}</Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <LockOutlinedIcon style={{ width: '12px', height: '15px', color: '#868E96', position: 'absolute', top: 0 }} />
                  </Box>
                </Box>
              )
            },
          })
        }

        if (chart.actualChartLines.dataType === 'ACTUAL') {
          labelColumns.push({
            field: `${chart.chartLineDescription}_Act`,
            headerName: `${chart.chartLineDescription} (Act)`,
            flex: 1,
            align: 'center',
            renderCell: ({ row }) => {
              const value = row[`${chart.chartLineDescription}_Act`]
              const permission = row[`${chart.chartLineDescription}_Act_permission`]
              if (permission) {
                return <MITableCell value={value} />
              }
              return (
                <Box position="relative" sx={{ userSelect: 'none' }}>
                  <Box sx={{ filter: 'blur(3px)' }}>{value}</Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <LockOutlinedIcon style={{ width: '12px', height: '15px', color: '#868E96', position: 'absolute', top: 0 }} />
                  </Box>
                </Box>
              )
            },
          })
        }
      })

      return [dateColumn, ...labelColumns]
    }
  }, [transformedChartData])

  const tableRows = useMemo(() => {
    if (!transformedChartData) return []

    const isForecastSingleLayer = transformedChartData.dashboardMetadata.dataTableType === 'FORECAST_SINGLE_LAYER'

    const allDates = new Set<string>()
    transformedChartData.charts.forEach((chart) => {
      chart.forecastChartLines.rawData?.forEach((data) => {
        if (data.resultDate) allDates.add(data.resultDate)
      })
      chart.actualChartLines.rawData?.forEach((data) => {
        if (data.resultDate) allDates.add(data.resultDate)
      })
    })
    const sortedDates = Array.from(allDates).sort()

    if (isForecastSingleLayer) {
      return sortedDates.map((date) => {
        const row: Record<string, string | number | boolean> = {
          id: date,
          date: dayjs(date).format('YY-MM-DD'),
        }

        const forecastChart = transformedChartData.charts.find((chart) => chart.forecastChartLines.dataType === 'FORECAST')
        if (forecastChart) {
          const forecastData = forecastChart.forecastChartLines.rawData?.find((data) => data.resultDate === date)
          row['Forecast'] = forecastData?.value ?? '-'
          row['Forecast_permission'] = forecastChart.forecastChartLines.isPermitted
        }

        const actualChart = transformedChartData.charts.find((chart) => chart.actualChartLines.dataType === 'ACTUAL')
        if (actualChart) {
          const actualData = actualChart.actualChartLines.rawData?.find((data) => data.resultDate === date)
          row['Actual'] = actualData?.value ?? '-'
          row['Actual_permission'] = actualChart.actualChartLines.isPermitted
        }

        const futureCharts = transformedChartData.charts.filter((chart) => chart.actualChartLines.dataType === 'FUTURE')
        futureCharts.forEach((chart) => {
          const futureData = chart.actualChartLines.rawData?.find((data) => data.resultDate === date)
          row[chart.chartLineDescription] = futureData?.value ?? '-'
          row[`${chart.chartLineDescription}_permission`] = chart.actualChartLines.isPermitted
        })

        return row
      })
    } else {
      return sortedDates.map((date) => {
        const row: Record<string, string | number | boolean> = {
          id: date,
          date: dayjs(date).format('YY-MM-DD'),
        }

        transformedChartData.charts.forEach((chart) => {
          if (chart.forecastChartLines.dataType === 'FORECAST') {
            const forecastData = chart.forecastChartLines.rawData?.find((data) => data.resultDate === date)
            row[`${chart.chartLineDescription}_Fcst`] = forecastData?.value ?? '-'
            row[`${chart.chartLineDescription}_Fcst_permission`] = chart.forecastChartLines.isPermitted
          }

          if (chart.actualChartLines.dataType === 'ACTUAL') {
            const actualData = chart.actualChartLines.rawData?.find((data) => data.resultDate === date)
            row[`${chart.chartLineDescription}_Act`] = actualData?.value ?? '-'
            row[`${chart.chartLineDescription}_Act_permission`] = chart.actualChartLines.isPermitted
          }
        })

        return row
      })
    }
  }, [transformedChartData])

  const shouldUseRowSpanning = useMemo(() => false, [])

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return tableRows.slice(startIndex, startIndex + pageSize)
  }, [tableRows, page, pageSize])

  const paginationMeta = useMemo(
    () => ({
      totalPages: Math.max(1, Math.ceil(tableRows.length / pageSize)),
      totalElements: tableRows.length,
      currentPage: page,
      numberOfElements: paginatedRows.length,
      size: pageSize,
      isFirst: page <= 1,
      isLast: page >= Math.ceil(tableRows.length / pageSize),
      hasPrevious: page > 1,
      hasNext: page < Math.ceil(tableRows.length / pageSize),
      detail: paginatedRows,
    }),
    [tableRows.length, page, pageSize, paginatedRows],
  )

  return (
    <Box py="30px">
      <Stack gap="24px">
        <Stack direction="row" justifyContent="space-between">
          <MIDateRangePickerMenu onApply={setDateRange} dateRange={dateRange} sx={{ height: '36px' }} enableHoverBackground />
          <Stack direction="row" gap="12px">
            <MISelectMenu
              variant="outlined"
              items={[{ label: 'Daily', value: 'daily' }]}
              selected={'daily'}
              onSelected={() => {}}
              sx={{ height: '36px' }}
              enableHoverBackground
            />
            <MISelectMenu
              variant="outlined"
              items={[
                { label: 'Newest', value: 'NEWEST' },
                { label: 'Oldest', value: 'OLDEST' },
              ]}
              selected={'NEWEST'}
              onSelected={() => {}}
              sx={{ height: '36px' }}
              enableHoverBackground
            />
            <Tooltip
              title="Download"
              placement="top"
              disableInteractive
              slotProps={{
                popper: {
                  modifiers: [{ name: 'offset', options: { offset: [0, -8] } }],
                },
              }}
            >
              <MIBaseButton
                variant="outlined"
                sx={{
                  height: '36px',
                  padding: '8px',
                }}
                enableHoverBackground
              >
                <ChartDownloadIcon fill={theme.palette.gray[70]} />
              </MIBaseButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Divider />
        {chartDataIsLoading || !transformedChartData ? (
          <MIBaseSkeleton.BaseElement2 width={'100%'} height={'236px'} />
        ) : (
          <MITableUser
            tableProps={{
              noRowMessage: '등록된 내용이 없습니다.',
              columns: tableColumns,
              rows: paginatedRows,
              rowId: 'id',
              unstable_rowSpanning: shouldUseRowSpanning,
            }}
            paginationProps={{
              data: paginationMeta,
              size: pageSize,
              onPageChange: (value) => setPage(value),
              onSizeChange: (value) => {
                setPageSize(value)
                setPage(1)
              },
              sizeList: [10, 20, 50, 100],
              paddingTop: '50px',
            }}
          />
        )}
      </Stack>
    </Box>
  )
}

export default TablePage
