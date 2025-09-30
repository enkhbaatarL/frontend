import CheckIcon from '@mui/icons-material/Check'
import { Box, Stack, Typography, Collapse, Fade } from '@mui/material'
import { useState } from 'react'

import DashboardSelect from '@/pages/mi/dashboard/components/DashboardSelect'
import SectionHeader from '@/pages/mi/dashboard/components/SectionHeader'
import { MarketItem } from '@/service/mi/dashboard'

const options = [
  { label: 'Detailed', value: 'detailed' },
  { label: 'Focused', value: 'focused' },
  { label: 'Narrative', value: 'narrative' },
]

const sampleData: { detailed: MarketItem[]; narrative: MarketItem } = {
  detailed: [
    {
      id: 'c1',
      title: '단기 충격 방어: 헤지와 재고 운용',
      summary: ['공급 차질 리스크에 대비해 선물·옵션을 활용한 단기 헤지 강화', '정제재고를 최적화하고 조기 비축을 통해 공급 안정성 확보'],
      sources: [],
    },
    {
      id: 'c2',
      title: '중장기 원가 경쟁력 확보: 비용 구조 재편',
      summary: ['공급 과잉에 따른 가격 압박을 고려해 원가 절감과 효율화 추진', '고정비 중심 구조를 변동비 중심으로 전환해 수익성 방어'],
      sources: [],
    },
    {
      id: 'c3',
      title: '시장 축소 대응: 수출 다변화와 제품 고도화',
      summary: ['아시아 수요 둔화를 반영해 유럽·남미 등 신규 시장 개척', '석유화학·디젤 등 고부가 제품 비중을 확대해 리스크 분산'],
      sources: [],
    },
  ],
  narrative: {
    id: 'c4',
    title: '불안은 오늘 키우고, 공급은 내일 넘치며, 가격은 리야드가 흔든다',
    summary: [
      '우크라이나 드론 공격으로 러시아 주요 원유 수출항과 정유시설이 피해를 입으면서, 단기적으로 공급 차질 우려가 확대되고 있습니다. 프리모르스크 항구와 키리시 정유시설이 직접적인 타격을 입은 것으로 알려지며, 러시아의 원유 및 정제 제품 수출에 불확실성이 커지고 있습니다. 단기적으로는 글로벌 원유 시장이 가격 상승 압력을 받을 가능성이 높지만, 서방 제재 환경과 대체 공급원 활용 가능성을 고려할 때 장기적 충격은 제한적일 수 있다는 시각도 존재합니다. 다만 지정학적 리스크가 누적되는 상황에서 단기적 변동성 확대는 불가피해 보입니다.',
      '한편 국제에너지기구(IEA)는 최근 보고서를 통해 원유 시장의 공급 과잉 가능성을 재차 강조했습니다. IEA는 2025년 하루 270만 배럴, 2026년 210만 배럴의 공급 증가를 전망하고 있으며, 이는 OPEC+와 비OPEC 국가들의 증산을 모두 반영한 수치입니다. 특히 미국과 브라질 등 비OPEC 산유국의 공급 확대가 두드러질 것으로 보입니다. 문제는 글로벌 수요 증가세가 예상보다 둔화될 경우 재고가 빠르게 누적될 수 있다는 점이며, 이는 2026년 이후 수급 균형에 구조적 부담을 줄 수 있습니다.',
      '사우디아라비아는 최근 아시아향 10월 선적분 원유 판매 가격을 인하하기로 결정했습니다. 이는 아시아 지역 정제마진 약세와 수요 둔화 우려를 반영한 조치로, 정제사들의 조달 부담을 줄이고 자국 원유의 시장 점유율을 유지하려는 전략으로 해석됩니다. 그러나 가격 인하가 러시아발 단기 공급 차질에서 비롯된 긴축 요인을 완전히 상쇄하기는 어렵습니다. 따라서 시장은 단기적으로는 지정학적 리스크에 따른 불안 요인, 중기적으로는 공급 과잉 전망이라는 상반된 시그널이 교차하는 복합적 국면에 놓여 있다고 평가할 수 있습니다.',
    ],
    sources: [],
  },
}

const CheckpointsItem = ({
  item,
  selectedOption,
  borderBottom = true,
}: {
  item: MarketItem
  selectedOption: string
  borderBottom?: boolean
}) => (
  <Box px="6px">
    <Stack py="12px" gap="6px" borderBottom={borderBottom ? '1px solid #DEE2E6' : 'none'}>
      <Stack direction="row" gap="8px">
        <Stack width={32} height={32} alignItems="center" justifyContent="start">
          <CheckIcon sx={{ color: '#364FC7' }} />
        </Stack>
        <Typography variant="infoDocument">{item.title}</Typography>
      </Stack>
      <Collapse in={selectedOption === 'detailed'} timeout={300}>
        <Stack gap="6px">
          <Stack pl="22px" gap="1px">
            {item.summary.map((content, index) => (
              <Typography
                key={`${item.id}-content-${index}`}
                variant="subtext5"
                color="gray.70"
                fontWeight={500}
                sx={{
                  textIndent: '-14px',
                  '&::before': {
                    content: '"•"',
                    marginRight: '6px',
                    color: 'gray.70',
                  },
                }}
              >
                {content}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Collapse>
    </Stack>
  </Box>
)

const Checkpoints = () => {
  const [selectedOption, setSelectedOption] = useState('detailed')

  return (
    <Stack padding="6px 12px" borderRadius="10px" gap="6px" sx={{ backgroundColor: '#F8F9FA' }}>
      <SectionHeader
        title="Checkpoints"
        tooltipTitle="최근 24시간의 뉴스와 데이터를 분석해, 시장에 영향을 준 핵심 사건들을 간략히 정리합니다."
        padding="7.5px 0 7.5px 6px"
      >
        <DashboardSelect
          items={options}
          selectedItems={[selectedOption]}
          setSelectedItems={(items) => {
            setSelectedOption(Array.isArray(items) ? items[0] : 'detailed')
          }}
        />
      </SectionHeader>
      <Fade in={selectedOption === 'detailed' || selectedOption === 'focused'} timeout={500}>
        <Box>
          {(selectedOption === 'detailed' || selectedOption === 'focused') &&
            sampleData.detailed.map((item, index) => (
              <CheckpointsItem
                key={item.id}
                item={item}
                selectedOption={selectedOption}
                borderBottom={index !== sampleData.detailed.length - 1}
              />
            ))}
        </Box>
      </Fade>
      <Fade in={selectedOption === 'narrative'} timeout={500}>
        <Box>
          {selectedOption === 'narrative' && (
            <Stack padding="12px 20px 16px" gap="6px">
              <Typography variant="infoDocument">{sampleData.narrative.title}</Typography>
              <Stack gap="8px">
                {sampleData.narrative.summary.map((content, index) => (
                  <Typography key={`${sampleData.narrative.id}-content-${index}`} variant="subtext5" color="gray.70" fontWeight={500}>
                    {content}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          )}
        </Box>
      </Fade>
    </Stack>
  )
}

export default Checkpoints
