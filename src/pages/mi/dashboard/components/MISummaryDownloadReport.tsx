import { Box, Typography } from '@mui/material'
import { useState } from 'react'

import aiIcon from '@/assets/ai.svg'
import MIButton from '@/components/common/button/MIButton.tsx'
import MIButtonViewMore from '@/components/common/button/MIButtonViewMore.tsx'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon.tsx'

const MISummaryDownloadReport = () => {
  const [showMore, setShowMore] = useState(false)

  return (
    <Box borderRadius={'4px'} border={'1px solid #E5EDFA'} bgcolor={'#F6F9FD'} padding={5} mt={10} mb={6}>
      <Box display={'flex'} mb={5} alignItems={'center'} justifyContent={'space-between'}>
        <Typography component={'div'} variant={'textAI'}>
          <img style={{ verticalAlign: 'sub', marginRight: '4px' }} src={aiIcon} alt="" />
          Summary
        </Typography>
        <MIButton size={'h34'} type={'outlined'} color={'gray'} startIcon={<FileDownloadIcon />}>
          Download Full Report
        </MIButton>
      </Box>
      <Typography mb={1.5} variant={'subtext5'} fontWeight={600} color={'gray.90'} component={'div'}>
        차트의 데이터 포인트를 클릭하면 상세 정보가 표시됩니다.
      </Typography>
      <Typography
        mb={5}
        variant={'subtext5'}
        sx={{
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: showMore ? 'unset' : '4',
          WebkitBoxOrient: 'vertical',
        }}
        color={'#242424'}
        component={'div'}
      >
        3월: LNG(액화천연가스) 시장은 중장기적으로 안정화에 접어들 것으로 전망됩니다. <br />
        4월: 최근 몇 년간 이어졌던 공급 병목과 에너지 가격 급등은 주요 생산국들의 대규모 투자와 신규 액화 프로젝트의 가동으로 점차 해소될
        것으로 보이며, 특히 카타르, 미국, 모잠비크 등지에서의 공급 능력 증대가 시장의 하방 압력을 완화하는 데 기여할 것으로 예상됩니다.{' '}
        <br />
        5월: 미국은 2025년까지 LNG 수출 능력을 세계 최대 수준으로 끌어올릴 예정이며, 이는 유럽 및 아시아 수요지에 대한 안정적인 공급 기반을
        제공하게 됩니다. 한편, 수요 측면에서는 에너지 안보와 탈탄소 전환이라는 이중 과제를 동시에 안고 있는 국가들의 전략 변화가 주요 변수로
        작용하고 있습니다. 유럽은 러시아산 파이프라인 가스 의존도를 대체하기 위해 중단기적으로 LNG 수입 확대를 지속하겠지만, 재생에너지와
        그린수소의 성장 속도에 따라 수요의 피크아웃 시점이 앞당겨질 가능성도 존재합니다. 아시아에서는 인도, 필리핀, 베트남 등 신규 수입국의
        등장과 산업용 수요 증가가 전체 시장의 중심축을 이동시키고 있으며, 특히 가격 경쟁력 있는 장기계약 확보가 주요 에너지 전략으로
        부상하고 있습니다. 가격 측면에서는 2022~2023년의 급등세 이후 점진적인 안정세가 예상되며, 계절적 변동성과 지정학적 리스크에 따른 단기
        변동은 지속될 수 있습니다. 하지만 중장기적으로는 공급 확대와 인프라 다변화가 가격 안정화에 기여할 것으로 보이며, Henry Hub, TTF 등
        주요 지표 가격의 변동 폭도 이전보다 좁아질 가능성이 큽니다. 결과적으로 LNG 시장은 기존의 단기 수급 변동 중심에서 벗어나, 중장기 전략
        수립과 포트폴리오 전환의 영역으로 진입하고 있습니다. 가격뿐만 아니라 탄소 배출, 계약 유연성, 수송비 등 복합 요인이 시장 경쟁력을
        좌우하게 되며, LNG는 단순한 가교연료를 넘어 &apos;전략적 에너지 자산&apos;으로 재정의되고 있습니다.
      </Typography>
      <MIButtonViewMore onClick={() => setShowMore(!showMore)} state={showMore ? 'less' : 'more'} />
    </Box>
  )
}

export default MISummaryDownloadReport
