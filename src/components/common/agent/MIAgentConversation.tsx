import { Box } from '@mui/material'
import { useState } from 'react'

import { ChatMessage } from './MIAgentChatWindow'

import MIAgentAnswer from '@/components/common/agent/MIAgentAnswer'
import MIAgentMessagePrompt from '@/components/common/agent/MIAgentMessagePrompt'

const markdownContent = `
# $73.62/bbl
 
현재 브렌트유 가격은 **배럴당 66.77달러** 선에서 거래되고 있습니다.
 
---
 
## 📌 주요 요인 분석
 
- **글로벌 수요 둔화**: 국제에너지기구(IEA)는 2025년 글로벌 석유 수요 증가량을 73만 배럴/일로 하향 조정했습니다. 이는 미약한 글로벌 경제 성장률에 따른 결과입니다.
- **OPEC+의 생산 증가**: 일부 OPEC+ 회원국들은 2025년 5월부터 하루 41만 배럴의 생산 증가를 계획하고 있습니다. 이는 시장의 공급 우려를 증대시키고 있습니다.
- **미국-이란 협상 진전**: 미국과 이란 간의 협상에서 긍정적인 진전이 이어지면서, 이란산 원유의 시장 복귀 가능성이 제기되고 있습니다. 이는 공급 확대 요인으로 작용할 수 있습니다.
 
현재 브렌트유 가격은 **배럴당 66.77달러** 선에서 거래되고 있습니다.
 
최근 추세를 살펴보면 다음과 같습니다:
 
- **Sub-Title:** 미국의 새로운 경제 정책은 글로벌 경제 성장에 부정적인 영향을 미치고 있으며, 이는 석유 수요 감소로 이어질 수 있습니다.
- **Sub-Title:** 미국의 새로운 경제 정책은 글로벌 경제 성장에 부정적인 영향을 미치고 있으며, 이는 석유 수요 감소로 이어질 수 있습니다.
 
향후 브렌트유 가격은 여러 요인에 의해 영향을 받을 것으로 예상됩니다.
 
---
 
## 📅 2025년 브렌트유 가격 예측
 
종합적으로 볼 때, 2025년 브렌트유 가격은 다음과 같은 요인들에 의해 영향을 받아 **변동 폭이 클 것으로 예상**됩니다:
 
### 📉 글로벌 경제 성장 둔화 영향:
> 경기 침체 가능성이 석유 수요 감소로 이어져 추가 하락 압력
 
### 📈 산유국들의 생산 확대:
> 특히 OPEC+ 회원국들의 생산 증가가 공급 우려를 증대시킬 수 있음
 
### 🟢 지정학적 리스크:
> 중동 지역 갈등, 이란 협상 진전 등은 공급 변동성과 가격 상승 요인으로 작용
 
---
 
<div style="text-align: right; margin-bottom: 8px">
<button title="Download" style="cursor: pointer; background: none; border: 0" type="button">
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
<path d="M4.16683 17.5C3.93072 17.5 3.7328 17.4201 3.57308 17.2604C3.41336 17.1007 3.3335 16.9028 3.3335 16.6667C3.3335 16.4306 3.41336 16.2326 3.57308 16.0729C3.7328 15.9132 3.93072 15.8333 4.16683 15.8333H15.8335C16.0696 15.8333 16.2675 15.9132 16.4272 16.0729C16.587 16.2326 16.6668 16.4306 16.6668 16.6667C16.6668 16.9028 16.587 17.1007 16.4272 17.2604C16.2675 17.4201 16.0696 17.5 15.8335 17.5H4.16683ZM10.0002 13.8125C9.88905 13.8125 9.78488 13.7951 9.68766 13.7604C9.59044 13.7257 9.50016 13.6667 9.41683 13.5833L6.41683 10.5833C6.26405 10.4306 6.18766 10.2361 6.18766 10C6.18766 9.76389 6.26405 9.56944 6.41683 9.41667C6.56961 9.26389 6.76405 9.1875 7.00016 9.1875C7.23627 9.1875 7.43072 9.26389 7.5835 9.41667L9.16683 11V3.33333C9.16683 3.09722 9.24669 2.89931 9.40641 2.73958C9.56613 2.57986 9.76405 2.5 10.0002 2.5C10.2363 2.5 10.4342 2.57986 10.5939 2.73958C10.7536 2.89931 10.8335 3.09722 10.8335 3.33333V11L12.4168 9.41667C12.5696 9.26389 12.7641 9.1875 13.0002 9.1875C13.2363 9.1875 13.4307 9.26389 13.5835 9.41667C13.7363 9.56944 13.8127 9.76389 13.8127 10C13.8127 10.2361 13.7363 10.4306 13.5835 10.5833L10.5835 13.5833C10.5002 13.6667 10.4099 13.7257 10.3127 13.7604C10.2154 13.7951 10.1113 13.8125 10.0002 13.8125Z" fill="#868E96"/>
</svg>
</button>
</div>
 
| 월           | Brent    | Dubai    | WTI     |
|--------------|----------|----------|---------|
| 2024년 11월  | -99.78%  | 74.09    | 71.72   | 
| 2024년 12월  | 74.00    | 74.00    | 71.65   |
| 2025년 1월   | 80.80    | 80.00    | 77.88   |
| 2025년 2월   | 76.32    | 76.32    | 72.70   | 
| 2025년 3월   | 72.98    | 72.98    | 69.92   |
`
const sources = ['Reuter', 'OMDIA', 'SeekingAlpha']
const recommendationQuestion = ['분과별 추천 주제 관련 질문 1', '분과별 추천 주제 관련 질문 2', '분과별 추천 주제 관련 질문 3']
const referLink = [
  {
    label: 'Historical Brent Crude Price (USD/bbl)',
    url: '/user/data-visualization',
  },
  {
    label: 'Global Brent Crude Supply and Demand Global Brent Crude Supply and Demand Global Brent Crude Supply and Demand',
    url: '/user/data-visualization',
  },
  {
    label: 'Brent vs. WTI Crude Spread Comparison',
    url: '/user/data-visualization',
  },
]
const referLinkMore = [
  {
    label: '연관 있는 데이터',
    url: '/user/data-visualization',
  },
  {
    label: '연관 있는 데이터',
    url: '/user/data-visualization',
  },
  {
    label: '연관 있는 데이터',
    url: '/user/data-visualization',
  },
  {
    label: '연관 있는 데이터',
    url: '/user/data-visualization',
  },
  {
    label: '연관 있는 데이터',
    url: '/user/data-visualization',
  },
  {
    label: '연관 있는 데이터',
    url: '/user/data-visualization',
  },
  {
    label: '연관 있는 데이터',
    url: '/user/data-visualization',
  },
]

