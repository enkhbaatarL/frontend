import { Box, Stack, Tooltip } from '@mui/material'
import clsx from 'clsx'
import { useRef, useMemo, useEffect, useState, useCallback, AnchorHTMLAttributes, ComponentPropsWithoutRef } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import style from '@/components/common/agent/MIAgentAnswer.module.scss'
import MIAgentReports from '@/components/common/agent/MIAgentReports'
import MIAgentSources from '@/components/common/agent/MIAgentSources'
import MIAgentSuggestedQuestions from '@/components/common/agent/MIAgentSuggestedQuestions'
import { MIAgentTableDownloadButton } from '@/components/common/agent/MIAgentTableDownloadButton'
import DataTrendChartDownloadIcon from '@/components/common/data-trend-chart/icons/DataTrendChartDownloadIcon'
import { IConversation, chunkManager } from '@/hooks/useMIAgent'
import { StreamEventType, ChatRoomErrorStatus } from '@/service/mi/agent'
import {
  parseSources,
  parseSuggestedQuestions,
  parseMarkdownTables,
  getSourcesParsingStatus,
  getSuggestedQuestionsParsingStatus,
  type Source,
  type SuggestedQuestion,
  type ParsedTable,
} from '@/utils/agentMarkdownExtractor'

interface Props {
  conversation: IConversation
  chatRoomTitle?: string
  onAnimationComplete?: () => void
  onSendMessage?: (message: string) => void
  animationComplete?: boolean // 부모로부터 완료 상태를 받기 위해 추가
}

const createMarkdownComponents = (
  sources: Source[] | null,
  markdownTables: ParsedTable[] | null,
  chatRoomTitle?: string,
  tableIndexRef?: { current: number },
  isAnimationComplete?: boolean,
  virtualIndexMap?: Map<string, number>,
  isNew?: boolean,
) => {
  // 컴포넌트 생성 시 테이블 인덱스 초기화
  if (tableIndexRef) {
    tableIndexRef.current = 0
  }

  return {
    a: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
      let referenceType = undefined

      if (typeof children === 'string') {
        if (children.startsWith('web_')) referenceType = 'number'
        if (/^[A-Z]+$/.test(children)) referenceType = 'char'
      }

      if (referenceType === 'number' && typeof children === 'string') {
        const source = sources?.find((s) => s.index === children)

        if (source) {
          const tooltipTitle = source.sourceNm
          // 가상 번호 사용 (없으면 원래 번호 사용)
          const displayNumber = virtualIndexMap?.get(children) ?? children.replace(/^web_/, '')

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
                  {displayNumber}
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
    table: ({ children, ...props }: ComponentPropsWithoutRef<'table'> & { 'data-table-id'?: string }) => {
      const currentIndex = tableIndexRef ? tableIndexRef.current++ : 0

      const currentTable = markdownTables && currentIndex < markdownTables.length ? markdownTables[currentIndex] : null
      const shouldShowDownloadButton = !!currentTable && (!isNew || (isAnimationComplete ?? false))

      return (
        <Box sx={{ marginTop: '16px', marginBottom: '16px' }}>
          {shouldShowDownloadButton && currentTable && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: '8px',
                minHeight: '32px',
              }}
            >
              <MIAgentTableDownloadButton
                data-table-id={currentTable.tableId}
                markdownTables={markdownTables ?? undefined}
                chatRoomTitle={chatRoomTitle}
              >
                <DataTrendChartDownloadIcon />
              </MIAgentTableDownloadButton>
            </Box>
          )}
          <Box borderRadius="6px" overflow="hidden" border="1px solid" borderColor="contentBorder.Normal">
            <Box
              component="table"
              {...props}
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                '& th, & td': {
                  padding: '8px 12px',
                  textAlign: 'left',
                },
                '& th': {
                  backgroundColor: 'gray.20',
                  fontWeight: 600,
                },
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      )
    },
  }
}

