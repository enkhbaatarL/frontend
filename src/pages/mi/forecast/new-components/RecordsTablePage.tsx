import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'

import forecastTargetIcon from '@/assets/icons/forecast-target.svg'
import forecastVectorIcon from '@/assets/icons/forecast-vector.svg'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import MIDateRangePickerMenu, { DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MITableUser from '@/components/common/table/MITableUser'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import { IForecastChartData, IForecastReport } from '@/service/mi/forecast'
import theme from '@/theming'

interface RecordsTablePageProps {
  chartData?: IForecastChartData
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
  reportDownloadUrl?: string
  dailyDataDownloadUrl?: string
}

const RecordsTablePage = ({ chartDataIsLoading }: RecordsTablePageProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedTarget, setSelectedTarget] = useState<string>('All Targets')
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

  // 임시 Model Records 데이터
  const modelRecordsData: ModelRecord[] = useMemo(
    () => [
      {
        id: '1',
        target: 'Brent Crude',
        runDate: '25/12/01',
        forecastPeriod: '25/12/17-25/12/19',
        referencePrice: 71.04,
        forecastPrice: 71.04,
        actualPrice: 71.04,
        forecastError: 1.42,
        forecastDirection: 'Upward',
        isDirectionMatch: true,
      },
      {
        id: '2',
        target: 'Dubai Crude',
        runDate: '25/12/01',
        forecastPeriod: '25/12/15-25/12/19',
        referencePrice: 71.04,
        forecastPrice: 71.04,
        actualPrice: 71.04,
        forecastError: 1.42,
        forecastDirection: 'Downward',
        isDirectionMatch: true,
      },
      // 더 많은 데이터는 나중에 API에서 가져올 예정
    ],
    [],
  )

  // 필터링된 Records 데이터
  const filteredRecords = useMemo(() => {
    let filtered = [...modelRecordsData]

    // Target 필터
    if (selectedTarget !== 'All Targets') {
      filtered = filtered.filter((record) => record.target === selectedTarget)
    }

    // 정렬
    if (sortOrder === 'OLDEST') {
      filtered = filtered.sort((a, b) => a.runDate.localeCompare(b.runDate))
    } else {
      filtered = filtered.sort((a, b) => b.runDate.localeCompare(a.runDate))
    }

    return filtered
  }, [modelRecordsData, selectedTarget, sortOrder])

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
        headerName: 'Forecast Period',
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
        headerName: 'Forecast Error',
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
        headerName: 'Report Download',
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
      {
        field: 'dailyData',
        headerName: 'Daily Data',
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
    [],
  )

  // 페이지네이션
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredRecords.slice(startIndex, startIndex + pageSize)
  }, [filteredRecords, page, pageSize])

  const paginationMeta = useMemo(
    () => ({
      totalPages: Math.max(1, Math.ceil(filteredRecords.length / pageSize)),
      totalElements: filteredRecords.length,
      currentPage: page,
      numberOfElements: paginatedRows.length,
      size: pageSize,
      isFirst: page <= 1,
      isLast: page >= Math.ceil(filteredRecords.length / pageSize),
      hasPrevious: page > 1,
      hasNext: page < Math.ceil(filteredRecords.length / pageSize),
      detail: paginatedRows,
    }),
    [filteredRecords.length, page, pageSize, paginatedRows],
  )

  // Target 옵션 (임시로 chartData에서 추출하거나 하드코딩)
  const targetOptions = useMemo(
    () => [
      { label: 'All Targets', value: 'All Targets' },
      { label: 'Brent Crude', value: 'Brent Crude' },
      { label: 'Dubai Crude', value: 'Dubai Crude' },
    ],
    [],
  )

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
              onSelected={(value: string) => setSelectedTarget(value)}
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
              onSelected={(value: string) => setSortOrder(value)}
              sx={{ height: '36px' }}
              enableHoverBackground
            />
            <MIDateRangePickerMenu
              onApply={setDateRange}
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
        {chartDataIsLoading ? (
          <MIBaseSkeleton.BaseElement2 width={'100%'} height={'400px'} />
        ) : (
          <MITableUser
            tableProps={{
              noRowMessage: '등록된 내용이 없습니다.',
              columns: tableColumns,
              rows: paginatedRows,
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
