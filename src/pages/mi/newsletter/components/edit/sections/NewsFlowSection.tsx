import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import type { NewsFormFieldsValue } from '@/pages/mi/newsletter/components/edit/NewsFormFields'

import MIButton from '@/components/common/button/MIButton'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import InflectionPointChart from '@/pages/mi/newsletter/components/chart/InflectionPointChart'
import {
  INFLECTION_POINT_CHART_INLINE_EDIT_PLACEHOLDER_HEIGHT,
  INFLECTION_POINT_CHART_OUTER_WIDTH,
} from '@/pages/mi/newsletter/components/chart/inflectionPointChartLayout'
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
import { createTimestampInNY } from '@/utils/date'

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
  /** 박스 드래그를 놓은 뒤·위치 리셋 후 스냅샷 반영(상위에서 처리) */
  onBoxPositionDragEnd?: () => void
  /** 플로우 차트 편집 팝업이 열린 동안 인라인 차트 대신 플레이스홀더 표시 */
  flowChartEditModalOpen?: boolean
}

interface NewsFlowNewsCardProps {
  item: IRelatedNewsEventItem
  adjTs: number | undefined
  titleEdits: Record<number, string>
  siblingIds: string[]
  disableNewsItemOrder: boolean
  hideNewsFlowChart: boolean
  canDelete: boolean
  updateNewsItem: (newsId: string, updates: Partial<IRelatedNewsEventItem>) => void
  onOrderChange: (newsId: string, targetIndex: number) => void
  setTitleEdit: (timestamp: number, title: string) => void
  getCreateTimeError?: (value: string) => string
  isCreateTimeValid?: (value: string) => boolean
  getNewsItemMissingRequired?: (newsId: string) => boolean
}

