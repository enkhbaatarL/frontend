import { Box, Stack, Tooltip, Typography } from '@mui/material'
import clsx from 'clsx'
import { useRef, useMemo, useEffect, useState, useCallback, AnchorHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import suggestionIcon from '@/assets/agent/suggestion.svg'
import style from '@/components/common/agent/MIAgentAnswer.module.scss'
import { IConversation, chunkManager } from '@/hooks/useMIAgent'
import { StreamEventType } from '@/service/mi/agent'
import {
  parseSources,
  parseSuggestedQuestions,
  getSourcesParsingStatus,
  getSuggestedQuestionsParsingStatus,
  type Source,
  type SuggestedQuestion,
} from '@/utils/agentMarkdownExtractor'

interface Props {
  conversation: IConversation
  chatRoomTitle?: string
  onAnimationComplete?: () => void
  onSendMessage?: (message: string) => void
}

const createMarkdownComponents = (sources: Source[] | null) => ({
  a: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    let referenceType = undefined

    if (typeof children === 'string') {
      if (/^\d+$/.test(children)) referenceType = 'number'
      if (/^[A-Z]+$/.test(children)) referenceType = 'char'
    }

    if (referenceType === 'number') {
      const source = sources?.find((s) => s.index === Number(children))
      if (source) {
        const tooltipTitle = source.sourceNm

        return (
          <Tooltip
            title={tooltipTitle}
            placement="top-start"
            followCursor
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -6],
                    },
                  },
                ],
              },
            }}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                verticalAlign: 'middle',
                textDecoration: 'none',
                color: '#212529',
                fontWeight: 500,
                fontSize: '12px',
                fontStyle: 'normal',
              }}
            >
              <Stack
                component="span"
                display="inline-flex"
                minWidth="20px"
                height="20px"
                direction="row"
                alignItems="center"
                borderRadius="4px"
                bgcolor="gray.30"
                color="contentText.Normal"
                gap="2px"
                justifyContent="center"
                padding="0 4px"
                boxSizing="border-box"
              >
                {children}
              </Stack>
            </a>
          </Tooltip>
        )
      }
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
        className={style.link}
        style={{ fontWeight: 600, textDecoration: 'none', ...props?.style }}
      >
        {children}
      </a>
    )
  },
})

