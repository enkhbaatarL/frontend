import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
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
import forecastDataService, { ForecastBasicInfo, IForecastHistoryDetail } from '@/service/mi/forecast.ts'
import { downloadFile } from '@/utils/file.ts'

interface HistoryComponentProps {
  companyNo: number
  basicInfo?: ForecastBasicInfo
}

// 테이블에 표시할 가공된 데이터 타입
interface ProcessedHistoryData {
  date: string
  baselinePrice: string | number
  baselineChangeRate: string | number | null
  baselineSuffix: string
  isBaselineMaximum: boolean
  isBaselineMinimum: boolean
  baseline2Price: string | number
  baseline2ChangeRate: string | number | null
  baseline2Suffix: string
  isBaseline2Maximum: boolean
  isBaseline2Minimum: boolean
  isBaseline2Permitted: boolean
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
    queryFn: async () => await forecastDataService.getHistoryMetadata(),
  })

  // 히스토리 상세 데이터를 가져오는 쿼리
  const { data: historyDetailList, isLoading: historyDetailListIsLoading } = useQuery({
    queryKey: ['getDashboardHistoryDetail', selectedSettingDetailNo, selectedFulfillDate],
    queryFn: async () => {
      if (!selectedSettingDetailNo || !selectedFulfillDate) return null
      return await forecastDataService.getForecastHistoryDetail(selectedSettingDetailNo, {
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

    return historyDetailList.map((item: IForecastHistoryDetail) => ({
      date: item.date,
      download: item.download ?? false,
      baselinePrice: item.baseline?.stat?.price ?? '-',
      baselineChangeRate: item.baseline?.stat?.changeRate ?? '-',
      baselineSuffix: item.baseline?.suffix ?? '',
      baseline2Price: item.baseline2?.stat?.price ?? '-',
      baseline2ChangeRate: item.baseline2?.stat?.changeRate ?? '-',
      baseline2Suffix: item.baseline2?.suffix ?? '',
      counterpartPrice: item.counterpart?.stat?.price ?? '-',
      counterpartChangeRate: item.counterpart?.stat?.changeRate ?? '-',
      isBaselinePermitted: item.baseline?.isPermitted ?? false,
      isBaseline2Permitted: item.baseline2?.isPermitted ?? false,
      isCounterpartPermitted: item.counterpart?.isPermitted ?? false,
      isBaselineMaximum: item.baseline?.stat?.isMaximum ?? false,
      isBaselineMinimum: item.baseline?.stat?.isMinimum ?? false,
      isBaseline2Maximum: item.baseline2?.stat?.isMaximum ?? false,
      isBaseline2Minimum: item.baseline2?.stat?.isMinimum ?? false,
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
      const response = await forecastDataService.getForecastHistoryDetailDownload(selectedSettingDetailNo, {
        fulfillDate: selectedFulfillDate,
      })

      // 파일 다운로드 처리
      const fileName = `${metaData?.data?.predictTargetSettingNm}_${selectedFulfillDate}.xlsx`
      downloadFile(response.data, fileName)
    } catch {
      return
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
      const response = await forecastDataService.getForecastSummaryFileDownload(companyNo, selectedFulfillDate, date)

      const contentDisposition = response.headers?.['content-disposition'] ?? ''
      let fileName = ''

      // Content-Disposition 헤더에서 파일명 추출
      if (contentDisposition.includes('filename*=UTF-8\'\'')) {
        // UTF-8 인코딩된 파일명 처리
        const match = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/)
        if (match) {
          fileName = decodeURIComponent(match[1])
        }
      } else if (contentDisposition.includes('filename=')) {
        // 일반 파일명 처리
        const match = contentDisposition.match(/filename=([^;\n]*)/)
        if (match) {
          fileName = match[1].replace(/['"]/g, '')
        }
      }

      // 파일명을 추출할 수 없는 경우 기본 파일명 사용
      if (!fileName) {
        fileName = `${metaData?.data?.predictTargetSettingNm}_${selectedFulfillDate}.zip`
      }

      downloadFile(response.data, fileName)
    } catch {
      return
    }
  }

  // baseline2 데이터 유무에 따라 컬럼명 변경
  const hasBaseline2Data = processedTableData.some((row) => row.baseline2Price !== '-')

  const getColumnHeaders = () => {
    const firstRow = processedTableData[0]
    if (!firstRow) {
      return {
        baselineHeader: 'Forecast',
        baselineChangeRateHeader: 'Forecast 오차율',
        baseline2Header: 'Forecast',
        baseline2ChangeRateHeader: 'Forecast오차율',
      }
    }

    if (hasBaseline2Data && firstRow) {
      return {
        baselineHeader: 'Forecast M+1',
        baselineChangeRateHeader: 'Forecast M+1 오차율',
        baseline2Header: 'Forecast M+2',
        baseline2ChangeRateHeader: 'Forecast  M+2 오차율 ',
      }
    } else {
      return {
        baselineHeader: 'Forecast',
        baselineChangeRateHeader: 'Forecast 오차율',
        baseline2Header: 'Forecast',
        baseline2ChangeRateHeader: 'Forecast오차율',
      }
    }
  }

  const columnHeaders = getColumnHeaders()

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      renderCell: (param) => <MITableCell value={dayjs(param.value).format(dateFormat)} typography={{ variant: 'tableBody1' }} />,
    },
    {
      field: 'baselinePrice',
      headerName: columnHeaders.baselineHeader,
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
    // 에너지(2020)일 때만 baselineChangeRate 컬럼 추가
    ...(companyNo === 2020
      ? [
        {
          field: 'baselineChangeRate',
          headerName: columnHeaders.baselineChangeRateHeader,
          align: 'right' as const,
          flex: 1,
          renderCell: (param: GridRenderCellParams<ProcessedHistoryData>) => (
            <MITableCell>
              <Box sx={{ filter: !param.row.isBaselinePermitted ? 'blur(3px)' : 'none' }}>
                {param.value !== '-' && (
                  <Typography
                    variant={'tableBody2'}
                    fontWeight={param.value === '-' ? '400 !important' : '600 !important'}
                    color={param.value > 0 ? 'chart.green6' : param.value < 0 ? 'chart.red4' : 'gray.90'}
                  >
                    {param.value > 0 ? '+'.concat(param.value) : param.value}%
                  </Typography>
                )}
              </Box>
            </MITableCell>
          ),
        },
      ]
      : []),
    // baseline2 데이터가 있을 때만 컬럼 추가
    ...(hasBaseline2Data
      ? [
        {
          field: 'baseline2Price',
          headerName: columnHeaders.baseline2Header,
          align: 'right' as const,
          flex: 1,
          renderCell: (param: GridRenderCellParams<ProcessedHistoryData>) => (
            <MITableCell
              sx={{
                width: '100%',
                cursor: 'pointer',
                color: 'gray.70',
                display: 'flex',
                justifyContent: 'end',
                alignItems: 'center',
                backgroundColor: !param.row.isBaseline2Maximum && !param.row.isBaseline2Minimum ? 'unset' : '#F9F8F6',
                filter: !param.row.isBaseline2Permitted ? 'blur(3px)' : 'none',
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
              {param.row.isBaseline2Maximum ? <UpIcon /> : param.row.isBaseline2Minimum ? <DownIcon /> : ''}
              <Typography variant={'tableBody2'} color={'gray.90'}>
                {param.value}
              </Typography>
            </MITableCell>
          ),
        },
        // {
        //   field: 'baseline2ChangeRate',
        //   headerName: columnHeaders.baseline2ChangeRateHeader,
        //   align: 'right' as const,
        //   flex: 1,
        //   renderCell: (param: any) => (
        //     <MITableCell>
        //       <Box sx={{ filter: !param.row.isBaseline2Permitted ? 'blur(3px)' : 'none' }}>
        //         {param.value !== '-' && (
        //           <Typography
        //             variant={'tableBody2'}
        //             fontWeight={param.value === '-' ? '400 !important' : '600 !important'}
        //             color={param.value > 0 ? 'chart.green6' : param.value < 0 ? 'chart.red4' : 'gray.90'}
        //           >
        //             {param.value > 0 ? '+'.concat(param.value) : param.value}%
        //           </Typography>
        //         )}
        //       </Box>
        //     </MITableCell>
        //   ),
        // },
      ]
      : []),
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
    // {
    //   field: 'counterpartChangeRate',
    //   headerName: '실가 변화율',
    //   align: 'right',
    //   flex: 1,
    //   renderCell: (param) => (
    //     <MITableCell>
    //       <Box sx={{ filter: !param.row.isCounterpartPermitted ? 'blur(3px)' : 'none' }}>
    //         <Typography
    //           variant={'tableBody2'}
    //           fontWeight={param.value === '-' ? '400 !important' : '600 !important'}
    //           color={param.value > 0 ? 'chart.green6' : param.value < 0 ? 'chart.red4' : 'gray.90'}
    //         >
    //           {param.value > 0 ? '+'.concat(param.value) : param.value}
    //         </Typography>
    //       </Box>
    //     </MITableCell>
    //   ),
    // },
    {
      field: 'action',
      headerName: '리포트',
      align: 'right',
      flex: 1,
      renderCell: (param) => (
        <MITableCell>
          <Box
            onClick={() => {
              if (param.row.download) {
                handleDownload2(param.row.date)
              }
            }}
            sx={{
              padding: '4px 12px',
              color: !param.row.download ? 'content.iconDisabled' : 'content.iconEnabled',
              width: 'fit-content',
              float: 'right',
              borderRadius: '4px',
              marginRight: '-12px',
              display: 'flex',
              alignItems: 'center',
              cursor: param.row.download ? 'pointer' : 'not-allowed',
              '&:hover': {
                color: !param.row.download ? 'content.iconDisabled' : 'content.iconHover',
                backgroundColor: !param.row.download ? 'unset' : 'contentBG.Hover',
              },
            }}
          >
            {metaData?.data.isDownloadable && param.row.download && (
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
            {companyNo === 2020 && (
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
            )}
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