const NewsFlowNewsCard = memo(
  ({
    item,
    adjTs,
    titleEdits,
    siblingIds,
    disableNewsItemOrder,
    hideNewsFlowChart,
    canDelete,
    updateNewsItem,
    onOrderChange,
    setTitleEdit,
    getCreateTimeError,
    isCreateTimeValid,
    getNewsItemMissingRequired,
  }: NewsFlowNewsCardProps) => {
    const displayTitle = (adjTs === undefined ? item.title : (titleEdits[adjTs] ?? item.title)) ?? ''
    const dShowInChart = getEffectiveFieldDef(item.fieldDefs, 'showInChart')

    const handleVisibilityChange = useCallback(
      (v: boolean) => updateNewsItem(item.newsId, { visibility: v }),
      [updateNewsItem, item.newsId],
    )

    const handleShowInChartChange = useCallback(
      (v: boolean) => updateNewsItem(item.newsId, { showInChart: v }),
      [updateNewsItem, item.newsId],
    )

    const handleTrendChange = useCallback(
      (v: 'UP' | 'NONE' | 'DOWN') => updateNewsItem(item.newsId, { trend: v }),
      [updateNewsItem, item.newsId],
    )

    const handleDelete = useCallback(() => updateNewsItem(item.newsId, { removed: true }), [updateNewsItem, item.newsId])

    const handleOrderChange = useCallback((targetIndex: number) => onOrderChange(item.newsId, targetIndex), [onOrderChange, item.newsId])

    const order = useMemo(
      () => ({
        siblingIds,
        currentId: item.newsId,
        onOrderChange: handleOrderChange,
        ...(disableNewsItemOrder ? { disabled: true } : {}),
      }),
      [siblingIds, item.newsId, handleOrderChange, disableNewsItemOrder],
    )

    const customSlot = useMemo(
      () =>
        hideNewsFlowChart ? undefined : (
          <InflectionPointMenu
            showInChart={item.showInChart}
            trend={item.trend ?? ''}
            onShowInChartChange={handleShowInChartChange}
            onTrendChange={handleTrendChange}
            disabled={dShowInChart.disabled}
          />
        ),
      [hideNewsFlowChart, item.showInChart, item.trend, handleShowInChartChange, handleTrendChange, dShowInChart.disabled],
    )

    const value = useMemo<NewsFormFieldsValue>(
      () => ({
        createdDate: item.createdDate ? dayjs(item.createdDate) : undefined,
        createTime: item.createTime ?? '',
        source: item.source ?? '',
        originalLink: item.originalLink ?? '',
        title: displayTitle,
        content: (item.content ?? []).join('\n\n'),
      }),
      [item.createdDate, item.createTime, item.source, item.originalLink, displayTitle, item.content],
    )

    const handleFormChange = useCallback(
      (updates: Partial<NewsFormFieldsValue>) => {
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
        if (updates.createdDate !== undefined || updates.createTime !== undefined) {
          const newDate = next.createdDate ?? item.createdDate ?? ''
          const newTime = next.createTime ?? item.createTime ?? ''
          next.timestamp = createTimestampInNY(newDate, newTime)
        }
        if (Object.keys(next).length > 0) updateNewsItem(item.newsId, next)
      },
      [adjTs, setTitleEdit, updateNewsItem, item.newsId, item.createdDate, item.createTime],
    )

    return (
      <Block
        label="News"
        order={order}
        collapsedPreview={displayTitle || undefined}
        visibility={item.visibility !== false}
        onVisibilityChange={handleVisibilityChange}
        customSlot={customSlot}
        onDelete={canDelete ? handleDelete : undefined}
        showRequiredIndicator={getNewsItemMissingRequired?.(item.newsId) ?? false}
      >
        <NewsFormFields
          fieldDefs={item.fieldDefs}
          value={value}
          onChange={handleFormChange}
          getCreateTimeError={getCreateTimeError}
          isCreateTimeValid={isCreateTimeValid}
        />
      </Block>
    )
  },
)
NewsFlowNewsCard.displayName = 'NewsFlowNewsCard'

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
  onBoxPositionDragEnd,
  flowChartEditModalOpen = false,
}: NewsFlowSectionProps) => {
  const { getCreateTimeError, isCreateTimeValid } = useCreateTimeValidation()
  const dFlowTitle = getEffectiveFieldDef(sectionFieldDefs, 'title')
  const dFlowAgg = getEffectiveFieldDef(sectionFieldDefs, 'aggregationTime')
  const visibleRelatedNews = useMemo(() => filterVisibleNewsFlowItems(relatedNews), [relatedNews])
  const chartRelatedNews = useMemo(() => visibleRelatedNews.filter((n) => n.visibility !== false), [visibleRelatedNews])
  const { chartType, boxPositions, titleEdits, setChartType, onBoxPositionChange, resetBoxPositions, setTitleEdit } = useChartEditStore(
    useShallow((s) => ({
      chartType: s.chartType,
      boxPositions: s.boxPositions,
      titleEdits: s.titleEdits,
      setChartType: s.setChartType,
      onBoxPositionChange: s.onBoxPositionChange,
      resetBoxPositions: s.resetBoxPositions,
      setTitleEdit: s.setTitleEdit,
    })),
  )

  const handleResetChartLayout = useCallback(() => {
    resetBoxPositions()
    onBoxPositionDragEnd?.()
  }, [resetBoxPositions, onBoxPositionDragEnd])

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

  const siblingIds = useMemo(() => visibleRelatedNews.map((n) => n.newsId), [visibleRelatedNews])

  const handleNewsOrderChange = useCallback(
    (newsId: string, targetIndex: number) => {
      if (!onRelatedNewsChange) return
      const active = filterVisibleNewsFlowItems(relatedNews)
      const fromIndex = active.findIndex((n) => n.newsId === newsId)
      if (fromIndex < 0 || targetIndex === fromIndex) return
      const nextActive = [...active]
      const [moved] = nextActive.splice(fromIndex, 1)
      nextActive.splice(targetIndex, 0, moved!)
      let i = 0
      const merged = relatedNews.map((n) => (n.removed === true ? n : nextActive[i++]!))
      onRelatedNewsChange(merged)
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
            {flowChartEditModalOpen ? (
              <Box
                sx={{
                  width: INFLECTION_POINT_CHART_OUTER_WIDTH,
                  height: INFLECTION_POINT_CHART_INLINE_EDIT_PLACEHOLDER_HEIGHT,
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'transparent',
                  color: '#6C757D',
                  typography: 'body2',
                }}
              >
                팝업 표시 중
              </Box>
            ) : (
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
                onBoxDragEnd={onBoxPositionDragEnd}
                onResetBoxPositions={handleResetChartLayout}
                titleEdits={titleEdits}
                onTitleEdit={setTitleEdit}
              />
            )}
          </Box>
        ) : null}
      </Stack>
      <Stack pt="12px" gap="12px">
        {visibleRelatedNews.map((item) => (
          <NewsFlowNewsCard
            key={item.newsId}
            item={item}
            adjTs={newsIdToAdjustedTimestamp.get(item.newsId)}
            titleEdits={titleEdits}
            siblingIds={siblingIds}
            disableNewsItemOrder={disableNewsItemOrder}
            hideNewsFlowChart={hideNewsFlowChart}
            canDelete={!!onRelatedNewsChange}
            updateNewsItem={updateNewsItem}
            onOrderChange={handleNewsOrderChange}
            setTitleEdit={setTitleEdit}
            getCreateTimeError={getCreateTimeError}
            isCreateTimeValid={isCreateTimeValid}
            getNewsItemMissingRequired={getNewsItemMissingRequired}
          />
        ))}
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
              저장 시 뉴스 카드 순서는 편집 화면에서 정한 순서가 유지됩니다.
            </Typography>
          </Stack>
        )}
      </Stack>
    </Block>
  )
}

export default NewsFlowSection
