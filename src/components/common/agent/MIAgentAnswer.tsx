import { Box, Stack, Tooltip, Typography } from '@mui/material'
import clsx from 'clsx'
import { useRef, useMemo, useEffect, useState, useCallback, AnchorHTMLAttributes, ComponentPropsWithoutRef } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import style from '@/components/common/agent/MIAgentAnswer.module.scss'
import MIAgentLineChart from '@/components/common/agent/MIAgentLineChart'
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
import {
  isIncompleteStructuredAgentEnvelope,
  normalizeStructuredRelatedData,
  parseStructuredAgentMessage,
  resolveChatAnswerMessageString,
  structuredSourcesToSources,
  structuredTablesToParsedTables,
  type StructuredTable,
} from '@/utils/agentStructuredAnswer'

// ===================================================================
// 애니메이션 모드 플래그
// true  : 풀텍스트를 한 번에 받아 순차 섹션 애니메이션 처리 (현재 기획)
// false : 스트리밍 청크 실시간 애니메이션 처리 (원래 방식)
// ===================================================================
const USE_FULLTEXT_ANIMATION = true

// fulltext 모드 단계별 지연 시간 (ms)
// text → tables → series → relatedData → footer 순서로 순차 등장
const FULLTEXT_ANIM_DELAYS_MS = {
  text: 50,
  tables: 500,
  series: 700,
  relatedData: 900,
  footer: 1100,
} as const

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

