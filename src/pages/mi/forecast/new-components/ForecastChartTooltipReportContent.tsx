import { LabelImportantRounded, InfoOutlined } from '@mui/icons-material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Divider, Stack, Tooltip, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ReactNode, memo, useMemo, useRef, useState, useCallback, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'

import crudeOilIcon from '@/assets/icons/crude-oil.png'
import defaultIcon from '@/assets/icons/default.png'
import evBatteryIcon from '@/assets/icons/ev-battery.png'
import lngIcon from '@/assets/icons/lng.png'
import semiconductorIcon from '@/assets/icons/semiconductor.png'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import ForecastChartGraph, { ForecastChartGraphHandle } from '@/pages/mi/forecast/new-components/ForecastChartGraph'
import ForecastChartTooltipReportContentTab from '@/pages/mi/forecast/new-components/ForecastChartTooltipReportContentTap'
import forecastDataService from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'
import theme from '@/theming'
import { ChartData, ChartType } from '@/types/dataDetailChart'

interface InfoLabelProps {
  label: string
  value: ReactNode
  description?: string
}

const NoDataPlaceholder = () => (
  <Stack padding="12px" minHeight={120} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
    <Typography variant="body2SB14" color="gray.50">
      No data available to display.
    </Typography>
  </Stack>
)

const InfoLabel = ({ label, value, description }: InfoLabelProps) => (
  <Stack>
    <Typography variant="body2SB14" color="contentText.Subtext">
      {label}
    </Typography>
    {typeof value === 'string' ? (
      <Typography variant="messageText1" color="contentText.Black">
        {value}
      </Typography>
    ) : (
      value
    )}
    <Typography variant="body2M14" color="contentText.Subtext">
      {description}
    </Typography>
  </Stack>
)

const ContentTab = ({
  explanatoryLevelNms,
  onCategoryChange,
}: {
  explanatoryLevelNms?: string[]
  onCategoryChange?: (category: string) => void
}) => (
  <HorizontalScrollContainer pt="20px" pb="0" scrollAmount={0.6} buttonPadding={8}>
    <ForecastChartTooltipReportContentTab explanatoryLevelNms={explanatoryLevelNms} onCategoryChange={onCategoryChange} />
  </HorizontalScrollContainer>
)

interface ForecastChartTooltipReportContentProps {
  goodsDataSourceNo?: number
  date?: string
  isVisible?: boolean
}