const MIAgentAnswer = ({ conversation, onAnimationComplete, onSendMessage }: Props) => {
  const answerRef = useRef<HTMLDivElement>(null)
  const [displayMessage, setDisplayMessage] = useState<string>('')
  const [currentAnimatingChunk, setCurrentAnimatingChunk] = useState<{ text: string; key: number } | null>(null)
  const processedChunkCountRef = useRef<number>(0)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef<boolean>(false)
  const chunkKeyRef = useRef<number>(0)
  const chunkQueueRef = useRef<string[]>([])
  const lastQnaNoRef = useRef<number | null>(null)
  const loggedErrorQnaNoRef = useRef<number | null>(null) // 에러 로그를 출력한 qnaNo 추적
  const animationCompleteCalledRef = useRef<boolean>(false) // onAnimationComplete 호출 여부 추적
  const { t } = useTranslation()

  // 출처
  const sources = useMemo<Source[] | null>(() => {
    if (typeof displayMessage !== 'string' || !displayMessage) return null
    return parseSources(displayMessage)
  }, [displayMessage])

  // 추천 질문
  const suggestedQuestions = useMemo<SuggestedQuestion[] | null>(() => {
    if (typeof displayMessage !== 'string' || !displayMessage) return null
    return parseSuggestedQuestions(displayMessage)
  }, [displayMessage])

  const sourcesParsingStatus = useMemo(() => {
    if (typeof displayMessage !== 'string') return 'idle'
    return getSourcesParsingStatus(displayMessage, sources)
  }, [displayMessage, sources])

  const suggestedQuestionsParsingStatus = useMemo(() => {
    if (typeof displayMessage !== 'string') return 'idle'
    return getSuggestedQuestionsParsingStatus(displayMessage, suggestedQuestions)
  }, [displayMessage, suggestedQuestions])

  // 파싱 상태에 따른 로딩 메시지 결정
  const parsingLoadingMessage = useMemo<string | null>(() => {
    if (sourcesParsingStatus === 'parsing') {
      return t('mari.streamMessage.ParsingSourcesNode')
    }
    if (suggestedQuestionsParsingStatus === 'parsing') {
      return t('mari.streamMessage.ParsingSuggestedQuestionsNode')
    }
    return null
  }, [sourcesParsingStatus, suggestedQuestionsParsingStatus, t])

  const ANIMATION_DURATION = 100

  // 청크 처리 간격 설정 (동적 조정)
  const MIN_PROCESSING_INTERVAL_MS = 0
  const MAX_PROCESSING_INTERVAL_MS = 300
  const BASE_CHUNK_LENGTH_THRESHOLD = 100 // 기준 청크 길이 (문자 수)
  const BASE_SPEED_THRESHOLD = 50

  const markdownComponents = useMemo(() => createMarkdownComponents(sources), [sources])

  /**
   * 청크 길이와 속도에 따라 처리 간격을 동적으로 계산
   * @param chunkLength 처리할 청크의 총 문자 수
   * @param speed 청크 도착 속도 (문자/초)
   * @returns 처리 간격 (ms)
   */
  const calculateProcessingInterval = useCallback((chunkLength: number, speed: number | null): number => {
    if (chunkLength === 0) {
      return MAX_PROCESSING_INTERVAL_MS
    }

    let lengthRatio = 0
    let speedRatio = 0

    // 청크가 많을수록 빠르게 처리
    if (chunkLength > 0) {
      lengthRatio = Math.min(chunkLength / BASE_CHUNK_LENGTH_THRESHOLD, 1)
    }

    if (speed !== null && speed > 0) {
      speedRatio = Math.min(speed / BASE_SPEED_THRESHOLD, 1)
    }

    const combinedRatio = lengthRatio * 0.4 + speedRatio * 0.6
    const interval = MAX_PROCESSING_INTERVAL_MS - (MAX_PROCESSING_INTERVAL_MS - MIN_PROCESSING_INTERVAL_MS) * combinedRatio

    return Math.max(MIN_PROCESSING_INTERVAL_MS, Math.min(MAX_PROCESSING_INTERVAL_MS, Math.round(interval)))
  }, [])

  const processPendingChunks = useCallback(() => {
    const chunkQueue = chunkQueueRef.current

    if (processedChunkCountRef.current >= chunkQueue.length) {
      isProcessingRef.current = false
      setCurrentAnimatingChunk(null)
      return
    }

    if (isProcessingRef.current || animationTimerRef.current) {
      return
    }

    const pendingChunks: string[] = []
    for (let i = processedChunkCountRef.current; i < chunkQueue.length; i++) {
      const chunk = chunkQueue[i]
      if (chunk) {
        pendingChunks.push(chunk)
      }
    }

    if (pendingChunks.length === 0) {
      isProcessingRef.current = false
      setCurrentAnimatingChunk(null)
      return
    }

    isProcessingRef.current = true

    // 200ms 동안 쌓인 모든 청크를 합쳐서 하나의 텍스트로 만들기
    const combinedChunks = pendingChunks.join('')
    chunkKeyRef.current += 1
    setCurrentAnimatingChunk({ text: combinedChunks, key: chunkKeyRef.current })

    const currentChunkIndex = processedChunkCountRef.current
    const currentChunkCount = pendingChunks.length

    animationTimerRef.current = setTimeout(() => {
      if (currentChunkIndex !== processedChunkCountRef.current) {
        return
      }

      const currentQueue = chunkQueueRef.current
      if (currentQueue.length === 0) {
        isProcessingRef.current = false
        setCurrentAnimatingChunk(null)
        animationTimerRef.current = null
        return
      }

      const chunksToAdd: string[] = []
      for (let i = processedChunkCountRef.current; i < processedChunkCountRef.current + currentChunkCount; i++) {
        const chunk = currentQueue[i]
        if (chunk) {
          chunksToAdd.push(chunk)
        }
      }

      if (chunksToAdd.length > 0) {
        const combinedText = chunksToAdd.join('')
        setDisplayMessage((prev) => {
          const prevText = typeof prev === 'string' ? prev : ''
          return `${prevText}${combinedText}`
        })
        processedChunkCountRef.current += chunksToAdd.length
      }

      setCurrentAnimatingChunk(null)
      isProcessingRef.current = false
      animationTimerRef.current = null
    }, ANIMATION_DURATION)
  }, [])

  useEffect(() => {
    if (conversation.qnaNo !== lastQnaNoRef.current) {
      lastQnaNoRef.current = conversation.qnaNo
      processedChunkCountRef.current = 0
      setCurrentAnimatingChunk(null)
      isProcessingRef.current = false
      chunkQueueRef.current = []
      loggedErrorQnaNoRef.current = null
      animationCompleteCalledRef.current = false
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
        animationTimerRef.current = null
      }
      const baseMessage = conversation.answer?.[StreamEventType.MESSAGE] ?? ''
      if (baseMessage && typeof baseMessage !== 'string') {
        if (loggedErrorQnaNoRef.current !== conversation.qnaNo) {
          console.error('Invalid message type:', baseMessage)
          loggedErrorQnaNoRef.current = conversation.qnaNo
        }
        setDisplayMessage(t('mari.errorMessage.loadError'))
      } else {
        setDisplayMessage(baseMessage)
        if (loggedErrorQnaNoRef.current === conversation.qnaNo) {
          loggedErrorQnaNoRef.current = null
        }
      }
    }
  }, [conversation.qnaNo, conversation.answer, t])

  // FULLTEXT가 왔을 때 최종 메시지로 업데이트
  useEffect(() => {
    const finalMessageRaw = conversation.answer?.[StreamEventType.MESSAGE] ?? ''
    let finalMessage = ''

    if (finalMessageRaw && typeof finalMessageRaw !== 'string') {
      finalMessage = t('mari.errorMessage.loadError')
    } else {
      finalMessage = finalMessageRaw
    }

    // 최종 메시지가 있고, 현재 displayMessage와 다르면 즉시 업데이트
    if (finalMessage && finalMessage !== displayMessage) {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
        animationTimerRef.current = null
      }
      setCurrentAnimatingChunk(null)
      isProcessingRef.current = false
      processedChunkCountRef.current = 0
      setDisplayMessage(finalMessage)
    }
  }, [conversation.answer, displayMessage, t])

  useEffect(() => {
    if (conversation.qnaNo === null) {
      return undefined
    }

    let timeoutId: NodeJS.Timeout | null = null

    const checkAndProcessChunks = () => {
      const chunkQueue = chunkManager.getChunks(conversation.qnaNo)
      const chunkSpeed = chunkManager.getChunkSpeed(conversation.qnaNo)
      chunkQueueRef.current = chunkQueue

      if (chunkQueue.length === 0 && !isProcessingRef.current && !currentAnimatingChunk) {
        processedChunkCountRef.current = 0
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current)
          animationTimerRef.current = null
        }
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(checkAndProcessChunks, MAX_PROCESSING_INTERVAL_MS)
        return
      }

      const pendingChunkCount = chunkQueue.length - processedChunkCountRef.current

      if (pendingChunkCount > 0) {
        const pendingChunks: string[] = []
        for (let i = processedChunkCountRef.current; i < chunkQueue.length; i++) {
          const chunk = chunkQueue[i]
          if (chunk) {
            pendingChunks.push(chunk)
          }
        }
        const totalChunkLength = pendingChunks.join('').length

        const processingInterval = calculateProcessingInterval(totalChunkLength, chunkSpeed)

        if (!isProcessingRef.current && !animationTimerRef.current) {
          requestAnimationFrame(() => {
            if (chunkQueueRef.current.length > processedChunkCountRef.current && !isProcessingRef.current && !animationTimerRef.current) {
              processPendingChunks()
            }
          })
        }

        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(checkAndProcessChunks, processingInterval)
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(checkAndProcessChunks, MAX_PROCESSING_INTERVAL_MS)
      }
    }

    checkAndProcessChunks()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [conversation.qnaNo, currentAnimatingChunk, processPendingChunks, calculateProcessingInterval])

  useEffect(() => {
    if (!onAnimationComplete || conversation.qnaNo === null) return undefined

    const hasFinalAnswer = Boolean(conversation.answer?.[StreamEventType.MESSAGE])
    const hasNoAnimatingChunk = !currentAnimatingChunk
    const hasNoProcessing = !isProcessingRef.current && !animationTimerRef.current
    const chunkQueue = chunkManager.getChunks(conversation.qnaNo)
    const hasNoPendingChunks = chunkQueue.length === 0
    const allChunksProcessed = chunkQueueRef.current.length === 0 || processedChunkCountRef.current >= chunkQueueRef.current.length

    if (
      hasFinalAnswer &&
      hasNoAnimatingChunk &&
      hasNoProcessing &&
      hasNoPendingChunks &&
      allChunksProcessed &&
      !animationCompleteCalledRef.current
    ) {
      const timeoutId = setTimeout(() => {
        animationCompleteCalledRef.current = true
        onAnimationComplete()
      }, 100)

      return () => {
        clearTimeout(timeoutId)
      }
    }

    return undefined
  }, [conversation.qnaNo, conversation.answer, currentAnimatingChunk, onAnimationComplete])

  useEffect(
    () => () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
    },
    [],
  )

  // 주석 시작 부분 제거
  const removeIncompleteCommentStart = useCallback((text: string): string => {
    let result = text

    // 끝 부분: <, <!, <!- 로 끝나는 경우 해당 부분 제거 (<!--가 완성되면 ReactMarkdown이 처리)
    if (result.endsWith('<!-')) {
      result = result.slice(0, -3)
    } else if (result.endsWith('<!')) {
      result = result.slice(0, -2)
    } else if (result.endsWith('<')) {
      result = result.slice(0, -1)
    }

    // 청크가 HTML 주석(<!--)의 일부분일 경우 제거
    if ('<!--'.includes(text.trim())) {
      return ''
    }

    return result
  }, [])

  const removeIncompleteComments = useCallback((html: string): string => {
    let result = html

    let searchIndex = 0
    while (true) {
      const commentStartIndex = result.indexOf('<!--', searchIndex)
      if (commentStartIndex === -1) {
        break
      }

      const afterCommentStart = result.substring(commentStartIndex + 4) // '<!--' 길이만큼 건너뛰기
      const commentEndIndex = afterCommentStart.indexOf('-->')

      // 주석이 닫히지 않았으면 <!--부터 끝까지 제거
      if (commentEndIndex === -1) {
        result = result.substring(0, commentStartIndex)
        break
      }

      searchIndex = commentStartIndex + 4 + commentEndIndex + 3 // '<!--' + 내용 + '-->'
    }

    result = result.replaceAll(/<span[^>]*>\s*<\/span>/g, '')
    result = result.replaceAll(/<span[^>]*>\s*<\/span><br\s*\/?>/g, '')
    result = result.replaceAll(/<br\s*\/?><span[^>]*>\s*<\/span>/g, '')

    return result
  }, [])

  const displayContent = useMemo(() => {
    const messageText = typeof displayMessage === 'string' ? displayMessage : ''
    let content = removeIncompleteCommentStart(messageText.replaceAll('~', '&#126;'))

    // 현재 애니메이션 중인 청크 추가 (고유 키로 매번 새로운 요소 생성)
    if (currentAnimatingChunk) {
      const animatingContent = removeIncompleteCommentStart(currentAnimatingChunk.text)
      const chunkKey = currentAnimatingChunk.key

      // 줄바꿈 기준으로 분리하여 각각을 span으로 감싸기
      const parts = animatingContent.split('\n')
      let convertedAnimatingContent = parts
        .map((part, index) => {
          if (part === '') return '\n'
          return `<span class="streamingContent" data-chunk-key="${chunkKey}-${index}">${part}</span>`
        })
        .join('<br />')

      // 불완전한 HTML 주석 제거
      convertedAnimatingContent = removeIncompleteComments(convertedAnimatingContent)

      content += convertedAnimatingContent
    }

    if (sources) {
      // 링크 참조 [1]등 앞에 공백이 없으면 공백 추가([1][2] -> [1] [2] 형식으로 변환)
      content = content.replaceAll(/([^\s])(?=\[[A-Z0-9]+\])/g, '$1 ')
      const sourcesText = sources.map((source) => `[${source.index}]: ${source.url}`).join('  \n')
      content = `${sourcesText}\n\n${content}`
    }

    return content
  }, [displayMessage, currentAnimatingChunk, removeIncompleteCommentStart, removeIncompleteComments, sources])

  const hasAnswerContent = Boolean(conversation.answer?.[StreamEventType.MESSAGE])
  const hasStatusMessage = Boolean(conversation.statusMessage)
  const hasStreamingContent = Boolean(displayMessage || currentAnimatingChunk)

  if (!hasAnswerContent && !hasStatusMessage && !hasStreamingContent) return null

  return (
    <Box className={clsx(style.MiAgentAnswer)} ref={answerRef}>
      <ReactMarkdown
        key={`markdown-${conversation.qnaNo}`}
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {displayContent}
      </ReactMarkdown>
      {conversation.statusMessage && (
        <Box key={`${conversation.qnaNo ?? 'global'}-${conversation.statusMessage}`} className={style.statusMessage}>
          {conversation.statusMessage}
        </Box>
      )}
      <Stack gap="20px">
        {sources && (
          <Stack py="12px" className={conversation.isNew ? style.parsedDataContainer : undefined}>
            <Typography variant="contentTitle" color="content.textBlack" py="8px">
              {t('mari.agent.sources')}
            </Typography>
            <Stack mt="12px" gap="10px">
              <Stack gap="4px">
                <Typography variant="subtext3" color="contentText.Normal">
                  Web Search
                </Typography>
                <Stack gap="6px">
                  {sources.map((source, index) => (
                    <Stack
                      key={source.index}
                      direction="row"
                      width="fit-content"
                      padding="6px 8px"
                      borderRadius="4px"
                      border="1px solid"
                      borderColor="contentBorder.Normal"
                      gap="6px"
                      boxSizing="border-box"
                      className={conversation.isNew ? style.parsedDataItem : undefined}
                      sx={{
                        animationDelay: `${index * 200}ms`,
                        backgroundColor: 'mari.MariBG',
                        '&:hover': {
                          cursor: 'pointer',
                          borderColor: 'contentBorder.Active',
                          backgroundColor: 'contentBG.Hover',
                        },
                        userSelect: 'none',
                      }}
                      onClick={() => {
                        window.open(source.url, '_blank')
                      }}
                    >
                      <Typography variant="subtext" color="content.textBlack">
                        {source.index}
                      </Typography>
                      <Typography variant="subtext" color="content.textBlack">
                        {source.sourceNm}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        )}
        {suggestedQuestions && (
          <Stack py="8px" className={conversation.isNew ? style.parsedDataContainer : undefined}>
            <Typography variant="contentTitle" color="content.textBlack">
              {t('mari.agent.suggestedQuestions')}
            </Typography>
            <Stack py="6px" gap="6px">
              {suggestedQuestions.map((question, index) => (
                <Stack
                  key={question.index}
                  direction="row"
                  width="fit-content"
                  padding="6px 8px"
                  gap="6px"
                  borderRadius="4px"
                  className={conversation.isNew ? style.parsedDataItem : undefined}
                  sx={{
                    userSelect: 'none',
                    cursor: 'pointer',
                    animationDelay: `${index * 200}ms`,
                    '&:hover': {
                      backgroundColor: 'gray.20',
                    },
                  }}
                  onClick={() => {
                    onSendMessage?.(question.text)
                  }}
                >
                  <img src={suggestionIcon} alt="suggestion" draggable={false} />
                  <Typography variant="body2M14" color="content.textBlack">
                    {question.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
      {parsingLoadingMessage && (
        <Box key={`${conversation.qnaNo ?? 'global'}-${parsingLoadingMessage}`} className={style.statusMessage} mt="6px">
          {parsingLoadingMessage}
        </Box>
      )}
    </Box>
  )
}

export default MIAgentAnswer
