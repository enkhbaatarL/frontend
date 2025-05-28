import { Box, Typography } from '@mui/material'
import clsx from 'clsx'
import React, { useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import style from './MIAgentAnswer.module.scss'
import MIAgentLineChart from './MIAgentLineChart'

import MIAgentAnswerTool from '@/components/common/agent/MIAgentAnswerTool'
import MIAgentRecommenQuestion from '@/components/common/agent/MIAgentRecommenQuestion'
import MIAgentRefernce from '@/components/common/agent/MIAgentRefernce'
import MIButton from '@/components/common/button/MIButton'

// Define types
type ReferLink = {
  label: string
  url: string
}

type ErrorType = 'DATA_ACCESS_DENIED' | 'DATA_NOT_FOUND' | 'LLM_RESPONSE_ERROR' | ''

interface MIAgentAnswerProps {
  content: string
  showMarkdown?: boolean
  showChart?: boolean
  errorType?: ErrorType
  sources?: string[]
  referLink?: ReferLink[]
  recommendationQuestion?: string[]
  loadMoreRefer?: () => void
  scrollBottom?: () => void
  handleSendMessage: (message?: string) => void
}

// Error message mapping
const ERROR_MESSAGES = {
  DATA_ACCESS_DENIED: {
    primary: '질문하신 내용에 접근 가능한 권한이 없습니다.',
    secondary: '대신 이런 정보는 어떠세요?',
  },
  DATA_NOT_FOUND: {
    primary: '죄송합니다. 해당 질문에 대해 답변이 어렵습니다.',
    secondary: '대시 관심있을실 만한 다른 질문을 도와드릴게요.',
  },
  LLM_RESPONSE_ERROR: {
    primary: '지금은 서버 연결이 원활하지 않습니다.',
    secondary: '잠시 후 다시 시도해 주세요.',
  },
}

const MIAgentAnswer: React.FC<MIAgentAnswerProps> = ({
  content,
  showMarkdown = true,
  showChart = true,
  errorType = '',
  sources = [],
  referLink = [],
  recommendationQuestion = [],
  loadMoreRefer,
  scrollBottom,
  handleSendMessage,
}) => {
  const markdownRef = useRef<HTMLDivElement>(null)

  // Helper functions
  const handleCopyPlainText = () => {
    if (!markdownRef.current) return

    const plainText = markdownRef.current.innerText

    navigator.clipboard
      .writeText(plainText)
      .then(() => console.log('Plain text copied'))
      .catch((err) => console.error('Copy failed:', err))
  }

  const handleScrollBottom = () => {
    scrollBottom?.()
  }

  const handleLoadMoreRefer = () => {
    handleScrollBottom()
    loadMoreRefer?.()
  }

  // Custom components for ReactMarkdown
  const markdownComponents = {
    button: ({ title, children }: { title?: string; children?: React.ReactNode }) => (
      <MIButton placement="right" type="ghost" color="gray" contentType="icon" toolTip={title}>
        {children}
      </MIButton>
    ),
  }

  // Render error message if there's an error
  const renderErrorMessage = () => {
    if (!errorType) return null

    const message = ERROR_MESSAGES[errorType]

    if (!message) return null

    return (
      <Box>
        <Typography variant="mariParagraph" color="contentText.Black">
          {message.primary}
        </Typography>
        <br />
        <Typography variant="mariParagraph" color="contentText.Black">
          {message.secondary}
        </Typography>
      </Box>
    )
  }

  return (
    <Box className={clsx(style.MiAgentAnswer)}>
      {/* Content section */}
      {showMarkdown && errorType === '' && (
        <div ref={markdownRef}>
          <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        </div>
      )}

      {/* Error message section */}
      {renderErrorMessage()}

      {/* Chart section */}
      {showChart && errorType === '' && <MIAgentLineChart />}

      {/* Recommendation section */}
      {recommendationQuestion.length > 0 && (
        <MIAgentRecommenQuestion recommenQuestion={recommendationQuestion} handleSendMessage={handleSendMessage} />
      )}

      {/* Reference section */}
      {referLink.length > 0 && errorType === '' && <MIAgentRefernce onclick={handleLoadMoreRefer} referLink={referLink} />}

      {/* Tools section */}
      <MIAgentAnswerTool
        scrolToBottom={handleScrollBottom}
        onClick={(action) => {
          if (action === 'copy') {
            handleCopyPlainText()
          }
        }}
        sources={sources}
      />
    </Box>
  )
}

export default MIAgentAnswer
