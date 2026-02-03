import { LabelImportantRounded, InfoOutlined } from '@mui/icons-material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ReactNode, memo, useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
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
  <HorizontalScrollContainer py="20px" scrollAmount={0.6} buttonPadding={8}>
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

  // 카테고리 목록 조회
  const { data: factorCategory } = useQuery({
    queryKey: ['forecastFactorCategoryNew', companyNo, goodsDataSourceNo, predictDate],
    queryFn: () =>
      forecastDataService.getForecastFactorCategoryNew(companyNo ?? 0, {
        predictDate,
        goodsDataSourceNo: goodsDataSourceNo ?? 0,
      }),
    enabled: isVisible && !!companyNo && !!goodsDataSourceNo && !!date && !date.startsWith('Index:'),
  })

  // 선택된 카테고리로 factors 조회
  const { data: factors } = useQuery({
    queryKey: ['forecastFactorsNew', companyNo, goodsDataSourceNo, predictDate, selectedCategory],
    queryFn: () =>
      forecastDataService.getForecastFactorsNew(companyNo ?? 0, {
        predictDate,
        goodsDataSourceNo: goodsDataSourceNo ?? 0,
        explanatoryLevelNm: selectedCategory ?? '',
      }),
    enabled: isVisible && !!companyNo && !!goodsDataSourceNo && !!selectedCategory && !!date && !date.startsWith('Index:'),
  })

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    setSelectedFactor(null) // 카테고리 변경 시 선택된 factor 초기화
  }, [])

  // 선택된 factor 객체 찾기
  const selectedFactorObj = useMemo(() => {
    if (!selectedFactor || !factors) return null

    // plusFactors에서 찾기
    const plusFactor = (factors.plusFactors || []).find((factor) => {
      const factorId = `plus-${factor.predictionInputMnemonicCd}-${factor.predictionInputMnemonicDetailCd}`
      return factorId === selectedFactor
    })
    if (plusFactor) return plusFactor

    // minusFactors에서 찾기
    const minusFactor = (factors.minusFactors || []).find((factor) => {
      const factorId = `minus-${factor.predictionInputMnemonicCd}-${factor.predictionInputMnemonicDetailCd}`
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

  return (
    <Stack>
      <Stack
        padding="20px 38px"
        direction="row"
        justifyContent="space-between"
        gap="24px"
        borderBottom="1px solid"
        borderColor="contentBorder.Normal"
        boxSizing="border-box"
      >
        {/* 상세정보 */}
        <Stack direction="row" alignItems="start" gap="24px">
          <Stack direction="row" gap="12px">
            <Box width="52px" height="52px" bgcolor="contentBG.Active" borderRadius="10px" />
            <InfoLabel label="TARGET" value={factorCategory?.predictChartDetailExpn?.toUpperCase() || '-'} />
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
              value={factorCategory?.predictionFulfillDt ? dayjs(factorCategory.predictionFulfillDt, 'YYYYMMDD').format('YYYY/MM/DD') : '-'}
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
        <Stack minWidth="136px" alignItems="start" gap="8px">
          {/* <Stack>
            <Typography variant="body2SB14" color="contentText.Subtext">
              Date Forecasted
            </Typography>
            <Typography variant="body2SB14" color="contentText.Normal">
              {factorCategory?.endPredictionResultDt
                ? dayjs(factorCategory.endPredictionResultDt, 'YYYYMMDD').format('YYYY/MM/DD')
                : '-'}
            </Typography>
          </Stack>
          <Stack>
            <Typography variant="body2SB14" color="contentText.Subtext">
              Model
            </Typography>
            <Typography variant="body2SB14" color="contentText.Normal">
              Standard v2.0.1
            </Typography>
          </Stack> */}
        </Stack>
      </Stack>
      <Stack padding="20px 38px 0 38px" gap="24px">
        <Stack direction="row" alignItems="center" gap="6px">
          <LabelImportantRounded sx={{ color: theme.palette.contentIcon.Activeb }} />
          <Typography variant="body1SB16" color="contentText.Black" sx={{ userSelect: 'none' }}>
            MAIN FACTORS
          </Typography>
          <InfoOutlined fontSize="small" sx={{ color: theme.palette.contentIcon.Enabled }} />
        </Stack>
      </Stack>
      <Stack>
        <ContentTab explanatoryLevelNms={factorCategory?.explanatoryLevelNms} onCategoryChange={handleCategoryChange} />
        {factors?.categorySummary && (
          <Typography padding="12px 38px" fontSize="18px" fontWeight={500} lineHeight="1.4" color="contentText.Black">
            {factors.categorySummary}
          </Typography>
        )}
        <Stack padding="12px 38px" mb="24px" boxSizing="border-box" sx={{ userSelect: 'none' }}>
          <Stack padding="24px" gap="24px" borderRadius="10px" border="1px solid" borderColor="contentBorder.Active" boxSizing="border-box">
            <Stack direction="row" gap="24px">
              <Stack flex={1} gap="8px" sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" gap="6px">
                  <TrendingUpIcon sx={{ color: theme.palette.contentIcon.Activeb }} />
                  <Typography variant="body1SB16" color="contentText.Black" sx={{ userSelect: 'none' }}>
                    UPWARD SUB-FACTORS
                  </Typography>
                </Stack>
                <Stack gap="4px">
                  {factors?.plusFactors?.map((factor) => {
                    const factorId = `plus-${factor.predictionInputMnemonicCd}-${factor.predictionInputMnemonicDetailCd}`
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
                  })}
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
                  {factors?.minusFactors?.map((factor) => {
                    const factorId = `minus-${factor.predictionInputMnemonicCd}-${factor.predictionInputMnemonicDetailCd}`
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
                  })}
                </Stack>
              </Stack>
            </Stack>
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
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
})

ForecastChartTooltipReportContent.displayName = 'ForecastChartTooltipReportContent'

export default ForecastChartTooltipReportContent
