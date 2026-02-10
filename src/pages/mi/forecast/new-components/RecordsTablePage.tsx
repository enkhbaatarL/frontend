import { InfoOutlined } from '@mui/icons-material'
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { memo, useMemo, useState, useEffect, useCallback } from 'react'

import forecastTargetIcon from '@/assets/icons/forecast-target.svg'
import forecastVectorIcon from '@/assets/icons/forecast-vector.svg'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import MIDateRangePickerMenu, { DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MITableUser from '@/components/common/table/MITableUser'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import forecastDataService, { ForecastBasicInfo, IForecastChartInfo, IForecastReport } from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'
import theme from '@/theming'
import { downloadFile } from '@/utils/file'

interface RecordsTablePageProps {
  basicInfo?: ForecastBasicInfo
  chartData?: IForecastChartInfo
  chartDataIsLoading?: boolean
  onMonthSelectChange: (monthSelect: string) => void
  hoverReportCardInfo?: IForecastReport | null
}

// Model Accuracy 데이터 타입 (임시)
interface ModelAccuracyItem {
  name: string
  percentage: number
  type: string
  date: string
}

// Model Records 데이터 타입
interface ModelRecord {
  id: string
  marketIndexAnalysisTargetCd: string
  predictionFulfillDt: string
  mnemonicCd: string
  predictChartDetailExpn: string
  associatedGoodsDataSourceNo: number
  endPredictionResultDt: string
  startPredictionResultDt: string
  predictionCriteriaDt: string
  predictionResultDt: string
  predictionResultVal: number
  predictionCriteriaVal: number
  predictionResultDiffVal: number
  predictionResultDiffRate: number
  actualVal: number
  directionVal: 'UPWARD' | 'NEUTRAL' | 'DOWNWARD'
  isHit: boolean
  isScheduled: boolean | null
  isNew: boolean | null
  report?: string
}

const RecordsTablePage = memo(({ basicInfo, chartDataIsLoading }: RecordsTablePageProps) => {
  const { accessCompanyInfo, user } = useAuthStore()
  const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0

  // 기본값: 회사별 초기 기간
  // - 2020(에너지): 최근 3개월
  // - 그 외(예: 2013 E&S, 2015 Hynix 등): 최근 30일
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = dayjs().startOf('day')

    if (companyNo === 2015) {
      const last2Years = today.subtract(2, 'year')
      return {
        startDate: last2Years,
        endDate: today,
      }
    }

    const last30days = today.subtract(30, 'day')
    return {
      startDate: last30days,
      endDate: today,
    }
  })
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<string>('NEWEST')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 임시 Model Accuracy 데이터
  const modelAccuracyData: ModelAccuracyItem[] = useMemo(
    () => [
      {
        name: 'Dubai Crude',
        percentage: 71.04,
        type: 'All-time',
        date: 'As of 25/12/31',
      },
      {
        name: 'Brent Crude',
        percentage: 82.59,
        type: 'All-time',
        date: 'As of 25/12/31',
      },
    ],
    [],
  )

  const recordsApiParams = useMemo(() => {
    if (!dateRange?.startDate || !dateRange?.endDate || !companyNo) return null

    return {
      goodsDataSourceNo: selectedTarget && selectedTarget !== '' ? Number(selectedTarget) : undefined,
      startDate: dateRange.startDate.format('YYYYMMDD'),
      endDate: dateRange.endDate.format('YYYYMMDD'),
      order: sortOrder as 'NEWEST' | 'OLDEST',
      page,
      size: pageSize,
    }
  }, [dateRange, selectedTarget, sortOrder, page, pageSize, companyNo])

  // Records 데이터 API 호출
  const { data: recordsData, isLoading: recordsIsLoading } = useQuery({
    queryKey: ['getForecastRecords', companyNo, recordsApiParams],
    queryFn: () => forecastDataService.getForecastRecords(companyNo, recordsApiParams!),
    enabled: !!recordsApiParams && !!companyNo,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // API 응답 데이터를 ModelRecord 형식으로 변환
  const modelRecordsData: ModelRecord[] = useMemo(() => {
    if (!recordsData?.detail) return []

    return recordsData.detail.map((record, index) => {
      // 고유 ID 생성
      const id = `${record.marketIndexAnalysisTargetCd}_${record.predictionFulfillDt}_${record.mnemonicCd}_${index}`

      return {
        id,
        marketIndexAnalysisTargetCd: record.marketIndexAnalysisTargetCd,
        predictionFulfillDt: record.predictionFulfillDt,
        mnemonicCd: record.mnemonicCd,
        predictChartDetailExpn: record.predictChartDetailExpn,
        associatedGoodsDataSourceNo: record.associatedGoodsDataSourceNo,
        endPredictionResultDt: record.endPredictionResultDt,
        startPredictionResultDt: record.startPredictionResultDt,
        predictionCriteriaDt: record.predictionCriteriaDt,
        predictionResultDt: record.predictionResultDt,
        predictionResultVal: record.predictionResultVal,
        predictionCriteriaVal: record.predictionCriteriaVal,
        predictionResultDiffVal: record.predictionResultDiffVal,
        predictionResultDiffRate: record.predictionResultDiffRate,
        actualVal: record.actualVal,
        directionVal: record.directionVal,
        isHit: record.isHit,
        isScheduled: record.isScheduled,
        isNew: record.isNew,
        report: record.report,
      }
    })
  }, [recordsData])

  // 리포트 다운로드 핸들러
  const handleDownload = useCallback(
    async (row: ModelRecord) => {
      try {
        const predictDate = row.predictionFulfillDt
        const response = await forecastDataService.getForecastReportFileDownload(companyNo, {
          predictDate,
        })

        const cd = response.headers?.['content-disposition'] ?? ''

        if (cd.includes('.zip')) {
          const fileName = `Report_${predictDate}.zip`
          downloadFile(response.data, fileName)
        } else {
          // prettier-ignore
          const fileName = cd.split('\'\'').pop().trim()
          downloadFile(response.data, fileName)
        }
      } catch (error) {
        console.error('Download failed:', error)
      }
    },
    [companyNo],
  )

  // 일별 데이터 다운로드 핸들러
  const handleDailyDataDownload = useCallback(
    async (row: ModelRecord) => {
      try {
        const response = await forecastDataService.getForecastRecordsDailyDownload(companyNo, {
          predictionFulfillDt: row.predictionFulfillDt,
          predictionCriteriaDt: row.predictionCriteriaDt,
          marketIndexAnalysisTargetCd: row.marketIndexAnalysisTargetCd,
          mnemonicCd: row.mnemonicCd,
        })

        // 파일명 생성: SKT_유가전망_AI모델_예측결과_{날짜}_{타겟명}.xlsx
        const date = row.predictionCriteriaDt || ''
        const targetName = row.predictChartDetailExpn || ''
        const fileName = `SKT_유가전망_AI모델_예측결과_${date}_${targetName}.xlsx`

        downloadFile(response.data, fileName)
      } catch (error) {
        console.error('Daily data download failed:', error)
      }
    },
    [companyNo],
  )

  // 테이블 다운로드 핸들러
  const handleTableDownload = useCallback(async () => {
    if (!dateRange?.startDate || !dateRange?.endDate || !companyNo) {
      return
    }

    try {
      const params = {
        goodsDataSourceNo: selectedTarget && selectedTarget !== '' ? Number(selectedTarget) : undefined,
        startDate: dateRange.startDate.format('YYYYMMDD'),
        endDate: dateRange.endDate.format('YYYYMMDD'),
        order: sortOrder as 'NEWEST' | 'OLDEST',
      }

      const response = await forecastDataService.getForecastRecordsFileDownload(companyNo, params)
      downloadFile(response.data, 'Forecast Records.xlsx')
    } catch (error) {
      console.error('Download failed:', error)
    }
  }, [companyNo, dateRange, selectedTarget, sortOrder])

  // 테이블 컬럼 정의
  const tableColumns = useMemo<GridColDef[]>(() => {
    // 필드별 컬럼 정의 (참조용)
    const fieldDefinitions: Record<string, Omit<GridColDef, 'field' | 'headerName'>> = {
      predictChartDetailExpn: {
        minWidth: 140,
        flex: 1,
        align: 'left',
        headerAlign: 'left',
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              width: '100%',
            }}
          >
            <Stack direction="row" alignItems="center" gap="10px" sx={{ width: '100%' }}>
              <Typography
                sx={{
                  fontFamily: 'Pretendard',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '140%',
                  letterSpacing: '0%',
                  color: '#212529',
                }}
              >
                {row.predictChartDetailExpn}
              </Typography>
              {row.isScheduled && (
                <Typography
                  sx={{
                    fontFamily: 'Pretendard',
                    fontWeight: 600,
                    fontSize: '12px',
                    lineHeight: '140%',
                    letterSpacing: '0%',
                    color: '#868E96',
                  }}
                >
                  Ad hoc
                </Typography>
              )}
            </Stack>
          </Box>
        ),
      },
      predictionFulfillDt: {
        minWidth: 100,
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (_, row) => {
          if (!row.predictionFulfillDt || row.predictionFulfillDt.length !== 8) return ''
          return dayjs(row.predictionFulfillDt, 'YYYYMMDD').format('YY/MM/DD')
        },
        renderCell: ({ value }) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
            }}
          >
            {value || '-'}
          </Box>
        ),
      },
      predictionResultDt: {
        minWidth: 120,
        flex: 1.5,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (_, row) => {
          // 이미 포맷된 문자열이면 그대로 사용
          if (!row.predictionResultDt) return ''
          // YYYYMMDD 형식(8자리)이면 포맷팅
          if (row.predictionResultDt.length === 8) {
            return dayjs(row.predictionResultDt, 'YYYYMMDD').format('YY/MM/DD')
          }
          // 이미 포맷된 문자열이면 그대로 반환
          return row.predictionResultDt
        },
        renderCell: ({ value }) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
            }}
          >
            {value || '-'}
          </Box>
        ),
      },
      startPredictionResultDt: {
        minWidth: 150,
        flex: 1.5,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (_, row) => {
          const formatDate = (dateStr: string) => {
            if (!dateStr || dateStr.length !== 8) return ''
            return dayjs(dateStr, 'YYYYMMDD').format('YY/MM/DD')
          }
          const startDate = formatDate(row.startPredictionResultDt)
          const endDate = formatDate(row.endPredictionResultDt)
          return `${startDate} - ${endDate}`
        },
      },
      predictionCriteriaVal: {
        minWidth: 130,
        flex: 1,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ value }) => (value ? value.toFixed(2) : '-'),
      },
      predictionResultVal: {
        minWidth: 130,
        flex: 1,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ value }) => (value ? value.toFixed(2) : '-'),
      },
      actualVal: {
        minWidth: 120,
        flex: 1,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ value }) => (value ? value.toFixed(2) : '-'),
      },
      predictionResultDiffRate: {
        minWidth: 120,
        flex: 1,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (_, row) => Math.abs(row.predictionResultDiffRate ?? 0),
        renderCell: ({ value }) => (value ? `${value.toFixed(2)}%` : '-'),
      },
      directionVal: {
        minWidth: 150,
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (_, row) => {
          if (row.directionVal === 'UPWARD') return 'Upward'
          if (row.directionVal === 'NEUTRAL') return 'Neutral'
          return 'Downward'
        },
        renderCell: ({ row }) => {
          const getDisplayText = () => {
            if (row.directionVal === 'UPWARD') return 'Upward'
            if (row.directionVal === 'NEUTRAL') return 'Neutral'
            return 'Downward'
          }
          return (
            <Box
              sx={{
                margin: '-10px -12px',
                height: 'calc(100% + 0px)',
                backgroundColor: row.isHit ? '#C9DCF4' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 12px',
              }}
            >
              {getDisplayText()}
            </Box>
          )
        },
      },
      // report
      report: {
        minWidth: 100,
        width: 100,
        flex: 0,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: ({ row }) => {
          // report 값이 없으면 '-' 표시
          if (!row.report) {
            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Pretendard',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '140%',
                    color: '#868E96',
                  }}
                >
                  -
                </Typography>
              </Box>
            )
          }

          // report 값이 있으면 다운로드 버튼 표시
          return (
            <MIBaseButton
              variant="outlined"
              onClick={() => handleDownload(row)}
              sx={{
                width: '28px',
                height: '28px',
                minWidth: '28px',
                padding: '4px',
                borderRadius: '4px',
                borderColor: '#E5E7EB',
                backgroundColor: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#F9FAFB',
                  borderColor: '#D1D5DB',
                },
              }}
            >
              <ChartDownloadIcon fill={theme.palette.gray[70]} />
            </MIBaseButton>
          )
        },
      },
      // dailyDataDownload 헤더는 dailyData 필드로 매핑
      dailyDataDownload: {
        minWidth: 100,
        width: 100,
        flex: 0,
        align: 'center' as const,
        headerAlign: 'center' as const,
        sortable: false,
        renderCell: ({ row }) => (
          <MIBaseButton
            variant="outlined"
            onClick={() => handleDailyDataDownload(row)}
            sx={{
              width: '28px',
              height: '28px',
              minWidth: '28px',
              padding: '4px',
              borderRadius: '4px',
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#F9FAFB',
                borderColor: '#D1D5DB',
              },
            }}
          >
            <ChartDownloadIcon fill={theme.palette.gray[70]} />
          </MIBaseButton>
        ),
      },
    }

    // recordHeaders가 없으면 빈 배열 반환
    if (!basicInfo?.recordHeaders || basicInfo.recordHeaders.length === 0) {
      return []
    }

    // recordHeaders를 기반으로 컬럼 생성
    // isVisible: true인 것만 필터링하고, orderNo로 정렬
    const visibleHeaders = basicInfo.recordHeaders.filter((header) => header.isVisible).sort((a, b) => a.orderNo - b.orderNo)

    return visibleHeaders.map((header) => {
      const fieldDef = fieldDefinitions[header.columnKey]
      if (!fieldDef) {
        // 정의가 없는 필드는 기본 컬럼 생성
        return {
          field: header.columnKey,
          headerName: header.headerText,
          minWidth: 100,
          flex: 1,
        } as GridColDef
      }

      // 필드 정의를 기반으로 컬럼 생성
      const column: GridColDef = {
        field: header.columnKey,
        headerName: header.headerText,
        ...fieldDef,
      }

      // predictionCriteriaVal과 actualVal의 경우 renderHeader 추가
      if (header.columnKey === 'predictionCriteriaVal') {
        column.renderHeader = () => (
          <Stack direction="row" alignItems="center" justifyContent="flex-end" gap="4px">
            <Typography variant="tableHeaderSemibold" color="gray.60">
              {header.headerText}
            </Typography>
            {companyNo === 2015 && (
              <Tooltip
                title="예측 기준이 되는 직전 실적가로, 실적 발표 전 구간에서는 추정치가 적용됩니다."
                placement="top-start"
                disableInteractive
                slotProps={{
                  popper: {
                    modifiers: [{ name: 'offset', options: { offset: [-8, -8] } }],
                  },
                }}
              >
                <InfoOutlined sx={{ width: 14, height: 14, color: theme.palette.contentIcon?.Enabled ?? 'inherit' }} />
              </Tooltip>
            )}
          </Stack>
        )
      } else if (header.columnKey === 'actualVal') {
        column.renderHeader = () => (
          <Stack direction="row" alignItems="center" justifyContent="flex-end" gap="4px">
            <Typography variant="tableHeaderSemibold" color="gray.60">
              {header.headerText}
            </Typography>
            {companyNo === 2015 && (
              <Tooltip
                title="실적 발표를 통해 확정된 실제 가격입니다."
                placement="top-start"
                disableInteractive
                slotProps={{
                  popper: {
                    modifiers: [{ name: 'offset', options: { offset: [-8, -8] } }],
                  },
                }}
              >
                <InfoOutlined sx={{ width: 14, height: 14, color: theme.palette.contentIcon?.Enabled ?? 'inherit' }} />
              </Tooltip>
            )}
          </Stack>
        )
      }

      return column
    })
  }, [handleDownload, companyNo, basicInfo?.recordHeaders])

  // 페이지네이션 메타데이터 (API 응답에서 가져옴)
  const paginationMeta = useMemo(
    () => ({
      totalPages: recordsData?.totalPages ?? 1,
      totalElements: recordsData?.totalElements ?? 0,
      currentPage: recordsData?.currentPage ?? page,
      numberOfElements: recordsData?.numberOfElements ?? 0,
      size: recordsData?.size ?? pageSize,
      isFirst: recordsData?.isFirst ?? true,
      isLast: recordsData?.isLast ?? true,
      hasPrevious: recordsData?.hasPrevious ?? false,
      hasNext: recordsData?.hasNext ?? false,
      detail: modelRecordsData,
    }),
    [recordsData, modelRecordsData, page, pageSize],
  )

  // 페이지 변경 시 API 재호출을 위해 page state 업데이트
  useEffect(() => {
    if (recordsData?.currentPage && recordsData.currentPage !== page) {
      setPage(recordsData.currentPage)
    }
  }, [recordsData?.currentPage, page])

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

  const onPageChange = useCallback((value: number) => setPage(value), [])
  const onSizeChange = useCallback((value: number) => {
    setPageSize(value)
    setPage(1)
  }, [])

  const tableProps = useMemo(
    () => ({
      noRowMessage: '등록된 내용이 없습니다.',
      columns: tableColumns,
      rows: modelRecordsData,
      rowId: 'id' as const,
      disableHover: true,
      disableRowSelectionOnClick: true,
      sx: {
        '& .MuiDataGrid-cell[data-field="forecastDirection"]': {
          position: 'relative' as const,
          padding: 0,
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
          outline: 'none',
          boxShadow: 'none',
          backgroundColor: 'transparent',
        },
        '& .MuiDataGrid-row.Mui-selected': {
          backgroundColor: 'transparent !important',
        },
        '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
          outline: 'none',
          boxShadow: 'none',
          backgroundColor: 'transparent',
        },
        '& .MuiDataGrid-columnHeader:hover': {
          backgroundColor: 'transparent !important',
        },
        '& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeader *': {
          cursor: 'default',
        },
      },
    }),
    [tableColumns, modelRecordsData],
  )

  const paginationProps = useMemo(
    () => ({
      data: paginationMeta,
      size: pageSize,
      onPageChange,
      onSizeChange,
      sizeList: [10, 20, 50, 100],
      paddingTop: '20px',
    }),
    [paginationMeta, pageSize, onPageChange, onSizeChange],
  )

  return (
    <Stack gap="20px" maxWidth="1380px" margin="auto" marginTop="40px">
      {basicInfo?.modelAccuracyVisible && (
        <Box
          sx={{
            padding: '20px 24px',
            gap: '12px',
            borderRadius: '10px',
            border: '1px solid #DEE2E6',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Stack direction="row" alignItems="center" gap="24px" height="42px">
            {/* 왼쪽 타이틀 영역 */}
            <Stack direction="row" alignItems="center" gap="2px">
              <img src={forecastTargetIcon} alt="Model Accuracy" width={24} height={24} />
              <Typography
                sx={{
                  fontFamily: 'Pretendard',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '140%',
                  letterSpacing: '0%',
                  verticalAlign: 'middle',
                  color: '#000000',
                }}
              >
                Model Accuracy
              </Typography>
            </Stack>

            {/* 구분선 */}
            <Box
              sx={{
                width: '1px',
                height: '26px',
                backgroundColor: '#DEE2E6',
                padding: '6px 0',
              }}
            />

            {/* 오른쪽 표시 영역 */}
            <Stack direction="row" alignItems="center" gap="38px" sx={{ padding: '0 12px', flex: 1 }}>
              {modelAccuracyData.map((item, index) => (
                <Box key={index} sx={{ width: '220px', height: '42px' }}>
                  {/* 이름 */}
                  <Typography
                    sx={{
                      fontFamily: 'Pretendard',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '140%',
                      letterSpacing: '0%',
                      color: '#212529',
                      marginBottom: '6px',
                    }}
                  >
                    {item.name}
                  </Typography>
                  {/* 수치 영역 */}
                  <Stack direction="row" alignItems="center" gap="6px" height="22px">
                    <Typography
                      sx={{
                        fontFamily: 'Pretendard',
                        fontWeight: 600,
                        fontSize: '16px',
                        lineHeight: '140%',
                        letterSpacing: '0%',
                        color: '#212529',
                      }}
                    >
                      {item.percentage.toFixed(2)}%
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Pretendard',
                        fontWeight: 500,
                        fontSize: '14px',
                        lineHeight: '140%',
                        letterSpacing: '0%',
                        color: '#868E96',
                      }}
                    >
                      {item.type} • {item.date}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Box>
      )}

      {/* Model Records Section */}
      <Box
        sx={{
          maxHeight: '1008px',
          borderRadius: '10px',
          border: '1px solid #DEE2E6',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 타이틀 */}
        <Stack direction="row" alignItems="center" gap="4px" height="22px" marginBottom="20px">
          <img src={forecastVectorIcon} alt="Model Records" width={20} height={20} />
          <Typography
            sx={{
              fontFamily: 'Pretendard',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '140%',
              letterSpacing: '0%',
              verticalAlign: 'middle',
              color: '#000000',
            }}
          >
            Model Records
          </Typography>
        </Stack>
        {/* 테이블 상위 헤더 영역 */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" height="36px" marginBottom="12px">
          <Typography
            sx={{
              fontFamily: 'Pretendard',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '140%',
              letterSpacing: '0%',
              verticalAlign: 'middle',
              color: '#868E96',
            }}
          >
            Highlighted cells indicate forecasts where the predicted direction matches the actual outcome.
          </Typography>

          {/* Action 영역 */}
          <Stack direction="row" alignItems="center" gap="12px" height="36px">
            {(basicInfo?.targetList?.length ?? 0) > 1 && (
              <MISelectMenu
                variant="outlined"
                items={targetOptions}
                selected={selectedTarget}
                onSelected={(value: string) => {
                  setSelectedTarget(value)
                  setPage(1) // 필터 변경 시 첫 페이지로 리셋
                }}
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
              selected={sortOrder}
              onSelected={(value: string) => {
                setSortOrder(value)
                setPage(1) // 정렬 변경 시 첫 페이지로 리셋
              }}
              sx={{ height: '36px' }}
              enableHoverBackground
            />
            <MIDateRangePickerMenu
              onApply={(range) => {
                setDateRange(range)
                setPage(1) // 날짜 범위 변경 시 첫 페이지로 리셋
              }}
              dateRange={dateRange}
              sx={{ height: '36px' }}
              enableHoverBackground
            />
            <MIBaseButton
              variant="outlined"
              onClick={handleTableDownload}
              sx={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
                padding: '8px',
              }}
              enableHoverBackground
            >
              <ChartDownloadIcon fill={theme.palette.gray[70]} />
            </MIBaseButton>
          </Stack>
        </Stack>

        {/* 테이블 */}
        {chartDataIsLoading || recordsIsLoading ? (
          <MIBaseSkeleton.BaseElement2 width={'100%'} height={'400px'} />
        ) : (
          <MITableUser tableProps={tableProps} paginationProps={paginationProps} />
        )}
      </Box>
    </Stack>
  )
})

RecordsTablePage.displayName = 'RecordsTablePage'

export default RecordsTablePage
