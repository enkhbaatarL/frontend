import { Box, Divider } from '@mui/material'
import clsx from 'clsx'
import { ButtonHTMLAttributes, useEffect, useState, useRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import style from '@/components/common/agent/MIAgentAnswer.module.scss'
import MIAgentLineChart from '@/components/common/agent/MIAgentLineChart'
import MIAgentRelatedData from '@/components/common/agent/MIAgentRelatedData'
import MIAgentSources from '@/components/common/agent/MIAgentSources'
import { MIAgentTableDownloadButton } from '@/components/common/agent/MIAgentTableDownloadButton'
import { useScroll } from '@/contexts/ScrollContext'
import { useTypingEffect } from '@/hooks/useTypingEffect'
import { IChatQnaAnswerBundle } from '@/service/mi/agent'

interface Props {
  isNewChat?: boolean
  bundles?: IChatQnaAnswerBundle[]
  chatRoomTitle?: string
  animationComplete?: boolean
  onAnimationComplete?: () => void
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'data-table-id'?: string
}

const downloadButtonTemplate = (tableId: string) => `
  <div style="text-align: right; margin-bottom: 8px">
    <button 
      data-table-id="${tableId}"
      style="cursor: pointer; background: none; border: 0" 
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4.16683 17.5C3.93072 17.5 3.7328 17.4201 3.57308 17.2604C3.41336 17.1007 3.3335 16.9028 3.3335 16.6667C3.3335 16.4306 3.41336 16.2326 3.57308 16.0729C3.7328 15.9132 3.93072 15.8333 4.16683 15.8333H15.8335C16.0696 15.8333 16.2675 15.9132 16.4272 16.0729C16.587 16.2326 16.6668 16.4306 16.6668 16.6667C16.6668 16.9028 16.587 17.1007 16.4272 17.2604C16.2675 17.4201 16.0696 17.5 15.8335 17.5H4.16683ZM10.0002 13.8125C9.88905 13.8125 9.78488 13.7951 9.68766 13.7604C9.59044 13.7257 9.50016 13.6667 9.41683 13.5833L6.41683 10.5833C6.26405 10.4306 6.18766 10.2361 6.18766 10C6.18766 9.76389 6.26405 9.56944 6.41683 9.41667C6.56961 9.26389 6.76405 9.1875 7.00016 9.1875C7.23627 9.1875 7.43072 9.26389 7.5835 9.41667L9.16683 11V3.33333C9.16683 3.09722 9.24669 2.89931 9.40641 2.73958C9.56613 2.57986 9.76405 2.5 10.0002 2.5C10.2363 2.5 10.4342 2.57986 10.5939 2.73958C10.7536 2.89931 10.8335 3.09722 10.8335 3.33333V11L12.4168 9.41667C12.5696 9.26389 12.7641 9.1875 13.0002 9.1875C13.2363 9.1875 13.4307 9.26389 13.5835 9.41667C13.7363 9.56944 13.8127 9.76389 13.8127 10C13.8127 10.2361 13.7363 10.4306 13.5835 10.5833L10.5835 13.5833C10.5002 13.6667 10.4099 13.7257 10.3127 13.7604C10.2154 13.7951 10.1113 13.8125 10.0002 13.8125Z" fill="#868E96"/>
      </svg>
    </button>
  </div>
`

export const tableIdRegex = /<!-- tableId:{([^}]+)} -->/g

// 테이블 ID 주석을 찾아서 다운로드 버튼으로 치환
const getContent = (content: string) => content.replace(tableIdRegex, (_, tableId) => downloadButtonTemplate(tableId))

const createMarkdownComponents = (bundle: IChatQnaAnswerBundle, chatRoomTitle?: string) => ({
  button: (props: ButtonProps) => <MIAgentTableDownloadButton bundle={bundle} chatRoomTitle={chatRoomTitle} {...props} />,
})