const StructuredAnswerTables = ({
  tables,
  parsedTables,
  chatRoomTitle,
  isNew,
  isAnimationComplete,
}: {
  tables: StructuredTable[]
  parsedTables: ParsedTable[]
  chatRoomTitle?: string
  isNew?: boolean
  isAnimationComplete: boolean
}) => (
  <>
    {tables.map((table, tableIdx) => {
      const parsed = parsedTables[tableIdx]
      const shouldShowDownloadButton = Boolean(parsed) && (!isNew || isAnimationComplete)

      return (
        <Box key={parsed?.tableId ?? `st-${tableIdx}`} sx={{ marginTop: '16px', marginBottom: '16px' }}>
          {shouldShowDownloadButton && parsed && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: '8px',
                minHeight: '32px',
              }}
            >
              <MIAgentTableDownloadButton data-table-id={parsed.tableId} markdownTables={parsedTables} chatRoomTitle={chatRoomTitle}>
                <DataTrendChartDownloadIcon />
              </MIAgentTableDownloadButton>
            </Box>
          )}
          <Box borderRadius="6px" overflow="hidden" border="1px solid" borderColor="contentBorder.Normal">
            <Box
              component="table"
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
              <Box component="thead">
                <Box component="tr">
                  {table.headers.map((h) => (
                    <Box component="th" key={`${parsed?.tableId ?? tableIdx}-${h.field}`}>
                      {h.name}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {table.rows.map((row, rowIdx) => (
                  <Box component="tr" key={`${parsed?.tableId ?? tableIdx}-r-${rowIdx}`}>
                    {row.cells.map((cell, cellIdx) => (
                      <Box component="td" key={`${parsed?.tableId ?? tableIdx}-r-${rowIdx}-c-${cellIdx}`}>
                        {cell}
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )
    })}
  </>
)

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

  // fulltext 애니메이션 모드(USE_FULLTEXT_ANIMATION=true) 전용 상태
  // 0: 대기 | 1: 텍스트 | 2: 테이블 | 3: 시리즈 | 4: 관련 데이터 | 5: 출처/하단(완료)
  const [fulltextAnimStage, setFulltextAnimStage] = useState<number>(0)
  const fulltextAnimTimersRef = useRef<NodeJS.Timeout[]>([])

  const { t } = useTranslation()

  tableIndexRef.current = 0

  const savedAnswerMessage = useMemo(
    () => resolveChatAnswerMessageString(conversation.answer as Record<string, unknown> | null | undefined),
    [conversation.answer],
  )
  const streamingCombined = displayMessage + (currentAnimatingChunk?.text ?? '')
  const rawMessage = useMemo(
    () => (streamingCombined.length > savedAnswerMessage.length ? streamingCombined : savedAnswerMessage),
    [streamingCombined, savedAnswerMessage],
  )

  const structuredPayload = useMemo(() => parseStructuredAgentMessage(rawMessage), [rawMessage])
  const incompleteStructured = Boolean(!structuredPayload && isIncompleteStructuredAgentEnvelope(rawMessage))

  const markdownBodyText = useMemo(() => {
    if (structuredPayload) return structuredPayload.data.content ?? ''
    return typeof displayMessage === 'string' ? displayMessage : ''
  }, [structuredPayload, displayMessage])

  // 출처 (구조화 JSON은 data.sources, 기존은 마크다운 주석/본문 파싱)
  const sources = useMemo<Source[] | null>(() => {
    if (structuredPayload?.data.sources?.length) {
      return structuredSourcesToSources(structuredPayload.data.sources)
    }

    if (typeof displayMessage !== 'string' || !displayMessage) return null
    const parsed = parseSources(displayMessage)

    if (!parsed) return null

    const sorted = [...parsed].sort((a, b) => {
      const numA = Number.parseInt(a.index.replace(/^web_/, ''), 10) || 0
      const numB = Number.parseInt(b.index.replace(/^web_/, ''), 10) || 0
      return numA - numB
    })

    return sorted
  }, [structuredPayload, displayMessage])

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

  // 추천 질문 (구조화 응답은 content 문자열만 대상)
  const suggestedQuestions = useMemo<SuggestedQuestion[] | null>(() => {
    const text = markdownBodyText
    if (typeof text !== 'string' || !text) return null
    return parseSuggestedQuestions(text)
  }, [markdownBodyText])

  // 마크다운 본문에 포함된 테이블만 (data.tables는 별도 블록으로 렌더)
  const markdownTables = useMemo<ParsedTable[] | null>(() => {
    if (typeof markdownBodyText !== 'string' || !markdownBodyText) return null
    const tables = parseMarkdownTables(markdownBodyText)
    return tables.length > 0 ? tables : null
  }, [markdownBodyText])

  const structuredApiTables = structuredPayload?.data.tables
  const structuredParsedTables = useMemo(() => {
    if (!structuredApiTables?.length) return null
    return structuredTablesToParsedTables(structuredApiTables)
  }, [structuredApiTables])

  const structuredRelatedList = useMemo(
    () => normalizeStructuredRelatedData(structuredPayload?.data.relatedData),
    [structuredPayload?.data.relatedData],
  )

  const sourcesParsingStatus = useMemo(() => {
    if (typeof markdownBodyText !== 'string') return 'idle'
    return getSourcesParsingStatus(markdownBodyText, sources)
  }, [markdownBodyText, sources])

  const suggestedQuestionsParsingStatus = useMemo(() => {
    if (typeof markdownBodyText !== 'string') return 'idle'
    return getSuggestedQuestionsParsingStatus(markdownBodyText, suggestedQuestions)
  }, [markdownBodyText, suggestedQuestions])

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

      // fulltext 애니메이션 상태 초기화
      if (USE_FULLTEXT_ANIMATION) {
        fulltextAnimTimersRef.current.forEach(clearTimeout)
        fulltextAnimTimersRef.current = []
        setFulltextAnimStage(0)
      }

      const rawAnswer = conversation.answer?.[StreamEventType.MESSAGE]
      const baseMessage = resolveChatAnswerMessageString(conversation.answer as Record<string, unknown> | null | undefined)
      if (rawAnswer !== undefined && rawAnswer !== null && typeof rawAnswer !== 'string' && !baseMessage) {
        if (loggedErrorQnaNoRef.current !== conversation.qnaNo) {
          console.error('Invalid message type:', rawAnswer)
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
      // fulltext 모드에서 신규 대화는 savedAnswerMessage effect에서 순차 애니메이션 처리
      if (baseMessage && chunkManager.getChunks(conversation.qnaNo).length === 0) {
        if (!USE_FULLTEXT_ANIMATION || !conversation.isNew) {
          animationCompleteCalledRef.current = true
          setIsAnimationComplete(true)
          if (USE_FULLTEXT_ANIMATION) setFulltextAnimStage(5)
          onAnimationComplete?.()
        }
      }
    }
  }, [conversation.qnaNo, conversation.answer, conversation.isNew, t, onAnimationComplete])

  // FULLTEXT가 왔을 때 최종 메시지로 업데이트
  useEffect(() => {
    const rawFinal = conversation.answer?.[StreamEventType.MESSAGE]
    const normalizedFinal = resolveChatAnswerMessageString(conversation.answer as Record<string, unknown> | null | undefined)
    const finalMessage =
      rawFinal !== undefined && rawFinal !== null && typeof rawFinal !== 'string' && !normalizedFinal
        ? t('mari.errorMessage.loadError')
        : normalizedFinal

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

  // [fulltext 모드 전용] 풀텍스트 수신 시 섹션을 순차적으로 등장시키는 애니메이션 트리거
  // text → tables → series → relatedData → footer 순서로 FULLTEXT_ANIM_DELAYS_MS 간격으로 표시
  useEffect(() => {
    if (!USE_FULLTEXT_ANIMATION || !conversation.isNew || !savedAnswerMessage) return undefined
    if (animationCompleteCalledRef.current) return undefined

    fulltextAnimTimersRef.current.forEach(clearTimeout)

    const timers: NodeJS.Timeout[] = [
      setTimeout(() => setFulltextAnimStage(1), FULLTEXT_ANIM_DELAYS_MS.text),
      setTimeout(() => setFulltextAnimStage(2), FULLTEXT_ANIM_DELAYS_MS.tables),
      setTimeout(() => setFulltextAnimStage(3), FULLTEXT_ANIM_DELAYS_MS.series),
      setTimeout(() => setFulltextAnimStage(4), FULLTEXT_ANIM_DELAYS_MS.relatedData),
      setTimeout(() => {
        setFulltextAnimStage(5)
        animationCompleteCalledRef.current = true
        setIsAnimationComplete(true)
        onAnimationComplete?.()
      }, FULLTEXT_ANIM_DELAYS_MS.footer),
    ]

    fulltextAnimTimersRef.current = timers

    return () => timers.forEach(clearTimeout)
  }, [conversation.qnaNo, savedAnswerMessage, conversation.isNew, onAnimationComplete])

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

    const hasFinalAnswer = Boolean(savedAnswerMessage)
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
  }, [conversation.qnaNo, conversation.answer, currentAnimatingChunk, onAnimationComplete, savedAnswerMessage])

  useEffect(
    () => () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
      fulltextAnimTimersRef.current.forEach(clearTimeout)
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
    if (incompleteStructured) {
      return ''
    }

    const messageText = structuredPayload
      ? (structuredPayload.data.content ?? '')
      : typeof displayMessage === 'string'
        ? displayMessage
        : ''

    let content = removeIncompleteCommentStart(messageText.replaceAll('~', '&#126;'))

    // 구조화 응답이 아닐 때만 스트리밍 청크를 본문에 합침 (JSON 전체 스트림은 incompleteStructured에서 처리)
    if (!structuredPayload && currentAnimatingChunk) {
      const animatingContent = removeIncompleteCommentStart(currentAnimatingChunk.text)
      const chunkKey = currentAnimatingChunk.key

      const parts = animatingContent.split('\n')
      let convertedAnimatingContent = parts
        .map((part, index) => {
          if (part === '') return '\n'
          return `<span class="streamingContent" data-chunk-key="${chunkKey}-${index}">${part}</span>`
        })
        .join('<br />')

      convertedAnimatingContent = removeIncompleteComments(convertedAnimatingContent)

      content += convertedAnimatingContent
    }

    if (sources && !structuredPayload) {
      content = content.replaceAll(/([^\s])(?=\[web_\d+\])/g, '$1 ')
      const sourcesText = sources.map((source) => `[${source.index}]: ${source.url}`).join('  \n')
      content = `${sourcesText}\n\n${content}`
    }

    return content
  }, [
    incompleteStructured,
    structuredPayload,
    displayMessage,
    currentAnimatingChunk,
    removeIncompleteCommentStart,
    removeIncompleteComments,
    sources,
  ])

  const hasAnswerContent = Boolean(savedAnswerMessage)
  const hasStatusMessage = Boolean(conversation.statusMessage)
  const hasStreamingContent = Boolean(displayMessage || currentAnimatingChunk)

  // fulltext 모드 + 신규 대화 여부: 렌더 조건/클래스 분기에 활용
  const isFulltextNew = USE_FULLTEXT_ANIMATION && Boolean(conversation.isNew)

  const isParsingComplete = sourcesParsingStatus !== 'parsing' && suggestedQuestionsParsingStatus !== 'parsing'
  const shouldShowContent = isParsingComplete

  const isCancelled = conversation.statusCd === ChatRoomErrorStatus.CANCELLED_BY_USER

  if (!hasAnswerContent && !hasStatusMessage && !hasStreamingContent) return null

  const structuredSeries = structuredPayload?.data.series

  return (
    <Box className={clsx(style.MiAgentAnswer)} ref={answerRef}>
      {shouldShowContent && incompleteStructured && !isCancelled && (
        <Box className={style.statusMessage}>{t('mari.answer.generating')}</Box>
      )}
      {/* ── 본문 텍스트 (stage 1) ── */}
      {shouldShowContent && !incompleteStructured && (!isFulltextNew || fulltextAnimStage >= 1) && (
        <Box className={isFulltextNew ? style.fulltextContentFadeIn : undefined}>
          <ReactMarkdown
            key={`markdown-${conversation.qnaNo}`}
            components={markdownComponents}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {displayContent}
          </ReactMarkdown>
        </Box>
      )}
      {/* ── 구조화 테이블 (stage 2) ── */}
      {shouldShowContent &&
        !incompleteStructured &&
        structuredApiTables &&
        structuredParsedTables &&
        (!isFulltextNew || fulltextAnimStage >= 2) && (
        <Box className={isFulltextNew ? style.fulltextSectionFadeIn : undefined}>
          <StructuredAnswerTables
            tables={structuredApiTables}
            parsedTables={structuredParsedTables}
            chatRoomTitle={chatRoomTitle}
            isNew={conversation.isNew}
            isAnimationComplete={Boolean(isAnimationComplete || propAnimationComplete)}
          />
        </Box>
      )}
      {/* ── 시리즈/차트 (stage 3) ── */}
      {shouldShowContent &&
        !incompleteStructured &&
        structuredSeries &&
        structuredSeries.length > 0 &&
        (!isFulltextNew || fulltextAnimStage >= 3) && (
        <Box mt="16px" className={isFulltextNew ? style.fulltextSectionFadeIn : undefined}>
          <MIAgentLineChart series={structuredSeries as NonNullable<IConversation['answer']>[StreamEventType.SERIES]} />
        </Box>
      )}
      {/* ── 관련 데이터 (stage 4) ── */}
      {shouldShowContent && !incompleteStructured && structuredRelatedList.length > 0 && (!isFulltextNew || fulltextAnimStage >= 4) && (
        <Stack py="12px" className={conversation.isNew ? style.parsedDataContainer : undefined} gap="10px">
          <Typography variant="contentTitle" color="content.textBlack" py="8px">
            {t('mari.answer.relatedData.explanation')}
          </Typography>
          <Stack gap="6px">
            {structuredRelatedList.map((item, index) => {
              const goodsNo = item.goodsNo
              const goodsDataNo = item.goodsDataNo
              const canOpenDetail =
                typeof goodsNo === 'number' && !Number.isNaN(goodsNo) && typeof goodsDataNo === 'number' && !Number.isNaN(goodsDataNo)

              return (
                <Stack
                  key={`${goodsNo ?? 'x'}-${goodsDataNo ?? 'y'}-${index}`}
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
                    backgroundColor: 'mari.MariBG',
                    '&:hover': {
                      cursor: canOpenDetail ? 'pointer' : 'default',
                      borderColor: 'contentBorder.Active',
                      backgroundColor: 'contentBG.Hover',
                    },
                    userSelect: 'none',
                  }}
                  onClick={() => {
                    if (!canOpenDetail) return
                    window.open(`/mi/data-detail/${goodsNo}/${goodsDataNo}`, '_blank')
                  }}
                >
                  <Typography variant="subtext" color="content.textBlack">
                    {item.displayNm}
                  </Typography>
                  {/* <Typography variant="subtext3" color="contentText.Disabled">
                    {item.type}
                  </Typography> */}
                </Stack>
              )
            })}
          </Stack>
        </Stack>
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

      {/* ── 출처·리포트·추천 질문 (stage 5 / animationComplete) ── */}
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
