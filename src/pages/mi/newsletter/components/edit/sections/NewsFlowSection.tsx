import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import InflectionPointChart from '@/pages/mi/newsletter/components/chart/InflectionPointChart'
import AddNewsModal from '@/pages/mi/newsletter/components/edit/AddNewsModal'
import InflectionPointMenu from '@/pages/mi/newsletter/components/edit/InflectionPointMenu'
import NewsFormFields from '@/pages/mi/newsletter/components/edit/NewsFormFields'
import Block, { type BlockOrderProps } from '@/pages/mi/newsletter/components/edit/sections/Block'
import { useCreateTimeValidation } from '@/pages/mi/newsletter/hooks/useCreateTimeValidation'
import {
  enrichNewsFlowItemTimestamps,
  filterVisibleNewsFlowItems,
  getEffectiveFieldDef,
  NEWSLETTER_SECTION_CODE,
  NEWSLETTER_SECTION_EDIT_LABEL,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import {
  type INewsFlowChartData,
  type INewsletterSnapshotFieldDef,
  type IRelatedNewsEventItem,
  NewsletterDetailPageMode,
} from '@/service/mi/newsletter'
import useChartEditStore from '@/store/useChartEditStore'

interface NewsFlowSectionProps {
  chartData?: INewsFlowChartData
  relatedNews?: IRelatedNewsEventItem[]
  /** 뉴스 플로우 섹션 `section.fieldDefs` — title, aggregationTime 등 */
  sectionFieldDefs?: Record<string, INewsletterSnapshotFieldDef>
  /** 섹션 `blocks` 중 첫 `NEWS_CARD`의 `fieldDefs` — 뉴스 추가 모달·신규 카드 필수 정책 */
  newsCardTemplateFieldDefs?: Record<string, INewsletterSnapshotFieldDef>
  marketOpenTime?: number
  marketCloseTime?: number
  onChartImageReady?: (image: string) => void
  onTitleChange?: (value?: string) => void
  onAggregationTimeChange?: (value?: string) => void
  onRelatedNewsChange?: (items: IRelatedNewsEventItem[]) => void
  blockOrder?: BlockOrderProps
  /** `NEWS_FLOW` 코드이고 차트 데이터가 없을 때 인라인 차트·뉴스 행 변곡점 메뉴 비표시 */
  hideNewsFlowChart?: boolean
  /** `NEWS_FLOW` 섹션에서 뉴스 카드 순서는 시간순 고정 — 순서 드롭다운 비활성화 */
  disableNewsItemOrder?: boolean
  /** 편집기 섹션 눈 아이콘(숨김) */
  sectionVisibility?: boolean
  onSectionVisibilityChange?: (visible: boolean) => void
  showRequiredIndicator?: boolean
  getNewsItemMissingRequired?: (newsId: string) => boolean
}

const NewsFlowSection = ({
  chartData,
  relatedNews = [],
  sectionFieldDefs,
  newsCardTemplateFieldDefs,
  marketOpenTime,
  marketCloseTime,
  onChartImageReady,
  onTitleChange,
  onAggregationTimeChange,
  onRelatedNewsChange,
  blockOrder,
  hideNewsFlowChart = false,
  disableNewsItemOrder = false,
  sectionVisibility,
  onSectionVisibilityChange,
  showRequiredIndicator = false,
  getNewsItemMissingRequired,
}: NewsFlowSectionProps) => {
  const { getCreateTimeError, isCreateTimeValid } = useCreateTimeValidation()
  const dFlowTitle = getEffectiveFieldDef(sectionFieldDefs, 'title')
  const dFlowAgg = getEffectiveFieldDef(sectionFieldDefs, 'aggregationTime')
  const visibleRelatedNews = useMemo(() => filterVisibleNewsFlowItems(relatedNews), [relatedNews])
  const chartRelatedNews = useMemo(() => visibleRelatedNews.filter((n) => n.visibility !== false), [visibleRelatedNews])
  const { chartType, boxPositions, titleEdits, setChartType, onBoxPositionChange, resetBoxPositions, setTitleEdit } = useChartEditStore()

  /** 차트·변곡점 — 삭제(soft)된 뉴스 카드 제외 */
  const enrichedRelatedNews = useMemo(() => enrichNewsFlowItemTimestamps(chartRelatedNews), [chartRelatedNews])

  /** 차트 플러그인과 동일한 adjusted timestamp 맵 (newsId → 차트에서 사용하는 timestamp) */
  const newsIdToAdjustedTimestamp = useMemo(() => {
    const visible = enrichedRelatedNews.filter((n) => n.showInChart).reverse()
    const groups = new Map<number, IRelatedNewsEventItem[]>()
    visible.forEach((item) => {
      if (item.timestamp === undefined || item.timestamp === null) return
      const ts = item.timestamp
      if (!groups.has(ts)) groups.set(ts, [])
      groups.get(ts)!.push(item)
    })
    const map = new Map<string, number>()
    groups.forEach((group, originalTs) => {
      group.forEach((item, i) => {
        map.set(item.newsId, originalTs + i)
      })
    })
    return map
  }, [enrichedRelatedNews])

  /** 차트에서 편집한 제목 반영 (chart edit → form display) */
  useEffect(() => {
    if (!onRelatedNewsChange || Object.keys(titleEdits).length === 0) return
    let hasChange = false
    const next = relatedNews.map((item) => {
      const ts = newsIdToAdjustedTimestamp.get(item.newsId)
      const editedTitle = ts !== undefined && ts !== null ? titleEdits[ts] : undefined
      if (editedTitle === undefined || editedTitle === item.title) return item
      hasChange = true
      return { ...item, title: editedTitle }
    })
    if (hasChange) onRelatedNewsChange(next)
  }, [titleEdits, onRelatedNewsChange, relatedNews, newsIdToAdjustedTimestamp])

  const updateNewsItem = useCallback(
    (newsId: string, updates: Partial<IRelatedNewsEventItem>) => {
      if (!onRelatedNewsChange) return
      onRelatedNewsChange(relatedNews.map((n) => (n.newsId === newsId ? { ...n, ...updates } : n)))
    },
    [onRelatedNewsChange, relatedNews],
  )

  const [addModalOpen, setAddModalOpen] = useState(false)

  const handleAddNews = useCallback(() => {
    setAddModalOpen(true)
  }, [])

  const handleAddNewsFromModal = useCallback(
    (item: IRelatedNewsEventItem) => {
      if (!onRelatedNewsChange) return
      onRelatedNewsChange([...relatedNews, { ...item, removed: false }])
      setAddModalOpen(false)
    },
    [onRelatedNewsChange, relatedNews],
  )

  /** 스냅샷에서 블록·JSON Patch 추적을 위해 행 제거 대신 soft-delete */
  const handleDeleteNews = useCallback(
    (newsId: string) => {
      if (!onRelatedNewsChange) return
      onRelatedNewsChange(relatedNews.map((n) => (n.newsId === newsId ? { ...n, removed: true } : n)))
    },
    [onRelatedNewsChange, relatedNews],
  )

  const handleNewsOrderChange = useCallback(
    (newsId: string, targetIndex: number) => {
      if (!onRelatedNewsChange) return
      const visible = filterVisibleNewsFlowItems(relatedNews)
      const fromIndex = visible.findIndex((n) => n.newsId === newsId)
      if (fromIndex < 0 || targetIndex === fromIndex) return
      const nextVisible = [...visible]
      const [moved] = nextVisible.splice(fromIndex, 1)
      nextVisible.splice(targetIndex, 0, moved!)
      const hidden = relatedNews.filter((n) => n.removed === true)
      onRelatedNewsChange([...nextVisible, ...hidden])
    },
    [onRelatedNewsChange, relatedNews],
  )

  return (
    <Block
      label={NEWSLETTER_SECTION_EDIT_LABEL[NEWSLETTER_SECTION_CODE.SECTION]}
      order={blockOrder}
      collapsedPreview={chartData?.title || undefined}
      showRequiredIndicator={showRequiredIndicator}
      visibility={sectionVisibility}
      onVisibilityChange={onSectionVisibilityChange}
    >
      <Stack gap="12px">
        <MIMaskInput
          label="News Flow 제목"
          placeholder="News Flow 제목 입력"
          value={chartData?.title ?? ''}
          onUpdateValue={onTitleChange}
          maxLength={100}
          required={dFlowTitle.required}
          disabled={dFlowTitle.disabled}
        />
        <MIMaskInput
          label="News Flow 시간 정보"
          placeholder="News Flow 시간 정보 입력"
          value={chartData?.aggregationTime ?? ''}
          onUpdateValue={onAggregationTimeChange}
          maxLength={100}
          required={dFlowAgg.required}
          disabled={dFlowAgg.disabled}
        />
        {!hideNewsFlowChart ? (
          <Box borderRadius="10px" bgcolor="commonColor.White" padding="18px 0 12px" my="12px">
            <InflectionPointChart
              chartData={chartData}
              relatedNews={enrichedRelatedNews}
              mode={NewsletterDetailPageMode.EDIT}
              marketOpenTime={marketOpenTime}
              marketCloseTime={marketCloseTime}
              onChartImageReady={onChartImageReady}
              showChartToolbar
              chartType={chartType}
              onChartTypeChange={setChartType}
              boxPositions={boxPositions}
              onBoxPositionChange={onBoxPositionChange}
              onResetBoxPositions={resetBoxPositions}
              titleEdits={titleEdits}
              onTitleEdit={setTitleEdit}
            />
          </Box>
        ) : null}
      </Stack>
      <Stack pt="12px" gap="12px">
        {visibleRelatedNews.map((item) => {
          const adjTs = newsIdToAdjustedTimestamp.get(item.newsId)
          const displayTitle = (adjTs === undefined ? item.title : (titleEdits[adjTs] ?? item.title)) ?? ''
          const dShowInChart = getEffectiveFieldDef(item.fieldDefs, 'showInChart')
          return (
            <Block
              key={item.newsId}
              label="News"
              order={{
                siblingIds: visibleRelatedNews.map((n) => n.newsId),
                currentId: item.newsId,
                onOrderChange: (targetIndex) => handleNewsOrderChange(item.newsId, targetIndex),
                ...(disableNewsItemOrder ? { disabled: true } : {}),
              }}
              collapsedPreview={displayTitle || undefined}
              visibility={item.visibility !== false}
              onVisibilityChange={(v) => updateNewsItem(item.newsId, { visibility: v })}
              customSlot={
                hideNewsFlowChart ? undefined : (
                  <InflectionPointMenu
                    showInChart={item.showInChart}
                    trend={item.trend ?? ''}
                    onShowInChartChange={(v) => updateNewsItem(item.newsId, { showInChart: v })}
                    onTrendChange={(v) => updateNewsItem(item.newsId, { trend: v })}
                    disabled={dShowInChart.disabled}
                  />
                )
              }
              onDelete={onRelatedNewsChange ? () => handleDeleteNews(item.newsId) : undefined}
              showRequiredIndicator={getNewsItemMissingRequired?.(item.newsId) ?? false}
            >
              <NewsFormFields
                fieldDefs={item.fieldDefs}
                value={{
                  createdDate: item.createdDate ? dayjs(item.createdDate) : undefined,
                  createTime: item.createTime ?? '',
                  source: item.source ?? '',
                  originalLink: item.originalLink ?? '',
                  title: displayTitle,
                  content: (item.content ?? []).join('\n\n'),
                }}
                onChange={(updates) => {
                  const next: Partial<IRelatedNewsEventItem> = {}
                  if (updates.createdDate !== undefined) {
                    next.createdDate = updates.createdDate?.format('YYYY-MM-DD') ?? ''
                  }
                  if (updates.createTime !== undefined) next.createTime = updates.createTime
                  if (updates.source !== undefined) next.source = updates.source
                  if (updates.originalLink !== undefined) next.originalLink = updates.originalLink
                  if (updates.title !== undefined) {
                    next.title = updates.title
                    if (adjTs !== undefined) setTitleEdit(adjTs, updates.title)
                  }
                  if (updates.content !== undefined) {
                    next.content = updates.content ? updates.content.split(/\n\n+/).filter(Boolean) : []
                  }
                  if (Object.keys(next).length > 0) updateNewsItem(item.newsId, next)
                }}
                getCreateTimeError={getCreateTimeError}
                isCreateTimeValid={isCreateTimeValid}
              />
            </Block>
          )
        })}
        {onRelatedNewsChange && (
          <Stack pt="12px" gap="8px">
            <MIButton type="outlined" size="h42" color="gray" width="100%" startIcon={<AddRoundedIcon />} onClick={handleAddNews}>
              뉴스 추가
            </MIButton>
            <AddNewsModal
              open={addModalOpen}
              onClose={() => setAddModalOpen(false)}
              onAdd={handleAddNewsFromModal}
              showChartMapping={!hideNewsFlowChart}
              fieldDefs={newsCardTemplateFieldDefs}
            />
            <Typography variant="body3" color="contentText.Subtext">
              수정 또는 추가한 뉴스는 저장 후 시간 순으로 자동 정렬됩니다.
            </Typography>
          </Stack>
        )}
      </Stack>
    </Block>
  )
}

export default NewsFlowSection
