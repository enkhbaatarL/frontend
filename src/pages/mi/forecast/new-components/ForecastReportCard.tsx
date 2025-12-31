import { Box, Divider, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useRef } from 'react'

import MIMorphingPopup, { MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'

interface ForecastReportCardData {
  label: string
  goodsDataSourceNo: number
  startDate: string
  endDate: string
}

const ReportContent = () => (
  <Box padding="24px 24px">
    <Typography sx={{ whiteSpace: 'pre-wrap', color: 'contentText.Normal' }}>
      {`OPEC+ 감산 기조 유지와 동절기 난방 수요가 맞물려 $75 선에서의 강력한 하방 경직성을 형성할 것으로 전망됩니다.

1. 공급 사이드 (Supply Side)
OPEC+의 감산 규율 vs 비OPEC의 생산 증대 2026년 1월 두바이유 가격을 지지하는 가장 강력한 펀더멘털은 OPEC+의 확고한 공급 관리 의지입니다. 지난 2025년 하반기 총회에서 결의된 사우디아라비아와 러시아 주도의 자발적 감산 연장 조치는 1월 실물 시장에 직접적인 영향을 미치고 있습니다. AI 위성 데이터 및 선적량 분석에 따르면, 주요 회원국들의 감산 이행률은 95% 이상을 상회하며 공급 과잉 우려를 원천 차단하고 있습니다. 다만, 미국 셰일 오일(Permian Basin)의 생산 효율성 증대와 브라질, 가이아나 등 비OPEC(Non-OPEC) 국가들의 산유량 증가가 지속되고 있어, OPEC+의 감산 효과를 일부 상쇄하고 있습니다. 이는 유가가 $80 이상의 고점으로 치고 올라가는 것을 억제하는 상단 저항선(Resistance Level)으로 작용하며, 결과적으로 시장은 매우 좁은 가격 변동폭 내에서 균형점을 찾으려 할 것입니다.

2. 수요 사이드 (Demand Side)
중국의 경기 부양 시차 효과와 동절기 계절성 수요 측면에서의 핵심 변수는 단연 중국입니다. 2025년 말 중국 당국이 발표한 대규모 인프라 투자 및 유동성 공급 정책이 약 3~6개월의 시차(Time Lag)를 두고 2026년 1월부터 실물 경제 지표(PMI 등) 개선으로 나타나고 있습니다. 이는 석유화학 제품의 원료인 나프타(Naphtha) 수요 증가로 이어져 중질유인 두바이유의 가치를 높이고 있습니다. 또한, 기상학적 데이터는 1월 북반구, 특히 동북아시아 지역의 기온이 평년 대비 낮을 것임을 가리키고 있습니다. 이는 난방유(Heating Oil) 및 등유 수요를 자극하여 정제 마진(Refining Margin)을 개선시키고, 정유사들의 가동률 상승을 유도하여 원유 현물 구매(Spot Buying)를 촉진하는 긍정적 요인입니다. 인도와 동남아시아 신흥국들의 견조한 모빌리티 수요 역시 하단을 지지하는 강력한 버팀목입니다.

3. 매크로 및 금융 환경 (Macro & Financials)
금리 인하 사이클과 달러화 약세 거시 경제 환경은 원유 시장에 우호적으로 전환되었습니다. 미 연준(Fed)이 인플레이션 둔화를 확인하며 2025년 하반기부터 시작한 금리 인하 사이클은 달러화 지수(DXY)의 하향 안정을 가져왔습니다. 통상적으로 달러 약세는 달러로 결제되는 원유의 가격 매력도를 높여, 비달러권 국가들의 구매력을 상승시키는 효과가 있습니다. 현재 글로벌 유동성은 위험 자산 선호 심리(Risk-on)를 일부 회복했으나, 여전히 경기 침체(Recession)에 대한 경계감이 남아있어 투기적 자금(Speculative Money)의 원유 선물 시장 유입은 제한적입니다. 이는 유가의 급격한 등락보다는 펀더멘털에 기반한 실수요 위주의 안정적인 흐름을 예상케 합니다.

4. 지정학 및 리스크 요인 (Geopolitics & Risk Factors)
중동 지역의 지정학적 긴장감은 여전히 '상수'로 존재합니다. 홍해 및 호르무즈 해협을 둘러싼 물류 리스크는 운임(Freight Rate) 상승을 유발하고 있으며, 이는 최종 도입 단가에 반영되어 유가 하락을 방어하는 요인이 됩니다. 시장 참여자들은 지정학적 이벤트 발생 시 즉각적인 공급 차질보다는 '리스크 프리미엄(Risk Premium)'을 가격에 $2~3 내외로 꾸준히 반영하고 있는 것으로 분석됩니다.

종합 전망 (Conclusion)
종합해 볼 때, 2026년 1월의 두바이유 시장은 **'공급의 인위적 축소'**와 **'수요의 자연적 회복'**이 팽팽하게 맞서는 형국입니다. 폭발적인 상승 모멘텀은 부족하지만, 하락을 방어할 재료는 충분합니다. 이에 따라 본 AI 모델은 두바이유 가격이 극도로 낮은 변동성(Volatility)을 보이며 $74.98 - $75.30이라는 좁은 박스권에 머무를 것으로 예측합니다. 트레이딩 관점에서는 추세 추종보다는 박스권 매매 전략이, 조달(Procurement) 관점에서는 급락을 기다리기보다 평균 가격대에서 안정적인 재고를 확보하는 전략이 유효합니다.`}
    </Typography>
  </Box>
)

interface ForecastReportCardProps {
  data: ForecastReportCardData
  onPopupClose?: () => void
  isFixedMode?: boolean
}

const ForecastReportCard = ({ data, onPopupClose, isFixedMode = false }: ForecastReportCardProps) => {
  const popupRef = useRef<MIMorphingPopupRef>(null)

  const formattedStartDate = dayjs(data.startDate).format('YY/MM/DD')
  const formattedEndDate = dayjs(data.endDate).format('YY/MM/DD')
  const targetDateRange = `${formattedStartDate}-${formattedEndDate}`

  return (
    <MIMorphingPopup
      ref={popupRef}
      popup={{
        title: 'AI Forecast Report',
        content: <ReportContent />,
        onClose: onPopupClose,
      }}
    >
      <Box
        padding="10px 12px"
        minWidth="260px"
        minHeight="118px"
        bgcolor="commonColor.White"
        borderRadius="10px"
        border="1px solid"
        borderColor="contentBorder.Normal"
        boxSizing="border-box"
        sx={{
          cursor: isFixedMode ? 'not-allowed' : 'pointer',
          '&:hover': {
            backgroundColor: isFixedMode ? undefined : 'contentBG.Hover',
            borderColor: isFixedMode ? undefined : 'contentBorder.Hover',
          },
        }}
        onClick={() => !isFixedMode && popupRef.current?.open()}
      >
        <Stack gap="4px">
          <Stack direction="row" height="20px" alignItems="center" justifyContent="space-between" gap="10px">
            <Typography variant="body2SB14" color="contentText.Normal">
              {data.label}
            </Typography>
            <Box width="8px" height="8px" bgcolor="mari.Primary" borderRadius="50%" />
          </Stack>
          <Stack direction="row" alignItems="center" gap="12px">
            <Stack>
              <Typography variant="body3M12" color="contentText.Subtext">
                TARGET
              </Typography>
              <Typography variant="infoDocument" color="contentText.Normal">
                {targetDateRange}
              </Typography>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ my: '4px' }} />
            <Stack>
              <Typography variant="body3M12" color="contentText.Subtext">
                AVG. PRICE
              </Typography>
              <Typography variant="infoDocument" color="contentText.Normal">
                76.0-78.2
              </Typography>
            </Stack>
          </Stack>
          <Divider sx={{ my: '4px' }} />
          <Stack direction="row" alignItems="center" gap="4px">
            <Typography variant="body3M12" color="contentText.Subtext">
              RUN
            </Typography>
            <Typography variant="body3SB12" color="contentText.Subtext">
              251201-251203
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </MIMorphingPopup>
  )
}

export default ForecastReportCard