const NewChatAnswer = ({ bundles, chatRoomTitle, onAnimationComplete }: Props) => {
  const { typedText, startTyping, isTyping } = useTypingEffect(0.1, 60)
  const [currentBundleIndex, setCurrentBundleIndex] = useState(0)
  const [visibleGraphIndex, setVisibleGraphIndex] = useState<number | null>(null)
  const answerRef = useRef<HTMLDivElement>(null)
  const { scrollToBottom } = useScroll()

  const showGraphs = useMemo(() => {
    if (!bundles) return []
    const graphs = new Array(bundles.length).fill(false)
    if (visibleGraphIndex !== null) {
      graphs[visibleGraphIndex] = true
    }
    return graphs
  }, [bundles, visibleGraphIndex])

  const hasVisibleGraphs = useMemo(() => showGraphs.some((show) => show), [showGraphs])

  useEffect(() => {
    if (bundles && bundles.length > 0) {
      setCurrentBundleIndex(0)
      setVisibleGraphIndex(null)
      startTyping(bundles[0].content ?? '').then()
    }
  }, [bundles])

  useEffect(() => {
    if (!isTyping && bundles && currentBundleIndex < bundles.length) {
      const timer = setTimeout(() => {
        setVisibleGraphIndex(currentBundleIndex)

        if (currentBundleIndex + 1 < bundles.length) {
          setTimeout(() => {
            setCurrentBundleIndex((prev) => prev + 1)
            startTyping(bundles[currentBundleIndex + 1].content ?? '').then()
          }, 100)
        } else {
          setTimeout(() => {
            onAnimationComplete?.()
          }, 100)
        }
      }, 300)

      return () => clearTimeout(timer)
    }

    return () => {}
  }, [isTyping, bundles, currentBundleIndex, onAnimationComplete, startTyping])

  useEffect(() => {
    if ((isTyping || hasVisibleGraphs || typedText) && answerRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [typedText, isTyping, hasVisibleGraphs])

  if (!bundles || bundles.length === 0) return null

  return (
    <Box className={clsx(style.MiAgentAnswer)} ref={answerRef}>
      {bundles.slice(0, currentBundleIndex + 1).map((bundle, index) => (
        <Box key={index}>
          {index === currentBundleIndex ? (
            <ReactMarkdown
              components={createMarkdownComponents(bundle, chatRoomTitle)}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {getContent(typedText)}
            </ReactMarkdown>
          ) : (
            <ReactMarkdown
              components={createMarkdownComponents(bundle, chatRoomTitle)}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {getContent(bundle.content ?? '')}
            </ReactMarkdown>
          )}
          {(bundle.series ?? []).length > 0 && (
            <>
              {showGraphs[index] ? (
                <Box className={clsx({ [style.fadeInUp]: true })}>
                  <MIAgentLineChart series={bundle.series} />
                </Box>
              ) : (
                index === currentBundleIndex &&
                !isTyping && (
                  <Box
                    className={style.graphPlaceholder}
                    style={{
                      height: '490px',
                      backgroundColor: '#fff',
                      border: '1px solid',
                      borderColor: '#DEE2E6',
                      borderRadius: '6px',
                      opacity: 0.5,
                    }}
                  />
                )
              )}
            </>
          )}
          {(bundle.relatedData ?? []).length > 0 && showGraphs[index] && (
            <Box className={clsx({ [style.fadeInUp]: true })}>
              <MIAgentRelatedData relatedData={bundle.relatedData} />
            </Box>
          )}
          {(bundle.sources ?? []).length > 0 && showGraphs[index] && (
            <Box className={clsx({ [style.fadeInUp]: true })}>
              <MIAgentSources sources={bundle.sources} />
            </Box>
          )}
          {index < currentBundleIndex && <Divider sx={{ my: '18px !important' }} />}
        </Box>
      ))}
    </Box>
  )
}

const ExistingChatAnswer = ({ bundles, chatRoomTitle }: Props) => (
  <Box className={clsx(style.MiAgentAnswer)}>
    {bundles?.map((bundle, index) => (
      <Box key={index}>
        {bundle.content && (
          <ReactMarkdown
            components={createMarkdownComponents(bundle, chatRoomTitle)}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {getContent(bundle.content)}
          </ReactMarkdown>
        )}
        {(bundle.series ?? []).length > 0 && <MIAgentLineChart series={bundle.series} />}
        {(bundle.relatedData ?? []).length > 0 && <MIAgentRelatedData relatedData={bundle.relatedData} />}
        {(bundle.sources ?? []).length > 0 && <MIAgentSources sources={bundle.sources} />}
        {index < bundles?.length - 1 && <Divider sx={{ my: '18px !important' }} />}
      </Box>
    ))}
  </Box>
)

const MIAgentAnswer = (props: Props) => {
  if (!props.bundles || props.bundles.length === 0) return null

  return props.isNewChat ? <NewChatAnswer {...props} /> : <ExistingChatAnswer {...props} />
}

export default MIAgentAnswer