const MIAgentConversation = ({
  messages,
  scrollToBottom,
  handleSendMessage,
}: {
  messages: ChatMessage[]
  scrollToBottom?: () => void
  handleSendMessage: (message?: string) => void
}) => {
  const [referLinks, setReferLinks] = useState(referLink)
  const handleScrollBottom = () => {
    if (scrollToBottom) {
      scrollToBottom()
    }
  }

  const handleLoadMoreRefer = () => {
    setReferLinks([...referLink, ...referLinkMore])
  }

  return (
    <Box>
      {messages?.map((item, id) => (
        <Box px={3} key={id}>
          <MIAgentMessagePrompt content={item.text} />
          {item.answer &&
            (item.text === '분과별 추천 주제 관련 질문 1' ? (
              <MIAgentAnswer
                loadMoreRefer={handleLoadMoreRefer}
                scrollBottom={handleScrollBottom}
                recommendationQuestion={recommendationQuestion}
                referLink={referLinks}
                sources={sources}
                content={markdownContent}
                handleSendMessage={handleSendMessage}
                errorType="DATA_ACCESS_DENIED"
              />
            ) : item.text === '분과별 추천 주제 관련 질문 2' ? (
              <MIAgentAnswer
                loadMoreRefer={handleLoadMoreRefer}
                scrollBottom={handleScrollBottom}
                recommendationQuestion={recommendationQuestion}
                referLink={referLinks}
                sources={sources}
                content={markdownContent}
                handleSendMessage={handleSendMessage}
                errorType="DATA_NOT_FOUND"
              />
            ) : item.text === '분과별 추천 주제 관련 질문 3' ? (
              <MIAgentAnswer
                loadMoreRefer={handleLoadMoreRefer}
                scrollBottom={handleScrollBottom}
                recommendationQuestion={[]}
                referLink={referLinks}
                sources={sources}
                content={markdownContent}
                handleSendMessage={handleSendMessage}
                errorType="LLM_RESPONSE_ERROR"
              />
            ) : (
              <MIAgentAnswer
                loadMoreRefer={handleLoadMoreRefer}
                scrollBottom={handleScrollBottom}
                recommendationQuestion={recommendationQuestion}
                referLink={referLinks}
                sources={sources}
                content={markdownContent}
                handleSendMessage={handleSendMessage}
              />
            ))}
        </Box>
      ))}
    </Box>
  )
}

export default MIAgentConversation
