import { Box, Divider, Stack, Tooltip } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
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
import forecastDataService, { ForecastBasicInfo, IForecastChartInfo, IForecastReport } from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'
import theme from '@/theming'
import { downloadFile } from '@/utils/file'

interface TablePageProps {
  basicInfo?: ForecastBasicInfo
  chartData?: IForecastChartInfo
  chartDataIsLoading?: boolean
  onMonthSelectChange: (monthSelect: string) => void
  hoverReportCardInfo?: IForecastReport | null
}

const TablePage = ({ basicInfo, chartData, chartDataIsLoading, onMonthSelectChange, hoverReportCardInfo }: TablePageProps) => {
  const { accessCompanyInfo, user } = useAuthStore()
  const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0

  // 기본값: Last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = dayjs().startOf('day')
    const last30days = today.subtract(30, 'day')
    return {
      startDate: last30days,
      endDate: today,
    }
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [order, setOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST')

  useEffect(() => {
    if (dateRange?.startDate) {
      const dateStr = dateRange.startDate.format('YYYY-MM-DD')
      onMonthSelectChange(dateStr)
    }
  }, [dateRange, onMonthSelectChange])

  // Target 옵션을 basicInfo.targetList 기반으로 생성
  const targetOptions = useMemo(() => {
    const options = [{ label: 'All Targets', value: '' }]
    if (basicInfo?.targetList) {
      basicInfo.targetList.forEach((target) => {
        options.push({
          label: target.predictChartDetailExpn,
          value: String(target.goodsDataSourceNo),
        })
      })
    }
    return options
  }, [basicInfo?.targetList])

  // API 호출을 위한 파라미터 준비
  const tableApiParams = useMemo(() => {
    if (!dateRange?.startDate || !dateRange?.endDate || !companyNo) return null

    return {
      companyNo,
      goodsDataSourceNo: selectedTarget && selectedTarget !== '' ? Number(selectedTarget) : undefined,
      startDate: dateRange.startDate.format('YYYYMMDD'),
      endDate: dateRange.endDate.format('YYYYMMDD'),
      order,
      page,
      size: pageSize,
    }
  }, [companyNo, dateRange, selectedTarget, order, page, pageSize])

  // 테이블 데이터 API 호출
  const { data: tableData, isLoading: tableDataIsLoading } = useQuery({
    queryKey: ['getForecastReportsTableData', tableApiParams],
    queryFn: () => {
      if (!tableApiParams) return null
      const { companyNo: cn, ...params } = tableApiParams
      return forecastDataService.getForecastReportsTableData(cn, params)
    },
    enabled: !!tableApiParams,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // hoverReportCardInfo가 있으면 predictionResultList를 사용하여 chartData 변환
  const transformedChartData = useMemo<IForecastChartInfo | undefined>(() => {
    if (hoverReportCardInfo?.predictionResultList && hoverReportCardInfo.predictionResultList.length > 0) {
      const resultList = hoverReportCardInfo.predictionResultList

      // 날짜 형식 변환: "20251215" -> "2025-12-15"
      const formatDate = (dateStr: string) => {
        if (dateStr.length === 8) {
          return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        }
        return dateStr
      }

      const transformed: IForecastChartInfo = {
        metadata: {
          marketIndexAnalysisTargetCd: hoverReportCardInfo.marketIndexAnalysisTargetCd,
          lastUpdateDt: hoverReportCardInfo.predictionFulfillDt,
          currency: chartData?.metadata.currency || '',
          currentUnitCd: chartData?.metadata.currentUnitCd || '',
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
                startDate: item.date,
                resultDate: formatDate(item.date),
                predictDate: formatDate(item.date),
                value: item.value,
              })),
            },
          },
        ],
        chartsDataSource: [
          {
            goodsDataSourceNo: hoverReportCardInfo.associatedGoodsDataSourceNo,
            dashboardLineName: hoverReportCardInfo.predictChartDetailExpn,
          },
        ],
        isFileDownload: false,
        // hover 상태에서는 축/기간 정보는 원본 chartData 또는 기본값을 사용
        xAxisUnit: chartData?.xAxisUnit || '1D',
        period: chartData?.period || '1W',
        startDate: chartData?.startDate || hoverReportCardInfo.startPredictionResultDt,
        endDate: chartData?.endDate || hoverReportCardInfo.endPredictionResultDt,
        dateList: chartData?.dateList || [],
      }

      return transformed
    }
    return chartData
  }, [chartData, hoverReportCardInfo])

  // API 응답 데이터 기반 테이블 컬럼 생성
  const apiTableColumns = useMemo<GridColDef[]>(() => {
    if (!tableData?.tableHeaderList) return []

    return tableData.tableHeaderList.map((header, index) => ({
      field: `col_${index}`,
      headerName: header,
      flex: index === 0 ? 1.5 : 1,
      align: 'center',
      renderCell: ({ row }) => {
        const value = row[`col_${index}`]
        if (value === null || value === undefined) {
          return <MITableCell value="-" />
        }
        return <MITableCell value={value} />
      },
    }))
  }, [tableData])

  // 기존 chartData 기반 테이블 컬럼 (hoverReportCardInfo가 있을 때 사용)
  const chartTableColumns = useMemo<GridColDef[]>(() => {
    if (!transformedChartData) return []

    const isForecastSingleLayer = transformedChartData.metadata.dataTableType === 'FORECAST_SINGLE_LAYER'
    const currency = transformedChartData.metadata.currency || ''
    const currentUnitCd = transformedChartData.metadata.currentUnitCd || ''

    const dateColumn: GridColDef = {
      field: 'date',
      headerName: currency && currentUnitCd ? `${currency}/${currentUnitCd}` : transformedChartData.metadata.currentUnitCd || '',
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

  // 사용할 테이블 컬럼 결정 (API 데이터가 있으면 API 컬럼, 없으면 chart 컬럼)
  const tableColumns = useMemo<GridColDef[]>(() => {
    if (tableData?.tableHeaderList) {
      return apiTableColumns
    }
    return chartTableColumns
  }, [apiTableColumns, chartTableColumns, tableData])

  // API 응답 데이터 기반 테이블 행 생성
  const apiTableRows = useMemo(() => {
    if (!tableData?.tableDataList?.detail) return []

    // detail이 배열인지 확인
    if (!Array.isArray(tableData.tableDataList.detail)) return []

    return tableData.tableDataList.detail
      .filter((item) => Array.isArray(item))
      .map((values, index) => {
        const row: Record<string, string | number | null> = {
          id: `row_${index}`,
        }
        values.forEach((value, colIndex) => {
          row[`col_${colIndex}`] = value
        })
        return row
      })
  }, [tableData])

  // 기존 chartData 기반 테이블 행 (hoverReportCardInfo가 있을 때 사용)
  const chartTableRows = useMemo<Record<string, string | number | boolean | null>[]>(() => {
    if (!transformedChartData) return []

    const isForecastSingleLayer = transformedChartData.metadata.dataTableType === 'FORECAST_SINGLE_LAYER'

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
        const row: Record<string, string | number | boolean | null> = {
          id: date,
          date: dayjs(date).format('YY-MM-DD'),
        }

        const forecastChart = transformedChartData.charts.find((chart) => chart.forecastChartLines.dataType === 'FORECAST')
        if (forecastChart) {
          const forecastData = forecastChart.forecastChartLines.rawData?.find((data) => data.resultDate === date)
          row['Forecast'] = forecastData?.value ?? null
          row['Forecast_permission'] = forecastChart.forecastChartLines.isPermitted
        }

        const actualChart = transformedChartData.charts.find((chart) => chart.actualChartLines.dataType === 'ACTUAL')
        if (actualChart) {
          const actualData = actualChart.actualChartLines.rawData?.find((data) => data.resultDate === date)
          row['Actual'] = actualData?.value ?? null
          row['Actual_permission'] = actualChart.actualChartLines.isPermitted
        }

        const futureCharts = transformedChartData.charts.filter((chart) => chart.actualChartLines.dataType === 'FUTURE')
        futureCharts.forEach((chart) => {
          const futureData = chart.actualChartLines.rawData?.find((data) => data.resultDate === date)
          row[chart.chartLineDescription] = futureData?.value ?? null
          row[`${chart.chartLineDescription}_permission`] = chart.actualChartLines.isPermitted
        })

        return row
      })
    } else {
      return sortedDates.map((date) => {
        const row: Record<string, string | number | boolean | null> = {
          id: date,
          date: dayjs(date).format('YY-MM-DD'),
        }

        transformedChartData.charts.forEach((chart) => {
          if (chart.forecastChartLines.dataType === 'FORECAST') {
            const forecastData = chart.forecastChartLines.rawData?.find((data) => data.resultDate === date)
            row[`${chart.chartLineDescription}_Fcst`] = forecastData?.value ?? null
            row[`${chart.chartLineDescription}_Fcst_permission`] = chart.forecastChartLines.isPermitted
          }

          if (chart.actualChartLines.dataType === 'ACTUAL') {
            const actualData = chart.actualChartLines.rawData?.find((data) => data.resultDate === date)
            row[`${chart.chartLineDescription}_Act`] = actualData?.value ?? null
            row[`${chart.chartLineDescription}_Act_permission`] = chart.actualChartLines.isPermitted
          }
        })

        return row
      })
    }
  }, [transformedChartData])

  const shouldUseRowSpanning = useMemo(() => false, [])

  // API 데이터를 사용할 때는 서버 사이드 페이징, chart 데이터를 사용할 때는 클라이언트 사이드 페이징
  const paginatedRows = useMemo(() => {
    if (tableData?.tableDataList) {
      // API 데이터는 이미 페이징되어 있으므로 그대로 사용
      return apiTableRows
    }
    // chart 데이터는 클라이언트 사이드 페이징
    const startIndex = (page - 1) * pageSize
    return chartTableRows.slice(startIndex, startIndex + pageSize)
  }, [apiTableRows, chartTableRows, tableData, page, pageSize])

  // 페이징 메타데이터: API 응답이 있으면 서버에서 받은 정보 사용, 없으면 클라이언트 사이드 계산
  const paginationMeta = useMemo(() => {
    if (tableData?.tableDataList) {
      // API 응답에서 페이징 정보 사용
      return {
        totalPages: tableData.tableDataList.totalPages,
        totalElements: tableData.tableDataList.totalElements,
        currentPage: tableData.tableDataList.currentPage,
        numberOfElements: tableData.tableDataList.numberOfElements,
        size: tableData.tableDataList.size,
        isFirst: tableData.tableDataList.isFirst,
        isLast: tableData.tableDataList.isLast,
        hasPrevious: tableData.tableDataList.hasPrevious,
        hasNext: tableData.tableDataList.hasNext,
        detail: paginatedRows,
      }
    }
    // chart 데이터는 클라이언트 사이드 페이징 계산
    return {
      totalPages: Math.max(1, Math.ceil(chartTableRows.length / pageSize)),
      totalElements: chartTableRows.length,
      currentPage: page,
      numberOfElements: paginatedRows.length,
      size: pageSize,
      isFirst: page <= 1,
      isLast: page >= Math.ceil(chartTableRows.length / pageSize),
      hasPrevious: page > 1,
      hasNext: page < Math.ceil(chartTableRows.length / pageSize),
      detail: paginatedRows,
    }
  }, [tableData, chartTableRows.length, page, pageSize, paginatedRows])

  // 테이블 데이터 엑셀 다운로드
  const handleDownloadTable = async () => {
    try {
      if (!dateRange?.startDate || !dateRange?.endDate || !companyNo) return

      const params = {
        goodsDataSourceNo: selectedTarget && selectedTarget !== '' ? Number(selectedTarget) : undefined,
        startDate: dateRange.startDate.format('YYYYMMDD'),
        endDate: dateRange.endDate.format('YYYYMMDD'),
        order,
      }

      const response = await forecastDataService.getForecastReportsTableDataDownload(companyNo, params)
      downloadFile(response.data, 'Forecast Table.xlsx')
    } catch (error) {
      console.error('테이블 다운로드 실패:', error)
    }
  }

  return (
    <Box p="30px">
      <Stack gap="24px">
        <Stack direction="row" justifyContent="space-between">
          <MIDateRangePickerMenu onApply={setDateRange} dateRange={dateRange} sx={{ height: '36px' }} enableHoverBackground />
          <Stack direction="row" gap="12px">
            {(basicInfo?.targetList?.length ?? 0) > 1 && (
              <MISelectMenu
                variant="outlined"
                items={targetOptions}
                selected={selectedTarget}
                onSelected={(value: string) => setSelectedTarget(value)}
                sx={{ height: '36px' }}
                enableHoverBackground
              />
            )}
            <MISelectMenu
              variant="outlined"
              items={[
                { label: 'Newest', value: 'NEWEST' },
                { label: 'Oldest', value: 'OLDEST' },
              ]}
              selected={order}
              onSelected={(value: string) => setOrder(value as 'NEWEST' | 'OLDEST')}
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
                onClick={handleDownloadTable}
              >
                <ChartDownloadIcon fill={theme.palette.gray[70]} />
              </MIBaseButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Divider />
        {tableDataIsLoading || (chartDataIsLoading && !tableData) || (!tableData && !transformedChartData) ? (
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
