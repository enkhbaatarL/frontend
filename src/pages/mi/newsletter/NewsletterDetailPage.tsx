import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import html2canvas from 'html2canvas'
import { useRef, useState, useCallback, useEffect, useLayoutEffect, CSSProperties, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { InflectionPointChartRef } from './components/chart/InflectionPointChart'
import Chart from './components/emailTemplate/Chart'
import Disclaimer from './components/emailTemplate/Disclaimer'
import Header from './components/emailTemplate/Header'
import News from './components/emailTemplate/News'
// import NewsHynix from './components/emailTemplate/NewsHynix'
import Reference from './components/emailTemplate/Reference'
import Summarized from './components/emailTemplate/Summarized'
import Title from './components/emailTemplate/Title'

import MIButton from '@/components/common/button/MIButton'
import MISimpleConfirm from '@/components/common/confirm/MISimpleConfirm'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import AddIcon from '@/components/common/icons/AddIcon'
import CheckIcon from '@/components/common/icons/agent/CheckIcon'
import EditIcon from '@/components/common/icons/agent/EditIcon'
import LoadingSpinner from '@/components/common/influence-factor-chart/icons/LoadingSpinIcon'
import MISelect from '@/components/common/select/MISelect'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import newsletterService, { INewsletterIssueDetail, IRelatedNewsEventItem, NewsletterDetailPageMode } from '@/service/mi/newsletter'
import useAuthStore from '@/store/useAuthStore'
import useDialog from '@/store/useDialog'

dayjs.extend(utc)
dayjs.extend(timezone)

const createTimestampInNY = (date: string, time: string): number => {
  try {
    // 날짜와 시간을 합쳐서 뉴욕 시간대로 파싱
    return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', 'America/New_York').valueOf()
  } catch (error) {
    console.error('Invalid date/time format:', error)
    return dayjs().tz('America/New_York').valueOf()
  }
}

const processNewsletterData = (data: INewsletterIssueDetail | null | undefined) => {
  if (!data) return data

  return {
    ...data,
    issueDetail: {
      ...data.issueDetail,
      relatedNews: {
        ...data.issueDetail.relatedNews,
        newsEventItems: data.issueDetail.relatedNews.newsEventItems.map((item) => ({
          ...item,
          content: item.content.map((content) => (content.startsWith('-') ? content : `- ${content}`)),
          trend: !item.showInChart ? ('' as const) : item.trend,
        })),
      },
    },
  }
}

const sortNewsByDateTime = (newsItems: IRelatedNewsEventItem[]): IRelatedNewsEventItem[] =>
  [...newsItems].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))

const STORAGE_KEY_PREFIX = 'newsletter_issue_draft'

type NewsletterDraftState = {
  newsletterIssueDetail: INewsletterIssueDetail | null
  editingNews: Record<string, Record<string, string | boolean>>
  tempNewsItems: IRelatedNewsEventItem[]
  unPublishedNewsIds: string[]
  deletedNewsIds: string[]
  isSummarizedPublished: boolean
  mode: NewsletterDetailPageMode
  sortKey: number
  expiresAt: number // 만료일 (timestamp)
}