const MIAgentAnswer = ({
  conversation,
  chatRoomTitle,
  onAnimationComplete,
  onSendMessage,
  animationComplete: propAnimationComplete,
}: Props) => {
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
  const [isAnimationComplete, setIsAnimationComplete] = useState<boolean>(false) // 애니메이션 완료 상태 (리렌더링용)
  const tableIndexRef = useRef<number>(0) // 테이블 인덱스를 추적하기 위한 ref
  const { t } = useTranslation()

  tableIndexRef.current = 0

  // 출처
  const sources = useMemo<Source[] | null>(() => {
    if (typeof displayMessage !== 'string' || !displayMessage) return null
    const parsed = parseSources(displayMessage)

    if (!parsed) return null

    // index의 숫자 부분을 기준으로 정렬
    const sorted = [...parsed].sort((a, b) => {
      const numA = Number.parseInt(a.index.replace(/^web_/, ''), 10) || 0
      const numB = Number.parseInt(b.index.replace(/^web_/, ''), 10) || 0
      return numA - numB
    })

    return sorted
  }, [displayMessage])

  // 가상 번호 매핑 생성 (원래 index -> 순차 번호 1,2,3,4...)
  const virtualIndexMap = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>()
    if (sources) {
      sources.forEach((source, index) => {
        map.set(source.index, index + 1)
      })
    }
    return map
  }, [sources])

  // 추천 질문
  const suggestedQuestions = useMemo<SuggestedQuestion[] | null>(() => {
    if (typeof displayMessage !== 'string' || !displayMessage) return null
    return parseSuggestedQuestions(displayMessage)
  }, [displayMessage])

  // 마크다운 테이블
  const markdownTables = useMemo<ParsedTable[] | null>(() => {
    if (typeof displayMessage !== 'string' || !displayMessage) return null
    const tables = parseMarkdownTables(displayMessage)
    return tables.length > 0 ? tables : null
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

  const ANIMATION_DURATION = 200

  // 청크 처리 간격 설정 (동적 조정)
  const MIN_PROCESSING_INTERVAL_MS = 0
  const MAX_PROCESSING_INTERVAL_MS = 300
  const BASE_CHUNK_LENGTH_THRESHOLD = 100 // 기준 청크 길이 (문자 수)
  const BASE_SPEED_THRESHOLD = 50

  const markdownComponents = useMemo(
    () =>
      createMarkdownComponents(
        sources,
        markdownTables,
        chatRoomTitle,
        tableIndexRef,
        isAnimationComplete || propAnimationComplete,
        virtualIndexMap,
        conversation.isNew,
      ),
    [sources, markdownTables, chatRoomTitle, isAnimationComplete, propAnimationComplete, virtualIndexMap, conversation.isNew],
  )

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
      setIsAnimationComplete(false) // 애니메이션 완료 상태 초기화
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

      // 이미 완료된 대화(스트리밍이 아닌 대화)인 경우 즉시 animationComplete 설정
      if (baseMessage && chunkManager.getChunks(conversation.qnaNo).length === 0) {
        animationCompleteCalledRef.current = true
        setIsAnimationComplete(true)
        onAnimationComplete?.()
      }
    }
  }, [conversation.qnaNo, conversation.answer, t, onAnimationComplete])

  // FULLTEXT가 왔을 때 최종 메시지로 업데이트
  useEffect(() => {
    const finalMessageRaw = conversation.answer?.[StreamEventType.MESSAGE] ?? ''
    let finalMessage

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
        setIsAnimationComplete(true)
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
      // 링크 참조 [web_1]등 앞에 공백이 없으면 공백 추가([web_1][web_2] -> [web_1] [web_2] 형식으로 변환)
      content = content.replaceAll(/([^\s])(?=\[web_\d+\])/g, '$1 ')
      const sourcesText = sources.map((source) => `[${source.index}]: ${source.url}`).join('  \n')
      content = `${sourcesText}\n\n${content}`
    }

    return content
  }, [displayMessage, currentAnimatingChunk, removeIncompleteCommentStart, removeIncompleteComments, sources])

  const hasAnswerContent = Boolean(conversation.answer?.[StreamEventType.MESSAGE])
  const hasStatusMessage = Boolean(conversation.statusMessage)
  const hasStreamingContent = Boolean(displayMessage || currentAnimatingChunk)

  const isParsingComplete = sourcesParsingStatus !== 'parsing' && suggestedQuestionsParsingStatus !== 'parsing'
  const shouldShowContent = isParsingComplete

  const isCancelled = conversation.statusCd === ChatRoomErrorStatus.CANCELLED_BY_USER

  if (!hasAnswerContent && !hasStatusMessage && !hasStreamingContent) return null

  return (
    <Box className={clsx(style.MiAgentAnswer)} ref={answerRef}>
      {shouldShowContent && (
        <ReactMarkdown
          key={`markdown-${conversation.qnaNo}`}
          components={markdownComponents}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {displayContent}
        </ReactMarkdown>
      )}
      {conversation.statusMessage && !isCancelled && (
        <Box key={`${conversation.qnaNo ?? 'global'}-${conversation.statusMessage}`} className={style.statusMessage}>
          {conversation.statusMessage ?? parsingLoadingMessage}
        </Box>
      )}
      {parsingLoadingMessage && !isCancelled && (
        <Box key={`${conversation.qnaNo ?? 'global'}-${parsingLoadingMessage}`} className={style.statusMessage}>
          {parsingLoadingMessage}
        </Box>
      )}

      {animationCompleteCalledRef.current && !isCancelled && (
        <Stack gap="20px">
          {sources && <MIAgentSources sources={sources} isNew={conversation.isNew} />}
          {conversation.reports && conversation.reports.length > 0 && (
            <MIAgentReports reports={conversation.reports} isNew={conversation.isNew} />
          )}
          {suggestedQuestions && (
            <MIAgentSuggestedQuestions suggestedQuestions={suggestedQuestions} isNew={conversation.isNew} onSendMessage={onSendMessage} />
          )}
        </Stack>
      )}
    </Box>
  )
}

export default MIAgentAnswer
