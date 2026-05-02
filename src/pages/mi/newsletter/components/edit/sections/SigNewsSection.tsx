import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Stack } from '@mui/material'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import AddNewsModal from '@/pages/mi/newsletter/components/edit/AddNewsModal'
import NewsFormFields from '@/pages/mi/newsletter/components/edit/NewsFormFields'
import Block, { type BlockOrderProps } from '@/pages/mi/newsletter/components/edit/sections/Block'
import { useCreateTimeValidation } from '@/pages/mi/newsletter/hooks/useCreateTimeValidation'
import {
  filterVisibleNewsFlowItems,
  getEffectiveFieldDef,
  NEWSLETTER_SECTION_CODE,
  NEWSLETTER_SECTION_EDIT_LABEL,
  normalizeNewsContentForEditor,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import { type INewsletterSnapshotFieldDef, type IRelatedNewsEventItem } from '@/service/mi/newsletter'

interface SigNewsSectionProps {
  relatedNews?: IRelatedNewsEventItem[]
  /** SIG_NEWS 섹션 `section.fieldDefs` — title, aggregationTime 등 */
  sectionFieldDefs?: Record<string, INewsletterSnapshotFieldDef>
  /** 섹션 `blocks` 중 첫 `NEWS_CARD`의 `fieldDefs` — 뉴스 추가 모달·신규 카드 필수 정책 */
  newsCardTemplateFieldDefs?: Record<string, INewsletterSnapshotFieldDef>
  title?: string
  aggregationTime?: string
  onTitleChange?: (value?: string) => void
  onAggregationTimeChange?: (value?: string) => void
  onRelatedNewsChange?: (items: IRelatedNewsEventItem[]) => void
  blockOrder?: BlockOrderProps
  /** `SIG_NEWS` 섹션에서 뉴스 카드 순서는 시간순 고정 — 순서 드롭다운 비활성화 */
  disableNewsItemOrder?: boolean
  /** 편집기 섹션 눈 아이콘(숨김) */
  sectionVisibility?: boolean
  onSectionVisibilityChange?: (visible: boolean) => void
  showRequiredIndicator?: boolean
  getNewsItemMissingRequired?: (newsId: string) => boolean
}

const SigNewsSection = ({
  relatedNews = [],
  sectionFieldDefs,
  newsCardTemplateFieldDefs,
  title = '',
  aggregationTime = '',
  onTitleChange,
  onAggregationTimeChange,
  onRelatedNewsChange,
  blockOrder,
  disableNewsItemOrder = false,
  sectionVisibility,
  onSectionVisibilityChange,
  showRequiredIndicator = false,
  getNewsItemMissingRequired,
}: SigNewsSectionProps) => {
  const { getCreateTimeError, isCreateTimeValid } = useCreateTimeValidation()
  const dFlowTitle = getEffectiveFieldDef(sectionFieldDefs, 'title')
  const dFlowAgg = getEffectiveFieldDef(sectionFieldDefs, 'aggregationTime')
  const visibleRelatedNews = useMemo(() => filterVisibleNewsFlowItems(relatedNews), [relatedNews])

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
      label={NEWSLETTER_SECTION_EDIT_LABEL[NEWSLETTER_SECTION_CODE.SIG_NEWS]}
      order={blockOrder}
      collapsedPreview={title || undefined}
      showRequiredIndicator={showRequiredIndicator}
      visibility={sectionVisibility}
      onVisibilityChange={onSectionVisibilityChange}
    >
      <Stack gap="12px">
        <MIMaskInput
          label="섹션 제목"
          placeholder="섹션 제목 입력"
          value={title}
          onUpdateValue={onTitleChange}
          maxLength={100}
          required={dFlowTitle.required}
          disabled={dFlowTitle.disabled}
        />
        <MIMaskInput
          label="섹션 부제"
          placeholder="섹션 부제 입력"
          value={aggregationTime}
          onUpdateValue={onAggregationTimeChange}
          maxLength={100}
          required={dFlowAgg.required}
          disabled={dFlowAgg.disabled}
        />
      </Stack>
      <Stack pt="12px" gap="12px">
        {visibleRelatedNews.map((item) => {
          const displayTitle = item.title ?? ''
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
              onVisibilityChange={(v) => {
                if (!onRelatedNewsChange) return
                onRelatedNewsChange(relatedNews.map((n) => (n.newsId === item.newsId ? { ...n, visibility: v } : n)))
              }}
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
                  content: normalizeNewsContentForEditor((item.content ?? []).join('\n\n')),
                }}
                onChange={(updates) => {
                  const next: Partial<IRelatedNewsEventItem> = {}
                  if (updates.createdDate !== undefined) {
                    next.createdDate = updates.createdDate?.format('YYYY-MM-DD') ?? ''
                  }
                  if (updates.createTime !== undefined) next.createTime = updates.createTime
                  if (updates.source !== undefined) next.source = updates.source
                  if (updates.originalLink !== undefined) next.originalLink = updates.originalLink
                  if (updates.title !== undefined) next.title = updates.title
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
              블록 추가
            </MIButton>
            <AddNewsModal
              open={addModalOpen}
              onClose={() => setAddModalOpen(false)}
              onAdd={handleAddNewsFromModal}
              showChartMapping={false}
              fieldDefs={newsCardTemplateFieldDefs}
            />
            {/* <Typography variant="body3" color="contentText.Subtext">
              수정 또는 추가한 뉴스는 저장 후 시간 순으로 자동 정렬됩니다.
            </Typography> */}
          </Stack>
        )}
      </Stack>
    </Block>
  )
}

export default SigNewsSection
