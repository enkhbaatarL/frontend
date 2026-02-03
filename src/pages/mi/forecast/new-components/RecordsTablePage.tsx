import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState, useEffect, useCallback } from 'react'

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

// Model Records 데이터 타입 (임시)
interface ModelRecord {
  id: string
  target: string
  runDate: string
  forecastPeriod: string
  referencePrice: number
  forecastPrice: number
  actualPrice: number
  forecastError: number
  forecastDirection: 'Upward' | 'Downward'
  isDirectionMatch: boolean
  predictionFulfillDt: string // 원본 predictionFulfillDt (YYYYMMDD 형식)
  reportDownloadUrl?: string
  dailyDataDownloadUrl?: string
}

const RecordsTablePage = ({ basicInfo, chartDataIsLoading }: RecordsTablePageProps) => {
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

  // API 호출을 위한 파라미터 준비
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
  }, [dateRange, selectedTarget, sortOrder, page, pageSize])

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
      // 날짜 형식 변환: YYYYMMDD -> YY/MM/DD
      const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length !== 8) return ''
        return dayjs(dateStr, 'YYYYMMDD').format('YY/MM/DD')
      }

      const runDate = formatDate(record.predictionFulfillDt)
      const startDate = formatDate(record.startPredictionResultDt)
      const endDate = formatDate(record.endPredictionResultDt)
      const forecastPeriod = `${startDate} - ${endDate}`

      // forecastDirection 계산: predictionResultDiffVal이 양수면 Upward, 음수면 Downward
      const forecastDirection: 'Upward' | 'Downward' = record.predictionResultDiffVal >= 0 ? 'Upward' : 'Downward'

      // isDirectionMatch: 실제 데이터가 없으므로 임시로 true (나중에 실제 데이터와 비교 필요)
      const isDirectionMatch = true

      // forecastError: predictionResultDiffRate의 절댓값
      const forecastError = Math.abs(record.predictionResultDiffRate ?? 0)

      // 고유 ID 생성
      const id = `${record.marketIndexAnalysisTargetCd}_${record.predictionFulfillDt}_${record.mnemonicCd}_${index}`

      return {
        id,
        target: record.predictChartDetailExpn,
        runDate,
        forecastPeriod,
        referencePrice: record.predictionCriteriaVal,
        forecastPrice: record.predictionResultVal,
        actualPrice: record.predictionResultVal, // 실제 데이터가 없으므로 예측값으로 임시 설정
        forecastError,
        forecastDirection,
        isDirectionMatch,
        predictionFulfillDt: record.predictionFulfillDt, // 원본 날짜 저장
      }
    })
  }, [recordsData])

  // 리포트 다운로드 핸들러
  const handleDownload = useCallback(
    async (row: ModelRecord) => {
      try {
        // predictDate를 YYYYMMDD 형식으로 변환
        const predictDate = dayjs(row.predictionFulfillDt).format('YYYYMMDD')
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

  // 테이블 컬럼 정의
  const tableColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'target',
        headerName: 'Target',
        minWidth: 120,
        flex: 1,
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'runDate',
        headerName: 'Run Date',
        minWidth: 100,
        flex: 1,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'forecastPeriod',
        headerName: 'Forecast Date',
        minWidth: 150,
        flex: 1.5,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'referencePrice',
        headerName: 'Reference Price',
        minWidth: 130,
        flex: 1,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ value }) => (value ? value.toFixed(2) : '-'),
      },
      {
        field: 'forecastPrice',
        headerName: 'Forecast Price',
        minWidth: 130,
        flex: 1,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ value }) => (value ? value.toFixed(2) : '-'),
      },
      {
        field: 'actualPrice',
        headerName: 'Actual Price',
        minWidth: 120,
        flex: 1,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ value }) => (value ? value.toFixed(2) : '-'),
      },
      {
        field: 'forecastError',
        headerName: 'Forecast 오차율',
        minWidth: 120,
        flex: 1,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ value }) => (value ? `${value.toFixed(2)}%` : '-'),
      },
      {
        field: 'forecastDirection',
        headerName: 'Forecast Direction',
        minWidth: 150,
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <Box
            sx={{
              margin: '-10px -12px',
              height: 'calc(100% + 0px)',
              backgroundColor: row.isDirectionMatch ? '#C9DCF4' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 12px',
            }}
          >
            {row.forecastDirection}
          </Box>
        ),
      },
      {
        field: 'reportDownload',
        headerName: '설명역',
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
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
        ),
      },
      {
        field: 'dailyData',
        headerName: '일별데이터',
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        renderCell: () => (
          <MIBaseButton
            variant="outlined"
            onClick={() => {
              // 다운로드 로직 추가
            }}
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
    ],
    [handleDownload],
  )

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

  return (
    <Stack gap="20px" maxWidth="1380px" margin="auto" marginTop="40px">
      {/* Model Accuracy Section */}
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
              onClick={() => {
                // 테이블 다운로드 로직 추가
              }}
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
          <MITableUser
            tableProps={{
              noRowMessage: '등록된 내용이 없습니다.',
              columns: tableColumns,
              rows: modelRecordsData,
              rowId: 'id',
              sx: {
                '& .MuiDataGrid-cell[data-field="forecastDirection"]': {
                  position: 'relative',
                  padding: 0,
                },
              },
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
              paddingTop: '20px',
            }}
          />
        )}
      </Box>
    </Stack>
  )
}

export default RecordsTablePage
