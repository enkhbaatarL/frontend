import { Box, Divider } from '@mui/material'
import clsx from 'clsx'
import { ButtonHTMLAttributes, useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

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
  eventType?: string
  chatRoomTitle?: string
  onAnimationComplete?: () => void
  onCreateCopyableContent?: (contents: { plain: string; html?: string }) => void
}

type AnimationState = 'idle' | 'typing' | 'graph' | 'link' | 'complete'

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

const updateAnimationState = (index: number, state: AnimationState, add?: AnimationState) => (prev: AnimationState[]) => {
  const newState = [...prev]
  newState[index] = state
  return add ? [...newState, add] : newState
}

const isAfter = (targetState: AnimationState, state: AnimationState) => {
  const stateList: AnimationState[] = ['idle', 'typing', 'graph', 'link', 'complete']
  return stateList.indexOf(targetState) > stateList.indexOf(state)
}

const markdownToHtml = async (markdown: string): Promise<string> => {
  const result = await unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeRaw).use(rehypeStringify).process(markdown)
  return result.toString()
}

const MIAgentAnswer = ({ bundles, chatRoomTitle, eventType, onAnimationComplete, isNewChat, onCreateCopyableContent }: Props) => {
  const { typedText, startTyping } = useTypingEffect(4, 60)
  const [animationStateList, setAnimationStateList] = useState<AnimationState[]>(
    isNewChat ? ['idle'] : [...(bundles ?? []).map(() => 'complete' as AnimationState)],
  )
  const [chartImageUrls, setChartImageUrls] = useState<string[]>([])

  const answerRef = useRef<HTMLDivElement>(null)
  const { scrollToBottom , scrollToNewMessage} = useScroll()

  useEffect(() => {
    animationStateList.forEach((state, index) => {
      const content = bundles?.[index]?.content

      if (!content) return

      if (state === 'idle') {
        scrollToBottom()
        setAnimationStateList(updateAnimationState(index, 'typing'))
        startTyping(content).then(() => {
          setTimeout(() => setAnimationStateList(updateAnimationState(index, 'graph')), 100)
        })
      }

      if (state === 'graph') {
        setTimeout(() => setAnimationStateList(updateAnimationState(index, 'link')), 600)
      }

      if (state === 'link') {
        if (eventType === 'complete') {
          setAnimationStateList(updateAnimationState(index, 'typing'))
          startTyping(content).then(() => {
            setTimeout(() => setAnimationStateList(updateAnimationState(index, 'complete', 'idle')), 300)
          })
        }
      }
    })

  }, [animationStateList, bundles])

  useEffect(() => {
    if (animationStateList.length > (bundles?.length ?? 0)) {
      animationStateList.pop()
      onAnimationComplete?.()
    }
  }, [animationStateList, bundles, onAnimationComplete])

  // 차트 이미지 URL이 변경될 때마다 복사 가능한 컨텐츠 업데이트
  useEffect(() => {
    if (bundles) {
      const plain: string[] = []

      Promise.all(
        bundles.map(async (bundle, index) => {
          const content = bundle.content?.replace(tableIdRegex, '')
          const html: string[] = []

          if (index !== 0) html.push('<hr />')

          if (content) {
            plain.push(content)
            html.push(await markdownToHtml(content))
          }

          if (chartImageUrls[index]) {
            html.push(`<img alt="" src="${chartImageUrls[index]}" style="max-width:100%;"><br>`)
          }

          return html
        }),
      ).then((htmlArrays) => {
        const html = htmlArrays.flat()

        onCreateCopyableContent?.({
          plain: plain.join('\n---\n'),
          html: html.join('\n'),
        })
      })
    }
  }, [bundles, chartImageUrls, onCreateCopyableContent])

  useEffect(() => {
    // 타이핑 중에는 스크롤 하단 유지
    if (typedText) {
      scrollToNewMessage()
    }
  }, [typedText])

  if (!bundles || bundles.length === 0) return null

  return (
    <Box className={clsx(style.MiAgentAnswer)} ref={answerRef}>
      {bundles.map((bundle, index) => {
        const animationState = {
          value: animationStateList[index],
          isAfter: (state: AnimationState) => isAfter(animationStateList[index], state),
        }

        if (!animationState.value) return null

        const hasSeries = (bundle.series ?? []).length > 0
        const hasRelatedData = (bundle.relatedData ?? []).length > 0
        const hasSources = (bundle.sources ?? []).length > 0

        let content = '' // idle

        if (animationState.value === 'typing') {
          content = getContent(typedText)
        } else if (animationState.value !== 'idle') {
          content = getContent(bundle.content ?? '')
        }

        return (
          <Box key={index}>
            {index !== 0 && <Divider sx={{ my: '18px !important' }} />}
            <ReactMarkdown
              components={createMarkdownComponents(bundle, chatRoomTitle)}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {content}
            </ReactMarkdown>
            {hasSeries && (
              <Box className={clsx({ [style.fadeInUp]: true })} display={animationState.isAfter('typing') ? 'block' : 'none'}>
                <MIAgentLineChart
                  series={bundle.series}
                  onChartImageUrl={(url) => {
                    if (chartImageUrls[index] !== url) {
                      setChartImageUrls((prev) => {
                        const newUrls = [...prev]
                        newUrls[index] = url
                        return newUrls
                      })
                    }
                  }}
                />
              </Box>
            )}
            {animationState.isAfter('graph') && (
              <>
                {hasRelatedData && (
                  <Box className={clsx({ [style.fadeInUp]: true })}>
                    <MIAgentRelatedData relatedData={bundle.relatedData} />
                  </Box>
                )}
                {hasSources && (
                  <Box className={clsx({ [style.fadeInUp]: true })}>
                    <MIAgentSources sources={bundle.sources} />
                  </Box>
                )}
              </>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export default MIAgentAnswer
