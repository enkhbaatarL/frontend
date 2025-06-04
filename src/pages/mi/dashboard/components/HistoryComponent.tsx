import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState, useEffect, useMemo } from 'react'

import DownloadIcon from '@/components/common/icons/DownloadIcon'
import DownIcon from '@/components/common/icons/table/DownIcon'
import UpIcon from '@/components/common/icons/table/UpIcon'
import MISelect from '@/components/common/select/MISelect'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import dashboardDataService, { DashboardBasicInfo, IDashboardHistoryDetail } from '@/service/mi/dashboardData.ts'

interface HistoryComponentProps {
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

const HistoryComponent = ({ basicInfo }: HistoryComponentProps) => {
  // 선택된 값들을 상태로 관리
  const [selectedFulfillDate, setSelectedFulfillDate] = useState<string>('')
  const [selectedSettingDetailNo, setSelectedSettingDetailNo] = useState<number | null>(null)

  const { data: metaData } = useQuery({
    queryKey: ['getDashboardHistoryMetaData'],
    queryFn: async () => await dashboardDataService.getHistoryMetadata(),
  })

  // 히스토리 상세 데이터를 가져오는 쿼리
  const { data: historyDetailList, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['getDashboardHistoryDetail', selectedSettingDetailNo, selectedFulfillDate],
    queryFn: async () => {
      if (!selectedSettingDetailNo || !selectedFulfillDate) return null
      return await dashboardDataService.getDashboardHistoryDetail(selectedSettingDetailNo, {
        fulfillDate: selectedFulfillDate,
      })
    },
    enabled: !!selectedSettingDetailNo && !!selectedFulfillDate,
  })

  // 원시 데이터를 테이블에 맞게 가공
  const processedTableData = useMemo((): ProcessedHistoryData[] => {
    if (!historyDetailList) return []

    return historyDetailList.map((item: IDashboardHistoryDetail) => {
      // predictPeriodUnitSeparateCd에 따른 날짜 포맷 결정
      const getDateFormat = () => {
        const unitCode = metaData?.data?.predictPeriodUnitSeparateCd
        if (unitCode === 'M') {
          return 'YYYY년 MM월'
        } else if (unitCode === 'D') {
          return 'MM월 DD일'
        }
        return 'YYYY-MM-DD' // 기본값
      }

      return {
        date: dayjs(item.date).format(getDateFormat()),
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
      }
    })
  }, [historyDetailList, metaData?.data?.predictPeriodUnitSeparateCd])

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
      const blob = await dashboardDataService.getDashboardHistoryDetailDownload(selectedSettingDetailNo, {
        fulfillDate: selectedFulfillDate,
      })

      // 파일 다운로드 처리
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `history_${selectedFulfillDate}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <Box>
      <Box paddingTop={7.5} paddingBottom={10} textAlign="center">
        <Typography component={'div'} color="gray.90" variant="heading0">
          {basicInfo?.chartPredictSettingNm}
        </Typography>
        <Typography component={'div'} color="#495057" variant="subtext0">
          Last Updated {dayjs(basicInfo?.lastUpdateDt).format('MMM D, YYYY')}
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
          <Typography variant="body2" color="#374151" sx={{ whiteSpace: 'nowrap', mr: '8px', lineHeight: '1.6' }}>
            Unit: {metaData?.data.currency}/{metaData?.data.unit}
          </Typography>

          <Box
            onClick={handleDownload}
            sx={{
              width: '32px',
              height: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'contentIcon.Enabled',
              border: '1px solid',
              borderColor: 'gray.8',
              borderRadius: '4px',
              '&:hover': {
                color: 'contentIcon.Hover',
                cursor: 'pointer',
                backgroundColor: 'contentBG.Hover',
              },
            }}
          >
            <DownloadIcon />
          </Box>
        </Box>
      </Box>

      <MITableUser
        tableProps={{
          loading: isLoadingHistory,
          noRowMessage: '등록된 내용이 없습니다.',
          columns: [
            {
              field: 'date',
              headerName: 'Date',
              renderCell: (param) => <MITableCell value={param.value} typography={{ variant: 'tableBody1' }} />,
            },
            {
              field: 'baselinePrice',
              headerName: 'Forecast',
              align: 'right',
              flex: 1,
              renderCell: (param) => (
                <MITableCell>
                  <Box
                    sx={{
                      width: '100%',
                      cursor: 'pointer',
                      color: 'gray.70',
                      display: 'flex',
                      justifyContent: 'end',
                      alignItems: 'center',
                      backgroundColor: !param.row.isBaselineMaximum && !param.row.isBaselineMinimum ? 'unset' : '#F9F8F6',
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
                  </Box>
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
                      {param.value || '-'}
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
                <MITableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 1,
                      filter: !param.row.isCounterpartPermitted ? 'blur(3px)' : 'none',
                    }}
                  >
                    {param.row.isCounterpartMaximum ? <UpIcon /> : param.row.isCounterpartMinimum ? <DownIcon /> : ''}
                    <Typography variant={'tableBody2'} color={'gray.90'}>
                      {param.value || '-'}
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
                      {param.value || '-'}
                    </Typography>
                  </Box>
                </MITableCell>
              ),
            },
          ],
          rowId: 'date',
          rows: processedTableData,
        }}
      />
    </Box>
  )
}

export default HistoryComponent
