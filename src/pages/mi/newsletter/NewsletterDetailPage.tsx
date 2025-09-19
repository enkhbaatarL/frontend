import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import html2canvas from 'html2canvas'
import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { InflectionPointChartRef } from './components/chart/InflectionPointChart'
import Chart from './components/emailTemplate/Chart'
import Header from './components/emailTemplate/Header'
import News from './components/emailTemplate/News'
import Reference from './components/emailTemplate/Reference'
import Summarized from './components/emailTemplate/Summarized'
import Title from './components/emailTemplate/Title'

import MIButton from '@/components/common/button/MIButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import AddIcon from '@/components/common/icons/AddIcon'
import CheckIcon from '@/components/common/icons/agent/CheckIcon'
import EditIcon from '@/components/common/icons/agent/EditIcon'
import LoadingSpinner from '@/components/common/influence-factor-chart/icons/LoadingSpinIcon'
import MISelect from '@/components/common/select/MISelect'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import newsletterService, { INewsletterIssueDetail, IRelatedNewsEventItem, NewsletterDetailPageMode } from '@/service/mi/newsletter'
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
          trend: item.showInChart === false ? ('' as const) : item.trend,
        })),
      },
    },
  }
}

const sortNewsByDateTime = (newsItems: IRelatedNewsEventItem[]): IRelatedNewsEventItem[] =>
  [...newsItems].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))