const NewsletterDetailPage = () => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const { onShow: showDialog, onHide: hideDialog } = useDialog()
  const { setStickyHeader } = useStickyHeader()
  const { t } = useTranslation()

  const emailContentRef = useRef<HTMLTableElement>(null)
  const chartRef = useRef<InflectionPointChartRef>(null)

  const [loadingNewsletterIds, setLoadingNewsletterIds] = useState<Set<string>>(new Set())
  const { newsletterId, issueNo } = useParams()
  const { accessCompanyInfo } = useAuthStore()

  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const draftStorageKey = useMemo(() => {
    if (!newsletterId || !issueNo) return null
    return `${STORAGE_KEY_PREFIX}_${customerCompanyNo}_${newsletterId}_${issueNo}`
  }, [customerCompanyNo, issueNo, newsletterId])

  const [forceRefresh, setForceRefresh] = useState(0)

  const initialDraftState = useMemo(() => {
    if (!draftStorageKey) return null
    const savedDraft = localStorage.getItem(draftStorageKey)
    if (!savedDraft) return null
    try {
      const parsed = JSON.parse(savedDraft) as NewsletterDraftState
      // 만료일 체크
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        localStorage.removeItem(draftStorageKey)
        return null
      }
      return parsed
    } catch (error) {
      console.error('Failed to parse newsletter draft from localStorage:', error)
      localStorage.removeItem(draftStorageKey)
      return null
    }
    // forceRefresh를 의존성에 추가하여 localStorage 삭제 후 재계산되도록 함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStorageKey, forceRefresh])

  // 로컬스토리지가 있어도 기본적으로는 API 데이터로 초기화
  const [mode, setMode] = useState<NewsletterDetailPageMode>(NewsletterDetailPageMode.VIEW)
  const [newsletterIssueDetail, setNewsletterIssueDetail] = useState<INewsletterIssueDetail | undefined | null>(undefined)
  const [editingNews, setEditingNews] = useState<Record<string, Record<string, string | boolean>>>({})
  const [tempNewsItems, setTempNewsItems] = useState<IRelatedNewsEventItem[]>([])
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)

  const [isSummarizedPublished, setIsSummarizedPublished] = useState(true)
  // 실제로 Edit 모드에서 변경이 발생했는지 여부 (변경이 있을 때만 draft 자동 저장)
  const [hasDraftChanged, setHasDraftChanged] = useState(false)
  const [unPublishedNewsIds, setUnPublishedNewsIds] = useState<string[]>([])
  const [deletedNewsIds, setDeletedNewsIds] = useState<string[]>([])

  const [isContinueModalOpen, setIsContinueModalOpen] = useState(false)

  const {
    data: newsletterIssueDetailData,
    optimisticUpdate: optimisticUpdateDetail,
    isLoading: isNewsletterIssueDetailLoading,
  } = useSearchFilter<Record<string, never>, INewsletterIssueDetail | null>(
    () => {
      if (!newsletterId || !issueNo) {
        return Promise.resolve(null)
      }
      // 로컬스토리지가 있어도 항상 API 조회
      return newsletterService.getNewsletterIssueDetail(customerCompanyNo, newsletterId, issueNo)
    },
    {},
    {
      page: 1,
      size: 1,
    },
    {
      initialFetch: true,
    },
  )

  const { data: newsletterIssues, isLoading: isNewsletterIssuesLoading } = useQuery({
    queryKey: ['newsletterIssues', newsletterId],
    queryFn: () => {
      if (!newsletterId) {
        return null
      }

      return newsletterService.getNewsletterIssues(customerCompanyNo, newsletterId)
    },
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!newsletterId,
  })

  // Summarized 컴포넌트의 게시 여부 변경 시 draft 변경 플래그도 함께 설정
  const handleSummarizedPublishedChange = useCallback((value: boolean) => {
    setHasDraftChanged(true)
    setIsSummarizedPublished(value)
  }, [])

  // Edit 버튼 클릭 시 로컬스토리지 체크 및 팝업 표시
  const handleEditClick = useCallback(() => {
    if (initialDraftState) {
      // localStorage에 저장된 값이 있으면 이어쓰기 팝업 표시
      setIsContinueModalOpen(true)
    } else {
      // localStorage에 값이 없으면 바로 edit 모드로 전환
      setHasDraftChanged(false)
      setMode(NewsletterDetailPageMode.EDIT)
    }
  }, [initialDraftState])

  const handleSubscribe = useCallback(
    async (targetNewsletterId: string) => {
      if (!newsletterIssueDetail) return

      const newSubscribedState = !newsletterIssueDetail.subscribed
      const newsletterName = newsletterIssueDetail.name

      setLoadingNewsletterIds((prev) => new Set(prev).add(targetNewsletterId))

      try {
        await optimisticUpdateDetail(
          async () => {
            await newsletterService.updateNewsletterSubscribed(targetNewsletterId, newSubscribedState)
            return null
          },
          {
            optimisticData: {
              ...newsletterIssueDetail,
              subscribed: newSubscribedState,
            },
            rollbackOnError: true,
          },
        )

        showSnackbar(`${newsletterName} 이메일 구독이 ${newSubscribedState ? '완료' : '해제'}되었습니다`, {
          variant: 'success',
        })
      } catch (error) {
        console.error('구독/해제 실패:', error)
        showSnackbar(`${newsletterName} 구독 처리 중 오류가 발생했습니다`, {
          variant: 'error',
        })
      } finally {
        setLoadingNewsletterIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(targetNewsletterId)
          return newSet
        })
      }
    },
    [newsletterIssueDetail, optimisticUpdateDetail, showSnackbar],
  )

  const handleNewsUpdate = useCallback((newsId: string, field: string, value: string | boolean) => {
    setHasDraftChanged(true)
    setEditingNews((prev) => ({
      ...prev,
      [newsId]: {
        ...prev[newsId],
        [field]: value,
      },
    }))

    // tempNewsItems에도 showInChart 변경을 반영 (로컬스토리지 저장 시 혼동 방지)
    if (field === 'showInChart') {
      setTempNewsItems((prev) => prev.map((item) => (item.newsId === newsId ? { ...item, showInChart: Boolean(value) } : item)))
    }
  }, [])

  const handleAddNews = useCallback(() => {
    setHasDraftChanged(true)
    const newNewsId = `temp_${Date.now()}`
    const newNewsItem = {
      newsId: newNewsId,
      title: '',
      content: [''],
      timestamp: undefined,
      createdDate: '',
      createTime: '',
      source: '',
      showInChart: false,
    }

    // 임시 저장소에만 추가
    setTempNewsItems((prev) => [...prev, newNewsItem])

    setEditingNews((prev) => ({
      ...prev,
      [newNewsId]: {
        title: '',
        content: '',
        createTime: newNewsItem.createTime,
        createdDate: newNewsItem.createdDate,
      },
    }))
  }, [])

  const handleResetNews = useCallback(() => {
    setHasDraftChanged(true)
    showDialog({
      title: t('newsletter.editMode.resetDialog.title'),
      width: 400,
      actions: [
        {
          label: t('common.cancel'),
          variant: 'outlined',
          color: 'gray',
          onClick: hideDialog,
        },
        {
          label: t('common.reset'),
          variant: 'filled',
          color: 'primary',
          onClick: () => {
            setEditingNews({})
            setTempNewsItems([])
            setDeletedNewsIds([])
            hideDialog()
          },
        },
      ],
    })
  }, [showDialog, hideDialog, t])

  const handleDeleteNewsConfirm = useCallback(
    (newsId: string) => {
      setHasDraftChanged(true)
      // newsletterIssueDetail에 있는지 먼저 확인
      const isInNewsletterDetail = newsletterIssueDetail?.issueDetail.relatedNews.newsEventItems?.some((item) => item.newsId === newsId)

      if (newsId.startsWith('temp_') && !isInNewsletterDetail) {
        // tempNewsItems에만 있는 경우
        setTempNewsItems((prev) => prev.filter((item) => item.newsId !== newsId))
      } else {
        // newsletterIssueDetail에 있거나 일반 뉴스인 경우
        setDeletedNewsIds((prev) => [...prev, newsId])
      }

      setEditingNews((prev) => {
        const updated = { ...prev }
        delete updated[newsId]
        return updated
      })

      hideDialog()
    },
    [hideDialog, newsletterIssueDetail],
  )

  const handleDeleteNews = useCallback(
    (newsId: string) => {
      showDialog({
        title: t('newsletter.editMode.deleteDialog.title'),
        width: 400,
        actions: [
          {
            label: t('common.cancel'),
            variant: 'outlined',
            color: 'gray',
            onClick: hideDialog,
          },
          {
            label: t('common.delete'),
            variant: 'filled',
            color: 'red',
            onClick: () => handleDeleteNewsConfirm(newsId),
          },
        ],
      })
    },
    [showDialog, hideDialog, handleDeleteNewsConfirm, t],
  )

  const handleApplyNews = useCallback(
    (latestUnPublishedNewsIds?: string[]) => {
      if (!newsletterIssueDetail) return

      // Apply가 눌렸다는 것은 이미 어떤 형태로든 편집이 일어났다는 의미이므로 draft 저장 대상
      setHasDraftChanged(true)

      // 현재 스크롤 위치 저장
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop
      setSavedScrollPosition(currentScrollTop)

      const currentUnPublishedNewsIds = latestUnPublishedNewsIds ?? unPublishedNewsIds

      // 필수 조건 검증 함수
      const validateRequiredFields = (item: IRelatedNewsEventItem) => {
        const time = String(editingNews[item.newsId]?.createTime ?? item.createTime)
        const date = String(editingNews[item.newsId]?.createdDate ?? item.createdDate)
        const title = String(editingNews[item.newsId]?.title ?? item.title)
        const content = String(editingNews[item.newsId]?.content ?? item.content.join('\n'))

        return time.trim() !== '' && date.trim() !== '' && title.trim() !== '' && content.trim() !== ''
      }

      // 모든 항목(기존 + 신규)의 필수 조건 검증 (비활성화된 뉴스는 제외)
      const allItems = [...(newsletterIssueDetail.issueDetail.relatedNews.newsEventItems || []), ...tempNewsItems]
      const activeItems = allItems.filter((item) => !currentUnPublishedNewsIds.includes(item.newsId))
      const allItemsValid = activeItems.every(validateRequiredFields)

      if (!allItemsValid) {
        showSnackbar(t('newsletter.editMode.error.requiredFields'), { variant: 'error' })
        return
      }

      const updateNewsItem = (item: IRelatedNewsEventItem): IRelatedNewsEventItem => {
        const edits = editingNews[item.newsId]
        const isUnPublished = currentUnPublishedNewsIds.includes(item.newsId)

        const validTrend = edits?.trend ?? item.trend ?? ''

        // editingNews에 showInChart 값이 명시적으로 설정되어 있으면 우선 사용
        // 없으면 게시 상태와 trend 값에 따라 계산
        let showInChartValue: boolean
        if (edits?.showInChart !== undefined) {
          showInChartValue = Boolean(edits.showInChart)
        } else {
          showInChartValue = isUnPublished ? false : validTrend !== ''
        }

        const createTime = String(edits?.createTime ?? item.createTime)
        const createdDate = String(edits?.createdDate ?? item.createdDate)

        const timestamp = createTimestampInNY(createdDate, createTime)

        return {
          ...item,
          createTime,
          createdDate,
          title: String(edits?.title ?? item.title),
          content: typeof edits?.content === 'string' ? edits?.content.split('\n') : item.content,
          source: String(edits?.source ?? item.source ?? ''),
          trend: validTrend as 'UP' | 'DOWN' | 'NONE' | '',
          showInChart: showInChartValue,
          timestamp,
        }
      }

      setNewsletterIssueDetail((prev) => {
        if (!prev) return prev

        // 기존 뉴스 항목들에 수정사항 적용하고 삭제된 뉴스는 제외
        const updatedExistingNews = prev.issueDetail.relatedNews.newsEventItems
          .filter((item) => !deletedNewsIds.includes(item.newsId))
          .map(updateNewsItem)

        // 새로 추가한 항목들에 수정사항 적용 (미게시 뉴스는 제외)
        const updatedTempNews = tempNewsItems.filter((item) => !currentUnPublishedNewsIds.includes(item.newsId)).map(updateNewsItem)

        // 기존 뉴스와 새로 추가한 뉴스를 합치고 일자+시간 순으로 정렬
        const allNewsItems = [...updatedExistingNews, ...updatedTempNews]
        const sortedNewsItems = sortNewsByDateTime(allNewsItems)

        return {
          ...prev,
          issueDetail: {
            ...prev.issueDetail,
            relatedNews: {
              ...prev.issueDetail.relatedNews,
              newsEventItems: sortedNewsItems,
            },
          },
        }
      })

      // 미게시 뉴스는 tempList로 유지
      setTempNewsItems((prev) => prev.filter((item) => currentUnPublishedNewsIds.includes(item.newsId)))
      setEditingNews({})
      setDeletedNewsIds([])

      // 정렬 키 업데이트하여 DOM 요소 강제 재생성
      setSortKey((prev) => prev + 1)

      // Apply 후에도 edit 모드 유지 (로컬스토리지는 계속 저장됨)
      // localStorage는 삭제하지 않고 계속 유지

      showSnackbar(t('newsletter.editMode.snackbar.newsUpdated'), { variant: 'success' })
    },
    [newsletterIssueDetail, tempNewsItems, editingNews, showSnackbar, unPublishedNewsIds, deletedNewsIds, t, draftStorageKey],
  )

  const initializeNewsletterIssueDetail = useCallback(() => {
    setNewsletterIssueDetail(processNewsletterData(newsletterIssueDetailData))
    setIsSummarizedPublished(true)
    setUnPublishedNewsIds([])
    setDeletedNewsIds([])
  }, [newsletterIssueDetailData])

  useEffect(() => {
    // 실제 변경(hasDraftChanged)이 발생했을 때만 draft 자동 저장
    if (mode !== NewsletterDetailPageMode.EDIT || !newsletterIssueDetail || !draftStorageKey || !hasDraftChanged) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      // 만료일을 일주일 후로 설정
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7일 후

      const draftToSave: NewsletterDraftState = {
        newsletterIssueDetail,
        editingNews,
        tempNewsItems,
        unPublishedNewsIds,
        deletedNewsIds,
        isSummarizedPublished,
        mode,
        sortKey,
        expiresAt,
      }
      localStorage.setItem(draftStorageKey, JSON.stringify(draftToSave))
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [
    deletedNewsIds,
    editingNews,
    isSummarizedPublished,
    mode,
    draftStorageKey,
    newsletterIssueDetail,
    sortKey,
    tempNewsItems,
    unPublishedNewsIds,
    hasDraftChanged,
  ])

  // 스크롤 위치 복원
  useLayoutEffect(() => {
    if (savedScrollPosition !== null) {
      // DOM 업데이트 완료 후 스크롤 복원
      const restoreScroll = () => {
        window.scrollTo({
          top: savedScrollPosition,
          behavior: 'instant',
        })
        setSavedScrollPosition(null)
      }

      // 여러 프레임에 걸쳐 스크롤 복원 시도
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreScroll)
      })
    }
  }, [newsletterIssueDetail, savedScrollPosition])

  const createEmailContentHTML = useCallback(async (): Promise<string> => {
    setIsCapturing(true)
    const originalMode = mode
    setMode(NewsletterDetailPageMode.CAPTURE)

    // 차트가 완전히 렌더링될 때까지 충분히 대기
    await new Promise((resolve) => {
      const waitForChartRendering = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              // ReferenceChart의 이미지 변환 완료 확인
              const checkChartImages = () => {
                const chartImages = emailContentRef.current?.querySelectorAll('img[alt="chart"]')
                if (chartImages && chartImages.length > 0) {
                  const allImagesLoaded = Array.from(chartImages).every((img) => {
                    const htmlImg = img as HTMLImageElement
                    return htmlImg.complete && htmlImg.naturalWidth > 0
                  })

                  if (allImagesLoaded) {
                    resolve(undefined)
                  } else {
                    setTimeout(checkChartImages, 100)
                  }
                } else {
                  setTimeout(checkChartImages, 200)
                }
              }

              checkChartImages()
            }, 1000)
          })
        })
      }
      waitForChartRendering()
    })

    const html = (emailContentRef.current?.outerHTML ?? '').replace(/<canvas[^>]*>.*?<\/canvas>/gis, '')
    setMode(originalMode)
    setIsCapturing(false)

    return html
  }, [mode, setMode])

  const createEMLContent = (subject: string, htmlContent: string) => `From:
To:
Subject: ${subject}
MIME-Version: 1.0
X-Unsent: 1
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: 7bit

<body>
  <!--[if mso]><style type="text/css">body, table, td {font-family: 'Malgun Gothic', '맑은 고딕', sans-serif !important;}</style><![endif]-->
  ${htmlContent.replace(/Pretendard/g, '\'Malgun Gothic\', \'맑은 고딕\'').replace(/\n/g, '<br>')}
</body>`

  const handleDownloadEML = async () => {
    const emailSubject =
      newsletterIssueDetail?.issueDetail.emailSubject ?? `Issue ${issueNo?.padStart(3, '0')} (${newsletterIssueDetail?.issueDetail.date})`
    const emailContentHTML = await createEmailContentHTML()
    const emailContent = createEMLContent(emailSubject, emailContentHTML)
    const blob = new Blob([emailContent], { type: 'message/rfc822' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${emailSubject}.eml`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPNG = async () => {
    if (!emailContentRef.current) return

    try {
      const originalMode = mode

      setIsCapturing(true)
      setMode(NewsletterDetailPageMode.CAPTURE)

      await new Promise((resolve) => {
        setTimeout(resolve, 0)
      })

      const canvas = await html2canvas(emailContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      const link = document.createElement('a')
      link.download = `Issue ${issueNo?.padStart(3, '0')} (${newsletterIssueDetail?.issueDetail.date})`
      link.href = canvas.toDataURL('image/png')
      link.click()

      setMode(originalMode)
      setIsCapturing(false)
    } catch (error) {
      console.error('PNG 다운로드 실패:', error)
      showSnackbar(t('newsletter.editMode.error.pngDownloadError'), { variant: 'error' })
      setIsCapturing(false)
    }
  }

  const handleBackToView = () => {
    chartRef.current?.resetBoxPositions()
    setMode(NewsletterDetailPageMode.VIEW)
    initializeNewsletterIssueDetail()

    // forceRefresh 업데이트하여 initialDraftState 재계산 (localStorage는 유지)
    setForceRefresh((prev) => prev + 1)
  }

  const openPreviewWindow = useCallback(async () => {
    try {
      const previewHtml = await createEmailContentHTML()

      const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Preview</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  ${previewHtml}
</body>
</html>`

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)

      window.open(url, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes')

      // 메모리 정리
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 5000)
    } catch (error) {
      console.error('Preview 생성 중 오류:', error)
      showSnackbar(t('newsletter.editMode.error.previewError'), { variant: 'error' })
    }
  }, [createEmailContentHTML, showSnackbar, t])

  const handleContinue = useCallback(() => {
    if (!initialDraftState) {
      return
    }

    setIsContinueModalOpen(false)
    // 이어쓰기 시작 시, 이후 변경분만 다시 자동저장하도록 플래그 초기화
    setHasDraftChanged(false)
    setMode(initialDraftState.mode ?? NewsletterDetailPageMode.EDIT)
    setEditingNews(initialDraftState.editingNews ?? {})
    setTempNewsItems(initialDraftState.tempNewsItems ?? [])
    setDeletedNewsIds(initialDraftState.deletedNewsIds ?? [])
    setSortKey(initialDraftState.sortKey ?? 0)
    setIsSummarizedPublished(initialDraftState.isSummarizedPublished ?? true)
    setUnPublishedNewsIds(initialDraftState.unPublishedNewsIds ?? [])
    setNewsletterIssueDetail(processNewsletterData(initialDraftState.newsletterIssueDetail))
  }, [initialDraftState])

  const handleResetDraft = useCallback(() => {
    if (!draftStorageKey) return

    // localStorage 삭제
    localStorage.removeItem(draftStorageKey)
    setIsContinueModalOpen(false)

    // 초기화 클릭 시: API로 조회한 값에서 edit 모드로 전환
    setEditingNews({})
    setTempNewsItems([])
    setDeletedNewsIds([])
    setUnPublishedNewsIds([])
    setIsSummarizedPublished(true)
    setSortKey(0)
    setHasDraftChanged(false)
    setMode(NewsletterDetailPageMode.EDIT)

    // forceRefresh를 변경하여 initialDraftState를 재계산
    setForceRefresh((prev) => prev + 1)
  }, [draftStorageKey])

  const baseNewsCount = useMemo(() => {
    const baseCount =
      newsletterIssueDetail?.issueDetail.relatedNews.newsEventItems?.length ??
      newsletterIssueDetailData?.issueDetail.relatedNews.newsEventItems?.length ??
      0
    return baseCount - deletedNewsIds.length
  }, [deletedNewsIds, newsletterIssueDetail, newsletterIssueDetailData])

  // 차트/미리보기용으로 편집값을 반영한 뉴스 목록
  const previewRelatedNews = useMemo(() => {
    const allItems = [...(newsletterIssueDetail?.issueDetail.relatedNews.newsEventItems ?? []), ...tempNewsItems]

    const updateNewsItem = (item: IRelatedNewsEventItem): IRelatedNewsEventItem => {
      const edits = editingNews[item.newsId]
      const isUnPublished = unPublishedNewsIds.includes(item.newsId)

      const validTrend = edits?.trend ?? item.trend ?? ''
      const trendStr = typeof validTrend === 'string' ? validTrend : ''

      let showInChartValue: boolean
      if (edits?.showInChart !== undefined) {
        showInChartValue = Boolean(edits.showInChart)
      } else {
        // UP, DOWN, NONE(중립) 모두 그래프에 표시
        showInChartValue = isUnPublished ? false : (['UP', 'DOWN', 'NONE'] as const).includes(trendStr as 'UP' | 'DOWN' | 'NONE')
      }

      const createTime = String(edits?.createTime ?? item.createTime)
      const createdDate = String(edits?.createdDate ?? item.createdDate)

      const timestamp = createTimestampInNY(createdDate, createTime)

      return {
        ...item,
        createTime,
        createdDate,
        title: String(edits?.title ?? item.title),
        content: typeof edits?.content === 'string' ? edits?.content.split('\n') : item.content,
        source: String(edits?.source ?? item.source ?? ''),
        trend: validTrend as 'UP' | 'DOWN' | 'NONE' | '',
        showInChart: showInChartValue,
        timestamp,
      }
    }

    const activeItems = allItems
      .filter((item) => !deletedNewsIds.includes(item.newsId))
      .filter((item) => !unPublishedNewsIds.includes(item.newsId))
      .map(updateNewsItem)

    return sortNewsByDateTime(activeItems)
  }, [newsletterIssueDetail, tempNewsItems, editingNews, unPublishedNewsIds, deletedNewsIds])

  useEffect(() => {
    if (mode === NewsletterDetailPageMode.EDIT) {
      const editModeHeader = (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          alignSelf="stretch"
          gap="10px"
          padding="12px 0px"
          width="100%"
          sx={{
            backgroundColor: '#212529',
            opacity: 0.9,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Pretendard',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: 1.4,
              textAlign: 'left',
              color: '#FFFFFF',
            }}
          >
            Newsletter Edit Mode - {t('newsletter.editMode.stickyHeader')}
          </Typography>
        </Box>
      )
      setStickyHeader(editModeHeader)
    } else {
      setStickyHeader(null)
    }

    return () => {
      setStickyHeader(null)
    }
  }, [mode, setStickyHeader, t])

  useEffect(() => {
    // 로컬스토리지가 있어도 기본적으로는 API 데이터로 초기화
    // Continue 버튼 클릭 시에만 로컬스토리지 값으로 대치됨
    initializeNewsletterIssueDetail()
  }, [initializeNewsletterIssueDetail, newsletterIssueDetailData])

  return (
    <Box position="relative">
      {(mode === NewsletterDetailPageMode.CAPTURE || isCapturing || isNewsletterIssueDetailLoading || isNewsletterIssuesLoading) && (
        <Box
          position="fixed"
          top="0"
          left="0"
          width="100vw"
          height="100vh"
          zIndex={300}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            backdropFilter: 'blur(2px)',
          }}
        >
          <LoadingSpinner speed={2} />
        </Box>
      )}
      <Box
        display="flex"
        justifyContent="space-between"
        py="12px"
        pr={mode === NewsletterDetailPageMode.VIEW ? '26px' : '0'}
        width="800px"
        margin="38px auto 20px auto"
      >
        {mode === NewsletterDetailPageMode.VIEW && (
          <MISelect
            type="button"
            width={198}
            options={
              newsletterIssues?.issuedList?.map((issue) => ({
                label: `Issue ${issue.no.padStart(3, '0')} (${issue.date})`,
                value: issue.no,
              })) ?? []
            }
            value={issueNo}
            onChange={(value) => {
              navigate(`/mi/newsletters/${newsletterId}/${value.target.value}`)
            }}
          />
        )}
        {mode === NewsletterDetailPageMode.EDIT && (
          <MIButton
            type="outlined"
            color="gray"
            contentType="icon"
            startIcon={<ArrowBackIcon sx={{ width: '20px !important', height: '20px !important' }} />}
            onClick={handleBackToView}
          />
        )}
        <Box display="flex" gap="12px">
          {mode === NewsletterDetailPageMode.VIEW && (
            <>
              <Box display={loadingNewsletterIds.has(newsletterId ?? '') ? 'flex' : 'none'}>
                <MIButton width={130} type="outlined" color="gray" contentType="text" disabled>
                  <Box width={'100%'} height={'100%'} overflow="hidden">
                    <Box
                      display={'flex'}
                      alignItems={'center'}
                      justifyContent={'center'}
                      width={'20px'}
                      height={'20px'}
                      sx={{
                        backgroundColor: 'linear-gradient(107deg, #C2C2C2 8.8%, #FFF 54.4%, #FFF 67.11%, #C4C4C4 100%)',
                      }}
                    >
                      <LoadingSpinner speed={2} />
                    </Box>
                  </Box>
                </MIButton>
              </Box>
              <Box display={loadingNewsletterIds.has(newsletterId ?? '') ? 'none' : 'flex'}>
                <MIButton
                  width={130}
                  type={newsletterIssueDetail?.subscribed ? 'ghost' : 'outlined'}
                  color="gray"
                  contentType="text"
                  startIcon={newsletterIssueDetail?.subscribed ? <CheckIcon /> : <AddIcon />}
                  active={newsletterIssueDetail?.subscribed}
                  onClick={() => {
                    if (newsletterId) {
                      handleSubscribe(newsletterId)
                    }
                  }}
                >
                  {newsletterIssueDetail?.subscribed ? 'Subscribed' : 'Subscribe'}
                </MIButton>
              </Box>
              <MIButton type="outlined" color="gray" contentType="text" startIcon={<EditIcon />} onClick={handleEditClick}>
                Edit
              </MIButton>
            </>
          )}
          {mode === NewsletterDetailPageMode.EDIT && (
            <>
              <MIButton type="outlined" color="gray" contentType="text" onClick={openPreviewWindow}>
                Preview
              </MIButton>
              <MIButton type="filled" color="primary" contentType="text" startIcon={<OpenInNewIcon />} onClick={handleDownloadEML}>
                Send to Mail Apps
              </MIButton>
            </>
          )}
          <MIButton type="outlined" color="gray" contentType="icon" startIcon={<ChartDownloadIcon />} onClick={handleDownloadPNG} />
        </Box>
      </Box>

      <table
        ref={emailContentRef}
        style={
          {
            width: '800px',
            margin: '0 auto',
            padding: '0',
            fontFamily: 'Pretendard, sans-serif',
            backgroundColor: '#ffffff',
          } as CSSProperties
        }
      >
        <thead>
          <tr>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Header
                headerImg={newsletterIssueDetail?.imageBase64}
                title={newsletterIssueDetail?.name}
                subtitle={newsletterIssueDetail?.description}
              />
            </td>
          </tr>
          <tr>
            <td>
              <Title title={newsletterIssueDetail?.issueDetail.title ?? ''} date={newsletterIssueDetail?.issueDetail.date ?? ''} />
            </td>
          </tr>
          <tr>
            <td>
              <Summarized
                content={newsletterIssueDetail?.issueDetail.summary ?? ''}
                mode={mode}
                isPublished={isSummarizedPublished}
                onPublishedChange={handleSummarizedPublishedChange}
              />
            </td>
          </tr>
          <tr>
            <td>
              <Chart
                key={`chart-${sortKey}`}
                chartRef={chartRef}
                title={newsletterIssueDetail?.issueDetail.newsFlowChart.title ?? ''}
                basis={newsletterIssueDetail?.issueDetail.newsFlowChart.aggregationTime ?? ''}
                chartData={newsletterIssueDetail?.issueDetail.newsFlowChart}
                relatedNews={previewRelatedNews}
                mode={mode}
                marketOpenTime={newsletterIssueDetail?.issueDetail.marketOpenTime}
                marketCloseTime={newsletterIssueDetail?.issueDetail.marketCloseTime}
              />
            </td>
          </tr>
          <tr>
            <td>
              <News
                key={sortKey}
                basis={newsletterIssueDetail?.issueDetail.relatedNews.aggregationTime ?? ''}
                relatedNews={newsletterIssueDetail?.issueDetail.relatedNews.newsEventItems}
                tempNewsItems={tempNewsItems}
                mode={mode}
                onNewsUpdate={handleNewsUpdate}
                onAddNews={handleAddNews}
                onResetNews={handleResetNews}
                onApplyNews={handleApplyNews}
                editingNews={editingNews}
                unPublishedNewsIds={unPublishedNewsIds}
                onUnPublishedNewsIdsChange={setUnPublishedNewsIds}
                onDeleteNews={handleDeleteNews}
                deletedNewsIds={deletedNewsIds}
                baseNewsCount={baseNewsCount}
              />
            </td>
          </tr>
          {/* <tr>
            <td>
              <NewsHynix
                data={{
                  type: 'Hynix',
                  frequency: 'DAILY',
                  hynixNewsItems: [],
                }}
              />
            </td>
          </tr> */}
          <tr>
            <td>
              <Reference
                referenceData={newsletterIssueDetail?.issueDetail.references ?? []}
                marketOpenTime={newsletterIssueDetail?.issueDetail.marketOpenTime}
                marketCloseTime={newsletterIssueDetail?.issueDetail.marketCloseTime}
              />
            </td>
          </tr>
          <tr>
            <td>
              <Disclaimer mode={mode} />
            </td>
          </tr>
        </tbody>
      </table>

      <MISimpleConfirm
        open={isContinueModalOpen}
        content={t('newsletter.editMode.continueDialog.content')}
        width={350}
        zIndex={1600}
        handleClose={() => setIsContinueModalOpen(false)}
        actions={[
          {
            label: t('common.reset'),
            variant: 'outlined',
            color: 'gray',
            onClick: handleResetDraft,
          },
          {
            label: t('newsletter.editMode.buttonLabel.continue'),
            variant: 'filled',
            color: 'primary',
            onClick: handleContinue,
          },
        ]}
      />
    </Box>
  )
}

export default NewsletterDetailPage