const ForecastChartTooltipReportContent = memo(({ goodsDataSourceNo, date, isVisible = false }: ForecastChartTooltipReportContentProps) => {
  const chartGraphRef = useRef<ForecastChartGraphHandle>(null)
  const navigate = useNavigate()
  const { accessCompanyInfo, user } = useAuthStore()
  const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.userNo
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null)

  // predictDate를 YYYYMMDD 형식으로 변환
  const predictDate = useMemo(() => {
    if (!date) return dayjs().format('YYYYMMDD')
    // date가 "Index: X" 형식인 경우 처리
    if (date.startsWith('Index:')) return dayjs().format('YYYYMMDD')
    // YYYY/MM/DD 형식을 YYYYMMDD로 변환
    try {
      return dayjs(date).format('YYYYMMDD')
    } catch {
      return dayjs().format('YYYYMMDD')
    }
  }, [date])

  // marketIndexAnalysisTargetCd에 따라 아이콘 선택
  const getMarketIcon = (code: string): string => {
    if (code === 'EN_CROIL') {
      return crudeOilIcon
    } else if (code === 'EN_LNG') {
      return lngIcon
    } else if (code === 'BTRY_DMD') {
      return evBatteryIcon
    } else if (code === 'SCDT_DMD' || code === 'SCDT_PRC') {
      return semiconductorIcon
    } else {
      return defaultIcon
    }
  }

  // 카테고리 목록 조회
  const { data: factorCategory, isLoading: isLoadingFactorCategory } = useQuery({
    queryKey: ['forecastFactorCategoryNew', companyNo, goodsDataSourceNo, predictDate],
    queryFn: () =>
      forecastDataService.getForecastFactorCategoryNew(companyNo ?? 0, {
        predictDate,
        goodsDataSourceNo: goodsDataSourceNo ?? 0,
      }),
    enabled: isVisible && !!companyNo && !!goodsDataSourceNo && !!date && !date.startsWith('Index:'),
  })

  // 선택된 카테고리로 factors 조회
  const { data: factors, isLoading: isLoadingFactors } = useQuery({
    queryKey: ['forecastFactorsNew', companyNo, goodsDataSourceNo, predictDate, selectedCategory],
    queryFn: () =>
      forecastDataService.getForecastFactorsNew(companyNo ?? 0, {
        predictDate,
        goodsDataSourceNo: goodsDataSourceNo ?? 0,
        explanatoryLevelNm: selectedCategory ?? '',
      }),
    enabled: isVisible && !!companyNo && !!goodsDataSourceNo && !!selectedCategory && !!date && !date.startsWith('Index:'),
  })

  const marketIcon = getMarketIcon(factorCategory?.marketIndexAnalysisTargetCd ?? '')

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    setSelectedFactor(null) // 카테고리 변경 시 선택된 factor 초기화
  }, [])

  // 선택된 factor 객체 찾기
  const selectedFactorObj = useMemo(() => {
    if (!selectedFactor || !factors) return null

    // plusFactors에서 찾기
    const plusFactor = (factors.plusFactors || []).find((factor, index) => {
      const factorId = `plus-${factor.predictionInputMnemonicCd}-${factor.predictionInputMnemonicDetailCd}-${index}`
      return factorId === selectedFactor
    })
    if (plusFactor) return plusFactor

    // minusFactors에서 찾기
    const minusFactor = (factors.minusFactors || []).find((factor, index) => {
      const factorId = `minus-${factor.predictionInputMnemonicCd}-${factor.predictionInputMnemonicDetailCd}-${index}`
      return factorId === selectedFactor
    })
    if (minusFactor) return minusFactor

    return null
  }, [selectedFactor, factors])

  // date를 YYYYMM 형식으로 변환 (optional)
  const dateYYYYMM = useMemo(() => {
    if (!date) return undefined
    if (date.startsWith('Index:')) return undefined
    try {
      return dayjs(date).format('YYYYMM')
    } catch {
      return undefined
    }
  }, [date])

  // 선택된 factor의 그래프 데이터 조회
  const { data: factorGraph, isLoading: isLoadingFactorGraph } = useQuery({
    queryKey: [
      'forecastFactorGraphNew',
      companyNo,
      goodsDataSourceNo,
      predictDate,
      selectedFactorObj?.marketIndexAnalysisTargetCd,
      selectedFactorObj?.predictionInputMnemonicCd,
      selectedFactorObj?.predictionInputMnemonicDetailCd,
      selectedCategory,
      dateYYYYMM,
    ],
    queryFn: () => {
      if (!selectedFactorObj) throw new Error('No factor selected')
      return forecastDataService.getForecastFactorGraphNew(companyNo ?? 0, {
        predictDate,
        goodsDataSourceNo: goodsDataSourceNo ?? 0,
        explanatoryLevelNm: selectedCategory ?? '',
        predictionInputMnemonicCd: selectedFactorObj.predictionInputMnemonicCd,
        marketIndexAnalysisTargetCd: selectedFactorObj.marketIndexAnalysisTargetCd,
        predictionInputMnemonicDetailCd: selectedFactorObj.predictionInputMnemonicDetailCd,
        date: dateYYYYMM,
      })
    },
    enabled:
      isVisible && !!companyNo && !!goodsDataSourceNo && !!selectedFactorObj && !!selectedCategory && !!date && !date.startsWith('Index:'),
  })

  // factorGraph 데이터를 ChartData 형식으로 변환
  const factorChartData = useMemo<ChartData[]>(() => {
    if (!factorGraph?.rawData || !factorGraph.datasource) return []

    const timestamps = factorGraph.rawData.map((item) => {
      // resultDate를 ISO 형식으로 변환
      try {
        return dayjs(item.resultDate).toISOString()
      } catch {
        return item.resultDate
      }
    })

    const values = factorGraph.rawData.map((item) => {
      const value = item.value
      if (value === null || value === undefined) {
        return 0
      }
      return Number(value)
    })

    return [
      {
        goodsNo: factorGraph.datasource.goodsNo,
        goodsDataNo: factorGraph.datasource.goodsDataNo,
        goodsDataName: factorGraph.datasource.goodsDataSourceNm,
        goodsDataSourceNo: factorGraph.datasource.goodsDataSourceNo,
        goodsDataSourceName: factorGraph.datasource.goodsDataSourceNm,
        unitCd: factorGraph.graphMetadata.currentUnitCd,
        chartType: ChartType.LINE,
        timestamps,
        series: [
          {
            seriesId: 'main',
            label: factorGraph.datasource.goodsDataSourceNm,
            renderAs: 'MAIN',
            values,
            isVisible: true,
          },
        ],
      },
    ]
  }, [factorGraph])

  const handleFactorClick = useCallback((factorId: string) => {
    setSelectedFactor(factorId)
  }, [])

  // 카테고리 목록이 로드되면 첫 번째 카테고리 자동 선택
  useEffect(() => {
    if (factorCategory?.explanatoryLevelNms && factorCategory.explanatoryLevelNms.length > 0 && !selectedCategory) {
      setSelectedCategory(factorCategory.explanatoryLevelNms[0])
    }
  }, [factorCategory, selectedCategory])

  // PRICE EXP.
  const priceExpValue = useMemo<ReactNode>(() => {
    const avg = factorCategory?.avgPredictionResultVal
    if (avg === undefined || avg === null) return '-'
    const diffVal = factorCategory?.predictionResultDiffVal
    const diffRate = factorCategory?.predictionResultDiffRate
    const hasDiff = diffVal !== undefined && diffVal !== null && diffRate !== undefined && diffRate !== null
    return (
      <Stack direction="row" alignItems="baseline" gap="4px">
        <Typography variant="messageText1" color="contentText.Black">
          {avg.toFixed(2)}
        </Typography>
        {hasDiff && (
          <Typography variant="messageText1" color={diffVal >= 0 ? 'increase.main' : 'decrease.main'}>
            {diffVal >= 0 ? '+' : ''}
            {diffVal.toFixed(2)}({diffRate! >= 0 ? '+' : ''}
            {diffRate!.toFixed(2)}%)
          </Typography>
        )}
      </Stack>
    )
  }, [factorCategory?.avgPredictionResultVal, factorCategory?.predictionResultDiffVal, factorCategory?.predictionResultDiffRate])

  const showHeaderSkeleton = isVisible && (isLoadingFactorCategory || !factorCategory)
  const showFactorsSkeleton = showHeaderSkeleton || (!!selectedCategory && isLoadingFactors)
  const hasPlusFactors = (factors?.plusFactors?.length ?? 0) > 0
  const hasMinusFactors = (factors?.minusFactors?.length ?? 0) > 0
  const hasAnySubFactors = hasPlusFactors || hasMinusFactors

  return (
    <Stack>
      {/* 상단 정보: 로딩 시 해당 위치만 스켈레톤 */}
      {showHeaderSkeleton ? (
        <Stack
          padding="20px 38px"
          direction="row"
          justifyContent="space-between"
          gap="24px"
          borderBottom="1px solid"
          borderColor="contentBorder.Normal"
        >
          <Stack direction="row" alignItems="start" gap="24px" flex={1}>
            <Stack direction="row" gap="12px">
              <MIBaseSkeleton.Avatar width={52} height={52} sx={{ borderRadius: '10px' }} />
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={80} height={12} />
                <MIBaseSkeleton.TextLine width={120} height={16} />
              </Stack>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
            <Stack gap="20px">
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <MIBaseSkeleton.TextLine width={180} height={16} />
                <MIBaseSkeleton.TextLine width={120} height={12} />
              </Stack>
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <MIBaseSkeleton.TextLine width={150} height={16} />
                <MIBaseSkeleton.TextLine width={120} height={12} />
              </Stack>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
            <Stack gap="20px">
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <Stack direction="row" gap="4px" alignItems="baseline">
                  <MIBaseSkeleton.TextLine width={80} height={16} />
                  <MIBaseSkeleton.TextLine width={100} height={16} />
                </Stack>
                <MIBaseSkeleton.TextLine width={150} height={12} />
              </Stack>
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <MIBaseSkeleton.TextLine width={100} height={16} />
                <MIBaseSkeleton.TextLine width={150} height={12} />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      ) : (
        <Stack
          padding="20px 38px"
          direction="row"
          justifyContent="space-between"
          gap="24px"
          borderBottom="1px solid"
          borderColor="contentBorder.Normal"
          boxSizing="border-box"
        >
          <Stack direction="row" alignItems="start" gap="24px">
            <Stack direction="row" gap="12px">
              <Box
                width="52px"
                height="52px"
                bgcolor="contentBG.Active"
                borderRadius="10px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Box
                  component="img"
                  src={marketIcon}
                  alt="Market Icon"
                  sx={{
                    width: '43px',
                    height: '43px',
                    objectFit: 'contain',
                  }}
                  draggable={false}
                />
              </Box>
              <InfoLabel label="TARGET" value={factorCategory?.predictChartDetailExpn || '-'} />
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
            <Stack gap="20px">
              <InfoLabel
                label="TARGET DATE"
                value={
                  factorCategory?.endPredictionResultDt ? dayjs(factorCategory.endPredictionResultDt, 'YYYYMMDD').format('YYYY/MM/DD') : '-'
                }
                description={
                  factorCategory?.startPredictionResultDt && factorCategory?.endPredictionResultDt
                    ? `${dayjs(factorCategory.endPredictionResultDt, 'YYYYMMDD').diff(
                      dayjs(factorCategory.startPredictionResultDt, 'YYYYMMDD'),
                      'day',
                    )} days`
                    : undefined
                }
              />
              <InfoLabel
                label="RUN DATE"
                value={
                  factorCategory?.predictionFulfillDt ? dayjs(factorCategory.predictionFulfillDt, 'YYYYMMDD').format('YYYY/MM/DD') : '-'
                }
                description="Model execution date"
              />
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
            <Stack gap="20px">
              <InfoLabel label="PRICE EXP." value={priceExpValue} description="Compare to reference price" />
              <InfoLabel
                label="REFERENCE PRICE"
                value={
                  factorCategory?.predictionCriteriaVal !== undefined && factorCategory?.predictionCriteriaVal !== null
                    ? factorCategory.predictionCriteriaVal.toFixed(2)
                    : '-'
                }
                description={
                  factorCategory?.predictionCriteriaDt
                    ? `${dayjs(factorCategory.predictionCriteriaDt, 'YYYYMMDD').format('YY/MM/DD')} · S&P Global Platts`
                    : undefined
                }
              />
            </Stack>
          </Stack>
          <Stack minWidth="136px" alignItems="start" gap="8px" />
        </Stack>
      )}

      {/* MAIN FACTORS 제목: 항상 동일 */}
      <Stack padding="20px 38px 0 38px" gap="24px">
        <Stack direction="row" alignItems="center" gap="6px">
          <LabelImportantRounded sx={{ color: theme.palette.contentIcon.Activeb }} />
          <Typography variant="body1SB16" color="contentText.Black" sx={{ userSelect: 'none' }}>
            MAIN FACTORS
          </Typography>
          <Tooltip
            title="예측 결과에 영향을 미친 주요 요인별 카테고리"
            placement="top-start"
            disableInteractive
            slotProps={{
              popper: {
                modifiers: [{ name: 'offset', options: { offset: [-8, -8] } }],
              },
            }}
          >
            <InfoOutlined fontSize="small" sx={{ color: theme.palette.contentIcon.Enabled }} />
          </Tooltip>
        </Stack>
      </Stack>

      {/* 탭: 카테고리 로딩 시 해당 위치만 스켈레톤 */}
      <Stack sx={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Box
          width="100%"
          position="relative"
          boxSizing="border-box"
          mb="20px"
          sx={{
            '& .tab-section-line': {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: theme.palette.contentBorder?.Normal ?? '#E0E0E0',
              zIndex: 0,
            },
          }}
        >
          <Box className="tab-section-line" />
          <Box position="relative" zIndex={1}>
            {!showHeaderSkeleton && (
              <ContentTab explanatoryLevelNms={factorCategory?.explanatoryLevelNms} onCategoryChange={handleCategoryChange} />
            )}
          </Box>
        </Box>

        {/* 카테고리 요약: factors 로딩 시 해당 위치만 스켈레톤 */}
        {showFactorsSkeleton ? (
          <Stack padding="12px 38px">
            <MIBaseSkeleton.TextLine width="90%" height={18} />
          </Stack>
        ) : (
          factors?.categorySummary && (
            <Typography padding="12px 38px" fontSize="18px" fontWeight={500} lineHeight="1.4" color="contentText.Black">
              {factors.categorySummary}
            </Typography>
          )
        )}

        {/* UPWARD/DOWNWARD 카드: factors 로딩 시 해당 위치만 스켈레톤 */}
        <Stack padding="12px 38px" mb="24px" boxSizing="border-box" sx={{ userSelect: 'none' }}>
          <Stack padding="24px" gap="24px" borderRadius="10px" border="1px solid" borderColor="contentBorder.Active" boxSizing="border-box">
            {showFactorsSkeleton ? (
              <Stack direction="row" gap="24px">
                <Stack flex={1} gap="8px">
                  <Stack direction="row" alignItems="center" gap="6px">
                    <MIBaseSkeleton.Avatar width={24} height={24} />
                    <MIBaseSkeleton.TextLine width={180} height={18} />
                  </Stack>
                  <Stack gap="4px">
                    {[1, 2, 3].map((i) => (
                      <Stack key={i} direction="row" padding="8px" alignItems="center" gap="8px">
                        <MIBaseSkeleton.Avatar width={60} height={28} sx={{ borderRadius: '6px' }} />
                        <MIBaseSkeleton.TextLine width="70%" height={16} />
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
                <Stack flex={1} gap="8px">
                  <Stack direction="row" alignItems="center" gap="6px">
                    <MIBaseSkeleton.Avatar width={24} height={24} />
                    <MIBaseSkeleton.TextLine width={200} height={18} />
                  </Stack>
                  <Stack gap="4px">
                    {[1, 2, 3].map((i) => (
                      <Stack key={i} direction="row" padding="8px" alignItems="center" gap="8px">
                        <MIBaseSkeleton.Avatar width={60} height={28} sx={{ borderRadius: '6px' }} />
                        <MIBaseSkeleton.TextLine width="70%" height={16} />
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            ) : (
              <Fragment>
                {!hasAnySubFactors ? (
                  <NoDataPlaceholder />
                ) : (
                  <Stack direction="row" gap="24px">
                    <Stack flex={1} gap="8px" sx={{ minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" gap="6px">
                        <TrendingUpIcon sx={{ color: theme.palette.contentIcon.Activeb }} />
                        <Typography variant="body1SB16" color="contentText.Black" sx={{ userSelect: 'none' }}>
                          UPWARD SUB-FACTORS
                        </Typography>
                      </Stack>
                      <Stack gap="4px">
                        {hasPlusFactors ? (
                          factors!.plusFactors!.map((factor, index) => {
                            const factorId = `plus-${factor.predictionInputMnemonicCd}-${factor.predictionInputMnemonicDetailCd}-${index}`
                            const isSelected = selectedFactor === factorId
                            return (
                              <Stack
                                key={factorId}
                                direction="row"
                                padding="8px"
                                alignItems="center"
                                gap="8px"
                                boxSizing="border-box"
                                sx={{
                                  minWidth: 0,
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected ? 'contentBG.Active' : 'transparent',
                                  '&:hover': {
                                    backgroundColor: 'contentBG.Hover',
                                  },
                                }}
                                onClick={() => handleFactorClick(factorId)}
                              >
                                <Box
                                  display="flex"
                                  flexShrink={0}
                                  alignItems="center"
                                  justifyContent="center"
                                  width="60px"
                                  height="28px"
                                  borderRadius="6px"
                                  bgcolor="increase.main"
                                >
                                  <Typography variant="body1" color="contentText.White">
                                    {factor.explanatoryScore.toFixed(2)}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="body2M14"
                                  color="contentText.Black"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {factor.explanatoryLevelDetailNm}
                                </Typography>
                              </Stack>
                            )
                          })
                        ) : (
                          <NoDataPlaceholder />
                        )}
                      </Stack>
                    </Stack>
                    <Stack flex={1} gap="8px" sx={{ minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" gap="6px">
                        <TrendingDownIcon sx={{ color: theme.palette.contentIcon.Activeb }} />
                        <Typography variant="body1SB16" color="contentText.Black" sx={{ userSelect: 'none' }}>
                          DOWNWARD SUB-FACTORS
                        </Typography>
                      </Stack>
                      <Stack gap="4px">
                        {hasMinusFactors ? (
                          factors!.minusFactors!.map((factor, index) => {
                            const factorId = `minus-${factor.predictionInputMnemonicCd}-${factor.predictionInputMnemonicDetailCd}-${index}`
                            const isSelected = selectedFactor === factorId
                            return (
                              <Stack
                                key={factorId}
                                direction="row"
                                padding="8px"
                                alignItems="center"
                                gap="8px"
                                boxSizing="border-box"
                                sx={{
                                  minWidth: 0,
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected ? 'contentBG.Active' : 'transparent',
                                  '&:hover': {
                                    backgroundColor: 'contentBG.Hover',
                                  },
                                }}
                                onClick={() => handleFactorClick(factorId)}
                              >
                                <Box
                                  display="flex"
                                  flexShrink={0}
                                  alignItems="center"
                                  justifyContent="center"
                                  width="60px"
                                  height="28px"
                                  borderRadius="6px"
                                  bgcolor="decrease.main"
                                >
                                  <Typography variant="body1" color="contentText.White">
                                    {factor.explanatoryScore.toFixed(2)}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="body2M14"
                                  color="contentText.Black"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {factor.explanatoryLevelDetailNm}
                                </Typography>
                              </Stack>
                            )
                          })
                        ) : (
                          <NoDataPlaceholder />
                        )}
                      </Stack>
                    </Stack>
                  </Stack>
                )}
                {selectedFactorObj && (
                  <Stack
                    padding="20px"
                    gap="8px"
                    borderRadius="10px"
                    border="1px solid"
                    borderColor="contentBorder.Active"
                    boxSizing="border-box"
                  >
                    <Stack direction="row" gap="6px" padding="12px" sx={{ minWidth: 0 }}>
                      <Stack flex={1} gap="6px" sx={{ minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" gap="12px">
                          <Typography minWidth="120px" variant="body1" color="contentText.Normal">
                            IMPACT SCORE
                          </Typography>
                          <Divider orientation="vertical" flexItem sx={{ my: '4px' }} />
                          <Typography
                            variant="body1"
                            color={selectedFactorObj.explanatoryDirectionSymbolNm === '+' ? 'increase.main' : 'decrease.main'}
                          >
                            {selectedFactorObj.explanatoryScore.toFixed(2)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" gap="12px" sx={{ minWidth: 0 }}>
                          <Typography minWidth="120px" variant="body1" color="contentText.Normal">
                            SUB-FACTOR
                          </Typography>
                          <Divider orientation="vertical" flexItem sx={{ my: '4px' }} />
                          <Typography
                            variant="body1"
                            color="contentText.Black"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {selectedFactorObj.explanatoryLevelDetailNm}
                          </Typography>
                        </Stack>
                      </Stack>
                      <MIBaseButton
                        sx={{ padding: '8px 10px' }}
                        onClick={(e) => {
                          e.preventDefault()
                          if (factorGraph?.datasource?.goodsNo && factorGraph?.datasource?.goodsDataNo) {
                            navigate(`/mi/data-detail/${factorGraph.datasource.goodsNo}/${factorGraph.datasource.goodsDataNo}`, {
                              state: { goodsDataSrcNo: factorGraph.datasource.goodsDataSourceNo },
                            })
                          }
                        }}
                      >
                        <OpenInNewRoundedIcon fontSize="small" sx={{ color: theme.palette.gray[70] }} />
                      </MIBaseButton>
                    </Stack>
                    <Divider sx={{ my: '4px' }} />
                    <Box position="relative" px="16px">
                      {factorGraph?.graphMetadata?.currentUnitCd && (
                        <Typography
                          variant="body2M14"
                          color="contentText.Black"
                          sx={{ position: 'absolute', top: 0, left: 20, userSelect: 'none', zIndex: 1 }}
                        >
                          Unit: {factorGraph.graphMetadata.currentUnitCd}
                        </Typography>
                      )}
                      <ForecastChartGraph
                        ref={chartGraphRef}
                        height="556px"
                        chartType={ChartType.LINE}
                        charts={factorChartData}
                        currency={factorGraph?.graphMetadata?.currency}
                        unitCd={factorGraph?.graphMetadata?.currentUnitCd}
                        chartVisibilityMap={new Map()}
                        hoveredChartKey={null}
                        hoverReportCardInfo={null}
                        isLoading={isLoadingFactorGraph}
                        onFixedModeChange={() => {}}
                        chartColorMap={new Map()}
                        disableFixedMode={true}
                      />
                    </Box>
                  </Stack>
                )}
              </Fragment>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
})

ForecastChartTooltipReportContent.displayName = 'ForecastChartTooltipReportContent'

export default ForecastChartTooltipReportContent
