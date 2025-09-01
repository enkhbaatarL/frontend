import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState, useEffect, useMemo } from 'react'

import MIButton from '@/components/common/button/MIButton.tsx'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon.tsx'
import DownIcon from '@/components/common/icons/table/DownIcon'
import UpIcon from '@/components/common/icons/table/UpIcon'
import MISelect from '@/components/common/select/MISelect'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import dashboardDataService, { DashboardBasicInfo, IDashboardHistoryDetail } from '@/service/mi/dashboardData.ts'
import { downloadFile } from '@/utils/file.ts'

interface HistoryComponentProps {
  companyNo: number
  basicInfo?: DashboardBasicInfo
}

// 테이블에 표시할 가공된 데이터 타입
interface ProcessedHistoryData {
  date: string
  baselinePrice: string | number
  baselineChangeRate: string | number | null
  isBaselineMaximum: boolean
  isBaselineMinimum: boolean
  counterpartPrice: string | number
  counterpartChangeRate: string | number | null
  isBaselinePermitted: boolean
  isCounterpartPermitted: boolean
  isCounterpartMaximum: boolean
  isCounterpartMinimum: boolean
}

const HistoryComponent = ({ companyNo, basicInfo }: HistoryComponentProps) => {
  // 선택된 값들을 상태로 관리
  const [selectedFulfillDate, setSelectedFulfillDate] = useState<string>('')
  const [selectedSettingDetailNo, setSelectedSettingDetailNo] = useState<number | null>(null)

  const { data: metaData, isLoading: metaDataIsLoading } = useQuery({
    queryKey: ['getDashboardHistoryMetaData'],
    queryFn: async () => await dashboardDataService.getHistoryMetadata(),
  })

  // 히스토리 상세 데이터를 가져오는 쿼리
  const { data: historyDetailList, isLoading: historyDetailListIsLoading } = useQuery({
    queryKey: ['getDashboardHistoryDetail', selectedSettingDetailNo, selectedFulfillDate],
    queryFn: async () => {
      if (!selectedSettingDetailNo || !selectedFulfillDate) return null
      return await dashboardDataService.getDashboardHistoryDetail(selectedSettingDetailNo, {
        fulfillDate: selectedFulfillDate,
      })
    },
    enabled: !!selectedSettingDetailNo && !!selectedFulfillDate,
  })

  // 날짜 포맷과 다운로드 표시 여부를 메모화
  const { dateFormat, showDownload } = useMemo(() => {
    const unitCode = metaData?.data?.predictPeriodUnitSeparateCd
    if (unitCode === 'M') {
      return { dateFormat: 'YY년 MM월', showDownload: true }
    } else if (unitCode === 'D') {
      return { dateFormat: 'MM월 DD일', showDownload: false }
    }
    return { dateFormat: 'YY-MM-DD', showDownload: false }
  }, [metaData?.data?.predictPeriodUnitSeparateCd])

  const processedTableData = useMemo((): ProcessedHistoryData[] => {
    if (!historyDetailList) return []

    return historyDetailList.map((item: IDashboardHistoryDetail) => ({
      date: item.date,
      baselinePrice: item.baseline?.stat?.price ?? '-',
      baselineChangeRate: item.baseline?.stat?.changeRate ?? '-',
      counterpartPrice: item.counterpart?.stat?.price ?? '-',
      counterpartChangeRate: item.counterpart?.stat?.changeRate ?? '-',
      isBaselinePermitted: item.baseline?.isPermitted ?? false,
      isCounterpartPermitted: item.counterpart?.isPermitted ?? false,
      isBaselineMaximum: item.baseline?.stat?.isMaximum ?? false,
      isBaselineMinimum: item.baseline?.stat?.isMinimum ?? false,
      isCounterpartMaximum: item.counterpart?.stat?.isMaximum ?? false,
      isCounterpartMinimum: item.counterpart?.stat?.isMinimum ?? false,
    }))
  }, [historyDetailList])

  // 메타데이터가 로드되면 기본값 설정
  useEffect(() => {
    if (metaData?.data) {
      // 첫 번째 fulfillmentDate를 기본값으로 설정
      if (metaData.data.targets[0]?.fulfillmentDates[0] && !selectedFulfillDate) {
        setSelectedFulfillDate(metaData.data.targets[0].fulfillmentDates[0])
      }

      // 첫 번째 settingDetail을 기본값으로 설정
      const firstSettingDetail = metaData.data.targets[0]?.settingDetails[0]
      if (firstSettingDetail && !selectedSettingDetailNo) {
        setSelectedSettingDetailNo(firstSettingDetail.settingDetailNo)
      }
    }
  }, [metaData, selectedFulfillDate, selectedSettingDetailNo])

  const handleDownload = async () => {
    if (!selectedSettingDetailNo || !selectedFulfillDate) return

    try {
      const response = await dashboardDataService.getDashboardHistoryDetailDownload(selectedSettingDetailNo, {
        fulfillDate: selectedFulfillDate,
      })

      // 파일 다운로드 처리
      const fileName = `${metaData?.data?.predictTargetSettingNm}_${selectedFulfillDate}.xlsx`
      downloadFile(response.data, fileName)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  // // 리포트 다운로드
  // const handleDownload2 = async (date: string) => {
  //   try {
  //     const response = await dashboardDataService.getDashboardSummaryFileDownload(companyNo, selectedFulfillDate, date)

  //     // 파일 다운로드 처리
  //     const fileName = `${metaData?.data?.predictTargetSettingNm}_${selectedFulfillDate}.zip`
  //     downloadFile(response.data, fileName)
  //   } catch (error) {
  //     console.error('Download failed:', error)
  //   }
  // }

  const handleDownload2 = async (date: string) => {
    try {
      const response = await dashboardDataService.getDashboardSummaryFileDownload(companyNo, selectedFulfillDate, date)

      const cd = response.headers?.['content-disposition'] ?? ''

      if (cd.includes('.zip')) {
        const fileName = `${metaData?.data?.predictTargetSettingNm}_${selectedFulfillDate}.zip`
        downloadFile(response.data, fileName)
      } else {
        const fileName = cd.split("''").pop().trim()
        downloadFile(response.data, fileName)
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      renderCell: (param) => <MITableCell value={dayjs(param.value).format(dateFormat)} typography={{ variant: 'tableBody1' }} />,
    },
    {
      field: 'baselinePrice',
      headerName: 'Forecast',
      align: 'right',
      flex: 1,
      renderCell: (param) => (
        <MITableCell
          sx={{
            width: '100%',
            cursor: 'pointer',
            color: 'gray.70',
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'center',
            backgroundColor: !param.row.isBaselineMaximum && !param.row.isBaselineMinimum ? 'unset' : '#F9F8F6',
            filter: !param.row.isBaselinePermitted ? 'blur(3px)' : 'none',
            '.MuiSvgIcon-root': {
              verticalAlign: 'text-top',
              marginRight: '4px',
            },
            '.MuiChip-label': {
              '.MuiTypography-root': {
                fontWeight: 600,
              },
            },
          }}
        >
          {param.row.isBaselineMaximum ? <UpIcon /> : param.row.isBaselineMinimum ? <DownIcon /> : ''}
          <Typography variant={'tableBody2'} color={'gray.90'}>
            {param.value}
          </Typography>
        </MITableCell>
      ),
    },
    {
      field: 'baselineChangeRate',
      headerName: '예측 변화율',
      align: 'right',
      flex: 1,
      renderCell: (param) => (
        <MITableCell>
          <Box sx={{ filter: !param.row.isBaselinePermitted ? 'blur(3px)' : 'none' }}>
            <Typography
              variant={'tableBody2'}
              fontWeight={param.value === '-' ? '400 !important' : '600 !important'}
              color={param.value > 0 ? 'chart.green6' : param.value < 0 ? 'chart.red4' : 'gray.90'}
            >
              {param.value > 0 ? '+'.concat(param.value) : param.value}
            </Typography>
          </Box>
        </MITableCell>
      ),
    },
    {
      field: 'counterpartPrice',
      headerName: 'Actual',
      align: 'right' as const,
      flex: 1,
      renderCell: (param) => (
        <MITableCell
          sx={{
            width: '100%',
            cursor: 'pointer',
            color: 'gray.70',
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'center',
            backgroundColor: !param.row.isCounterpartMaximum && !param.row.isCounterpartMinimum ? 'unset' : '#F9F8F6',
            '.MuiSvgIcon-root': {
              verticalAlign: 'text-top',
              marginRight: '4px',
            },
            '.MuiChip-label': {
              '.MuiTypography-root': {
                fontWeight: 600,
              },
            },
            ...(!param.row.isCounterpartMaximum && !param.row.isCounterpartMinimum
              ? {}
              : {
                  '.MuiTypography-root.MuiTypography-tableBody2': {
                    fontWeight: 600,
                  },
                }),
          }}
        >
          <Box
            sx={{
              filter: !param.row.isCounterpartPermitted ? 'blur(3px)' : 'none',
            }}
          >
            {param.row.isCounterpartMaximum ? <UpIcon /> : param.row.isCounterpartMinimum ? <DownIcon /> : ''}
            <Typography variant={'tableBody2'} color={'gray.90'}>
              {param.value}
            </Typography>
          </Box>
        </MITableCell>
      ),
    },
    {
      field: 'counterpartChangeRate',
      headerName: '실가 변화율',
      align: 'right',
      flex: 1,
      renderCell: (param) => (
        <MITableCell>
          <Box sx={{ filter: !param.row.isCounterpartPermitted ? 'blur(3px)' : 'none' }}>
            <Typography
              variant={'tableBody2'}
              fontWeight={param.value === '-' ? '400 !important' : '600 !important'}
              color={param.value > 0 ? 'chart.green6' : param.value < 0 ? 'chart.red4' : 'gray.90'}
            >
              {param.value > 0 ? '+'.concat(param.value) : param.value}
            </Typography>
          </Box>
        </MITableCell>
      ),
    },
    {
      field: 'action',
      headerName: '리포트',
      align: 'right',
      flex: 1,
      renderCell: (param) => (
        <MITableCell>
          <Box
            onClick={() => {
              if (param.row.baselinePrice !== '-') {
                handleDownload2(param.row.date)
              }
            }}
            sx={{
              padding: '4px 12px',
              color: param.row.baselinePrice === '-' ? 'content.iconDisabled' : 'content.iconEnabled',
              width: 'fit-content',
              float: 'right',
              borderRadius: '4px',
              marginRight: '-12px',
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                color: param.row.baselinePrice === '-' ? 'content.iconDisabled' : 'content.iconHover',
                backgroundColor: param.row.baselinePrice === '-' ? 'unset' : 'contentBG.Hover',
              },
            }}
          >
            {param.row.baselinePrice !== '-' && metaData?.data.isDownloadable && (
              <>
                <FileDownloadOutlinedIcon
                  fontSize={'small'}
                  style={{
                    verticalAlign: 'sub',
                    marginRight: '8px',
                  }}
                />
                <Typography
                  sx={{
                    fontWeight: '600 !important',
                    cursor: 'pointer !important',
                  }}
                  variant={'tableHeaderSemibold'}
                  color={'gray.70'}
                >
                  Download
                </Typography>
              </>
            )}
          </Box>
        </MITableCell>
      ),
    },
  ]

  const isLoading = metaDataIsLoading || historyDetailListIsLoading

  return (
    <Box>
      <Box paddingTop={7.5} paddingBottom={10} textAlign="center">
        <Typography component={'div'} color="gray.90" variant="heading0">
          {basicInfo?.chartPredictSettingNm}
        </Typography>
        <Typography component={'div'} color="#495057" variant="subtext0">
          Updated {dayjs(basicInfo?.lastUpdateDt).format('YYYY-MM-DD')}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: '20px',
          borderColor: 'divider',
          justifyContent: 'space-between',
        }}
      >
        {/* Selectors */}
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Typography variant="body3R14" color="contentText.Normal">
              예측시점
            </Typography>
            <MISelect
              width={200}
              type="button"
              value={selectedFulfillDate}
              onChange={(e) => setSelectedFulfillDate(String(e.target.value))}
              options={
                metaData?.data.targets[0]?.fulfillmentDates.map((ffd) => ({
                  label: dayjs(ffd).format('YYYY년 MM월 DD일'),
                  value: ffd,
                })) ?? []
              }
            />
            <MISelect
              width={220}
              type="button"
              value={selectedSettingDetailNo?.toString() || ''}
              onChange={(e) => setSelectedSettingDetailNo(Number(e.target.value))}
              options={
                metaData?.data.targets
                  .flatMap((target) =>
                    target.settingDetails.map((settingDetail) => ({
                      label: settingDetail.settingDetailExpn,
                      value: settingDetail.settingDetailNo.toString(),
                    })),
                  )
                  .filter((option, index, self) => index === self.findIndex((item) => item.value === option.value)) ?? []
              }
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Unit */}
          {metaData?.data.currency && metaData?.data.unit && (
            <Typography variant="body2" color="#374151" sx={{ whiteSpace: 'nowrap', mr: '8px', lineHeight: '1.6' }}>
              Unit: {metaData?.data.currency} / {metaData?.data.unit}
            </Typography>
          )}

          <MIButton
            startIcon={<ChartDownloadIcon />}
            onClick={handleDownload}
            contentType={'icon'}
            type={'outlined'}
            disabled={!metaData?.data?.isDownloadable}
            toolTipProps={{
              placement: 'top',
              slotProps: {
                popper: {
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, -10],
                      },
                    },
                  ],
                },
              },
            }}
            toolTip={<Typography variant="subtext2">다운로드</Typography>}
          />
        </Box>
      </Box>

      {metaDataIsLoading ? (
        <MIBaseSkeleton.BaseElement2 width={'100%'} height={'424px'} />
      ) : (
        <MITableUser
          hidePagination={true}
          tableProps={{
            noRowMessage: '등록된 내용이 없습니다.',
            disableHover: true,
            columns: showDownload ? columns : columns.slice(0, -1),
            rowId: 'date',
            rows: processedTableData,
            loading: isLoading,
          }}
        />
      )}
    </Box>
  )
}

export default HistoryComponent