const NewsletterDetailPage = () => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const { onShow: showDialog, onHide: hideDialog } = useDialog()

  const emailContentRef = useRef<HTMLTableElement>(null)
  const chartRef = useRef<InflectionPointChartRef>(null)

  const [loadingNewsletterIds, setLoadingNewsletterIds] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<NewsletterDetailPageMode>(NewsletterDetailPageMode.VIEW)
  const [newsletterIssueDetail, setNewsletterIssueDetail] = useState<INewsletterIssueDetail | undefined | null>(undefined)
  const [editingNews, setEditingNews] = useState<Record<string, Record<string, string | boolean>>>({})
  const [tempNewsItems, setTempNewsItems] = useState<IRelatedNewsEventItem[]>([])
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState(0)

  const [isSummarizedPublished, setIsSummarizedPublished] = useState(true)
  const [unPublishedNewsIds, setUnPublishedNewsIds] = useState<string[]>([])

  const { newsletterId, issueNo } = useParams()

  const { data: newsletterIssueDetailData, optimisticUpdate: optimisticUpdateDetail } = useSearchFilter<
    Record<string, never>,
    INewsletterIssueDetail | null
  >(
    (_params) => {
      if (!newsletterId || !issueNo) {
        return Promise.resolve(null)
      }
      return newsletterService.getNewsletterIssueDetail(newsletterId, issueNo)
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

  const { data: newsletterIssues } = useQuery({
    queryKey: ['newsletterIssues', newsletterId],
    queryFn: () => {
      if (!newsletterId) {
        return null
      }

      return newsletterService.getNewsletterIssues(newsletterId)
    },
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!newsletterId,
  })

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
    setEditingNews((prev) => ({
      ...prev,
      [newsId]: {
        ...prev[newsId],
        [field]: value,
      },
    }))
  }, [])

  const handleAddNews = useCallback(() => {
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
    if (tempNewsItems.length > 0) {
      showDialog({
        title: 'Reset',
        children: '추가한 모든 뉴스가 삭제됩니다.\n정말로 초기화하시겠습니까?',
        width: 400,
        actions: [
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: hideDialog,
          },
          {
            label: '초기화',
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setEditingNews({})
              setTempNewsItems([])
              hideDialog()
            },
          },
        ],
      })
    } else {
      setEditingNews({})
      setTempNewsItems([])
    }
  }, [tempNewsItems.length, showDialog, hideDialog])

  const handleApplyNews = useCallback(
    (latestUnPublishedNewsIds?: string[]) => {
      if (!newsletterIssueDetail) return

      // 현재 스크롤 위치 저장
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop
      setSavedScrollPosition(currentScrollTop)

      // 필수 조건 검증 함수
      const validateRequiredFields = (item: IRelatedNewsEventItem) => {
        const time = String(editingNews[item.newsId]?.createTime ?? item.createTime)
        const date = String(editingNews[item.newsId]?.createdDate ?? item.createdDate)
        const title = String(editingNews[item.newsId]?.title ?? item.title)
        const content = String(editingNews[item.newsId]?.content ?? item.content.join('\n'))

        return time.trim() !== '' && date.trim() !== '' && title.trim() !== '' && content.trim() !== ''
      }

      // 모든 항목(기존 + 신규)의 필수 조건 검증
      const allItems = [...(newsletterIssueDetail.issueDetail.relatedNews.newsEventItems || []), ...tempNewsItems]
      const allItemsValid = allItems.every(validateRequiredFields)

      if (!allItemsValid) {
        showSnackbar('모든 필수 항목을 입력해주세요', { variant: 'error' })
        return
      }

      const currentUnPublishedNewsIds = latestUnPublishedNewsIds ?? unPublishedNewsIds

      const updateNewsItem = (item: IRelatedNewsEventItem): IRelatedNewsEventItem => {
        const edits = editingNews[item.newsId]
        const isUnPublished = currentUnPublishedNewsIds.includes(item.newsId)

        let showInChartValue
        let validTrend

        if (isUnPublished) {
          showInChartValue = false
          validTrend = ''
        } else {
          validTrend = edits?.trend ?? item.trend ?? ''
          showInChartValue = validTrend !== ''
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
          trend: validTrend as 'UP' | 'DOWN' | 'NONE' | '',
          showInChart: showInChartValue,
          timestamp,
        }
      }

      setNewsletterIssueDetail((prev) => {
        if (!prev) return prev

        // 기존 뉴스 항목들에 수정사항 적용
        const updatedExistingNews = prev.issueDetail.relatedNews.newsEventItems.map(updateNewsItem)

        // 새로 추가한 항목들에 수정사항 적용
        const updatedTempNews = tempNewsItems.map(updateNewsItem)

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

      setTempNewsItems([])
      setEditingNews({})

      // 정렬 키 업데이트하여 DOM 요소 강제 재생성
      setSortKey((prev) => prev + 1)

      showSnackbar('뉴스 항목이 성공적으로 적용되었습니다', { variant: 'success' })
    },
    [newsletterIssueDetail, tempNewsItems, editingNews, showSnackbar, unPublishedNewsIds],
  )

  const initializeNewsletterIssueDetail = useCallback(() => {
    setNewsletterIssueDetail(processNewsletterData(newsletterIssueDetailData))
    setIsSummarizedPublished(true)
    setUnPublishedNewsIds([])
  }, [newsletterIssueDetailData])

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

  const createEmailContentHTML = async (): Promise<string> => {
    const originalMode = mode
    setMode(NewsletterDetailPageMode.CAPTURE)

    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })

    const html = (emailContentRef.current?.outerHTML ?? '').replaceAll(/<canvas[^>]*>.*?<\/canvas>/gis, '')
    setMode(originalMode)

    return html
  }

  const createEMLContent = (htmlContent: string) => `From: sender@example.com
To: recipient@example.com
Subject: HTML Content Test
MIME-Version: 1.0
X-Unsent: 1
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: 7bit

<body>
  ${htmlContent}
</body>`

  const handleDownloadEML = async () => {
    const emailContentHTML = await createEmailContentHTML()
    const emailContent = createEMLContent(emailContentHTML)
    const blob = new Blob([emailContent], { type: 'message/rfc822' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'newsletter.eml'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPNG = async () => {
    if (!emailContentRef.current) return

    try {
      const originalMode = mode
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
    } catch (error) {
      console.error('PNG 다운로드 실패:', error)
      showSnackbar('PNG 다운로드 중 오류가 발생했습니다', { variant: 'error' })
    }
  }

  const handleBackToView = () => {
    chartRef.current?.resetBoxPositions()
    setMode(NewsletterDetailPageMode.VIEW)
    initializeNewsletterIssueDetail()
  }

  useEffect(() => {
    initializeNewsletterIssueDetail()
  }, [newsletterIssueDetailData, initializeNewsletterIssueDetail])

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" py="12px" width="800px" margin="38px auto 20px auto">
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
        <Box display="flex">
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
          <Box display={loadingNewsletterIds.has(newsletterId ?? '') ? 'none' : 'flex'} gap="12px">
            {mode === NewsletterDetailPageMode.VIEW && (
              <>
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
                <MIButton
                  type="outlined"
                  color="gray"
                  contentType="text"
                  startIcon={<EditIcon />}
                  onClick={() => setMode(NewsletterDetailPageMode.EDIT)}
                >
                  Edit
                </MIButton>
              </>
            )}
            {mode === NewsletterDetailPageMode.EDIT && (
              <MIButton type="filled" color="primary" contentType="text" startIcon={<OpenInNewIcon />} onClick={handleDownloadEML}>
                Send to Mail Apps
              </MIButton>
            )}
            <MIButton type="outlined" color="gray" contentType="icon" startIcon={<ChartDownloadIcon />} onClick={handleDownloadPNG} />
          </Box>
        </Box>
      </Box>

      <table ref={emailContentRef} style={{ width: '800px', margin: '0 auto', padding: '0', fontFamily: 'Pretendard, sans-serif' }}>
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
                onPublishedChange={setIsSummarizedPublished}
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
                relatedNews={newsletterIssueDetail?.issueDetail.relatedNews.newsEventItems}
                mode={mode}
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
              />
            </td>
          </tr>
          <tr>
            <td>
              <Reference referenceData={newsletterIssueDetail?.issueDetail.references ?? []} />
            </td>
          </tr>
        </tbody>
      </table>
    </Box>
  )
}

export default NewsletterDetailPage
