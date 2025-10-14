import AddIcon from '@mui/icons-material/Add'
import { Box } from '@mui/material'
import { useState, useEffect, Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import MIButton from '@/components/common/button/MIButton'
import MIInputBox from '@/components/common/input/MIInputBox'
import { timeFormat, dateFormat, titleLength, contentLength } from '@/components/common/input/validators'
import EditPanal from '@/pages/mi/newsletter/components/EditPanal'
import { IRelatedNewsEventItem, NewsletterDetailPageMode } from '@/service/mi/newsletter'

interface Props {
  basis: string
  relatedNews?: IRelatedNewsEventItem[]
  tempNewsItems?: IRelatedNewsEventItem[]
  mode: NewsletterDetailPageMode
  onNewsUpdate?: (newsId: string, field: string, value: string | boolean) => void
  onAddNews?: () => void
  onResetNews?: () => void
  onApplyNews?: (unPublishedNewsIds?: string[]) => void
  editingNews?: Record<string, Record<string, string | boolean>>
  unPublishedNewsIds?: string[]
  onUnPublishedNewsIdsChange?: (unPublishedNewsIds: string[]) => void
  onDeleteNews?: (newsId: string) => void
  deletedNewsIds?: string[]
  baseNewsCount?: number
}

const Chart = ({
  basis,
  relatedNews,
  tempNewsItems = [],
  mode,
  onNewsUpdate,
  onAddNews,
  onResetNews,
  onApplyNews,
  editingNews = {},
  unPublishedNewsIds = [],
  onUnPublishedNewsIdsChange,
  onDeleteNews,
  deletedNewsIds = [],
  baseNewsCount = 0,
}: Props) => {
  const [localUnPublishedNewsIds, setLocalUnPublishedNewsIds] = useState<string[]>(unPublishedNewsIds)
  const { t } = useTranslation()

  useEffect(() => {
    setLocalUnPublishedNewsIds(unPublishedNewsIds)
  }, [unPublishedNewsIds])

  const handleFieldChange = (newsId: string, field: string, value: string | boolean) => {
    onNewsUpdate?.(newsId, field, value)
  }

  const getFieldValue = (newsId: string, field: string, defaultValue: string) => String(editingNews[newsId]?.[field] ?? defaultValue ?? '')

  const currentNewsCount = (relatedNews?.length ?? 0) + tempNewsItems.length
  const maxAllowedNewsCount = baseNewsCount + 10
  const canAddNewItem = currentNewsCount < maxAllowedNewsCount

  const validateRequiredFields = (item: IRelatedNewsEventItem) => {
    const time = String(getFieldValue(item.newsId, 'createTime', item.createTime))
    const date = String(getFieldValue(item.newsId, 'createdDate', item.createdDate))
    const title = String(getFieldValue(item.newsId, 'title', item.title))
    const content = String(getFieldValue(item.newsId, 'content', item.content.join('\n')))

    const hasRequiredValues = time.trim() !== '' && date.trim() !== '' && title.trim() !== '' && content.trim() !== ''

    const timeValid = !timeFormat(time, undefined, t)
    const dateValid = !dateFormat(date, undefined, t)
    const titleValid = !titleLength(title, undefined, undefined, t)
    const contentValid = !contentLength(content, undefined, undefined, t)

    return hasRequiredValues && timeValid && dateValid && titleValid && contentValid
  }

  const isFieldValid = (item: IRelatedNewsEventItem, field: string) => {
    let value = getFieldValue(item.newsId, field, item[field as keyof IRelatedNewsEventItem] as string)

    if (field === 'content' && Array.isArray(value)) {
      value = value.join('\n')
    }

    if (value.trim() === '') return false

    switch (field) {
      case 'createTime':
        return !timeFormat(value, undefined, t)
      case 'createdDate':
        return !dateFormat(value, undefined, t)
      case 'title':
        return !titleLength(value, undefined, undefined, t)
      case 'content':
        return !contentLength(value, undefined, undefined, t)
      default:
        return true
    }
  }

  const getFieldError = (item: IRelatedNewsEventItem, field: string) => {
    let value = getFieldValue(item.newsId, field, item[field as keyof IRelatedNewsEventItem] as string)

    if (field === 'content' && Array.isArray(value)) {
      value = value.join('\n')
    }

    if (value.trim() === '') {
      switch (field) {
        case 'createTime':
          return t('newsletter.editMode.error.time')
        case 'createdDate':
          return t('newsletter.editMode.error.createdDate')
        case 'title':
          return t('newsletter.editMode.error.title')
        case 'content':
          return t('newsletter.editMode.error.content')
        default:
          return ''
      }
    }

    switch (field) {
      case 'createTime':
        return timeFormat(value, undefined, t) ?? ''
      case 'createdDate':
        return dateFormat(value, undefined, t) ?? ''
      case 'title':
        return titleLength(value, undefined, undefined, t) ?? ''
      case 'content':
        return contentLength(value, undefined, undefined, t) ?? ''
      default:
        return ''
    }
  }

  const isNewItem = (item: IRelatedNewsEventItem) => !relatedNews?.some((news) => news.newsId === item.newsId)

  const allItemsValid = [...(relatedNews || []), ...tempNewsItems]
    .filter((item) => !localUnPublishedNewsIds.includes(item.newsId) && !deletedNewsIds.includes(item.newsId))
    .every(validateRequiredFields)

  if (mode !== NewsletterDetailPageMode.EDIT && relatedNews?.length === unPublishedNewsIds.length) {
    return null
  }

  return (
    <table
      style={{
        width: '800px',
        padding: '30px 12px 20px 12px',
      }}
    >
      <thead>
        <tr>
          <th>
            <table
              style={{
                width: '776px',
                margin: '0 auto',
              }}
            >
              <thead>
                <tr>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: '#212529',
                    }}
                  >
                    {t('newsletter.detail.relatedNews')}
                  </td>
                  <td
                    style={{
                      whiteSpace: 'nowrap',
                      textAlign: 'right',
                      fontWeight: 400,
                      fontSize: '12px',
                      color: '#868E96',
                    }}
                  >
                    {basis}
                  </td>
                </tr>
                <tr>
                  <th colSpan={2} style={{ width: '100%', height: '12px', borderBottom: '1px solid #868E96' }}></th>
                </tr>
              </tbody>
            </table>
          </th>
        </tr>
      </thead>
      <tbody>
        {mode === NewsletterDetailPageMode.EDIT && (
          <>
            <tr>
              <td style={{ padding: '24px 0 12px 0', width: '100%' }}>
                <Box
                  sx={{
                    width: '776px',
                    height: '44px',
                    backgroundColor: '#FDECEC',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      fontFamily: 'Pretendard',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '1.4',
                      color: '#F03E3E',
                      textAlign: 'center',
                    }}
                  >
                    {t('newsletter.editMode.relatedNewsMessage')}
                  </Box>
                </Box>
              </td>
            </tr>
            {[...(relatedNews || []), ...tempNewsItems]
              .filter((item) => !deletedNewsIds.includes(item.newsId))
              .map((item, index) => (
                <tr key={`${item.newsId}-${item.createdDate}-${item.createTime}-${index}`}>
                  <td colSpan={2} style={{ padding: '20px 0', width: '100%', position: 'relative' }}>
                    <Box position="absolute" top="22px" right="-220px">
                      <EditPanal
                        isPublished={!localUnPublishedNewsIds.includes(item.newsId)}
                        onPublishedChange={() => {
                          const isCurrentlyUnpublished = localUnPublishedNewsIds.includes(item.newsId)
                          const newUnPublishedIds = isCurrentlyUnpublished
                            ? localUnPublishedNewsIds.filter((id) => id !== item.newsId)
                            : [...localUnPublishedNewsIds, item.newsId]
                          setLocalUnPublishedNewsIds(newUnPublishedIds)

                          const editedTrend = editingNews[item.newsId]?.['trend']
                          const originalTrend = item.trend ?? ''
                          const effectiveTrend = editedTrend !== undefined ? String(editedTrend) : originalTrend

                          if (!isCurrentlyUnpublished) {
                            handleFieldChange(item.newsId, 'showInChart', false)
                          } else {
                            handleFieldChange(item.newsId, 'showInChart', effectiveTrend !== '')
                          }
                        }}
                        useInflectionPointSelect
                        inflectionPoint={getFieldValue(item.newsId, 'trend', item.trend ?? '')}
                        onInflectionPointChange={(inflectionPoint) => {
                          handleFieldChange(item.newsId, 'trend', inflectionPoint)
                          if (!localUnPublishedNewsIds.includes(item.newsId)) {
                            handleFieldChange(item.newsId, 'showInChart', inflectionPoint !== '')
                          }
                        }}
                        onDeleteNews={() => onDeleteNews?.(item.newsId)}
                      />
                    </Box>
                    <Box
                      sx={{
                        width: '776px',
                        display: 'flex',
                        gap: '6px',
                      }}
                    >
                      <Box width="150px" display="flex" flexDirection="column" gap="4px">
                        <MIInputBox
                          label={t('newsletter.editMode.createdDate')}
                          required
                          value={getFieldValue(item.newsId, 'createdDate', item.createdDate)}
                          onChange={(value) => handleFieldChange(item.newsId, 'createdDate', value)}
                          placeholder="YYYY-MM-DD"
                          error={localUnPublishedNewsIds.includes(item.newsId) ? false : !isFieldValid(item, 'createdDate')}
                          helperText={localUnPublishedNewsIds.includes(item.newsId) ? '' : getFieldError(item, 'createdDate')}
                          offInitialError={isNewItem(item)}
                          disabled={localUnPublishedNewsIds.includes(item.newsId)}
                        />
                        <MIInputBox
                          label={t('newsletter.editMode.time')}
                          required
                          value={getFieldValue(item.newsId, 'createTime', item.createTime)}
                          onChange={(value) => handleFieldChange(item.newsId, 'createTime', value)}
                          placeholder="00:00"
                          error={localUnPublishedNewsIds.includes(item.newsId) ? false : !isFieldValid(item, 'createTime')}
                          helperText={localUnPublishedNewsIds.includes(item.newsId) ? '' : getFieldError(item, 'createTime')}
                          offInitialError={isNewItem(item)}
                          disabled={localUnPublishedNewsIds.includes(item.newsId)}
                        />
                        <MIInputBox
                          label={t('newsletter.editMode.source')}
                          value={getFieldValue(item.newsId, 'source', item.source ?? '')}
                          onChange={(value) => handleFieldChange(item.newsId, 'source', value)}
                          placeholder={t('newsletter.editMode.sourcePlaceholder')}
                          disabled={localUnPublishedNewsIds.includes(item.newsId)}
                        />
                      </Box>
                      <Box flex={1} display="flex" flexDirection="column" gap="4px">
                        <MIInputBox
                          label={t('newsletter.editMode.title')}
                          required
                          value={getFieldValue(item.newsId, 'title', item.title)}
                          onChange={(value) => handleFieldChange(item.newsId, 'title', value)}
                          placeholder={t('newsletter.editMode.titlePlaceholder')}
                          error={localUnPublishedNewsIds.includes(item.newsId) ? false : !isFieldValid(item, 'title')}
                          helperText={localUnPublishedNewsIds.includes(item.newsId) ? '' : getFieldError(item, 'title')}
                          offInitialError={isNewItem(item)}
                          disabled={localUnPublishedNewsIds.includes(item.newsId)}
                        />
                        <MIInputBox
                          label={t('newsletter.editMode.content')}
                          required
                          value={getFieldValue(item.newsId, 'content', item.content.join('\n'))}
                          onChange={(value) => handleFieldChange(item.newsId, 'content', value)}
                          placeholder={t('newsletter.editMode.contentPlaceholder')}
                          multiline
                          rows={5}
                          error={localUnPublishedNewsIds.includes(item.newsId) ? false : !isFieldValid(item, 'content')}
                          helperText={localUnPublishedNewsIds.includes(item.newsId) ? '' : getFieldError(item, 'content')}
                          offInitialError={isNewItem(item)}
                          disabled={localUnPublishedNewsIds.includes(item.newsId)}
                        />
                      </Box>
                    </Box>
                  </td>
                </tr>
              ))}
            {canAddNewItem && (
              <tr>
                <td colSpan={2} style={{ padding: '12px 0 24px 0', width: '100%' }}>
                  <MIButton type="outlined" size="h42" color="gray" width="100%" startIcon={<AddIcon />} onClick={onAddNews}>
                    {t('newsletter.editMode.addNewItem')}
                  </MIButton>
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={2} style={{ padding: '36px 0 12px 0', width: '100%', borderTop: '1px solid #DEE2E6' }}>
                <Box display="flex" justifyContent="flex-end" gap="12px">
                  <MIButton
                    type="outlined"
                    size="h34"
                    color="gray"
                    width="76px"
                    onClick={() => {
                      setLocalUnPublishedNewsIds(unPublishedNewsIds)
                      onResetNews?.()
                    }}
                  >
                    {t('newsletter.editMode.buttonLabel.reset')}
                  </MIButton>

                  <MIButton
                    type="filled"
                    size="h34"
                    color="primary"
                    width="76px"
                    disabled={!allItemsValid}
                    onClick={() => {
                      onUnPublishedNewsIdsChange?.(localUnPublishedNewsIds)
                      onApplyNews?.(localUnPublishedNewsIds)
                    }}
                  >
                    {t('newsletter.editMode.buttonLabel.apply')}
                  </MIButton>
                </Box>
              </td>
            </tr>
          </>
        )}
        {(mode === NewsletterDetailPageMode.VIEW || mode === NewsletterDetailPageMode.CAPTURE) && (
          <tr>
            <td colSpan={2} style={{ width: '100%', padding: '0 12px 30px 12px' }}>
              {[...(relatedNews || []), ...tempNewsItems]
                .filter((item) => !deletedNewsIds.includes(item.newsId))
                .map((item, index, array) => {
                  // 이전 아이템과 동일한 날짜인지 확인
                  const previousItem = index > 0 ? array[index - 1] : null
                  const shouldShowDate = !previousItem || previousItem.createdDate !== item.createdDate

                  return (
                    <table
                      key={item.newsId}
                      style={{
                        borderBottom: '1px solid #DEE2E6',
                        display:
                          mode === NewsletterDetailPageMode.CAPTURE && localUnPublishedNewsIds.includes(item.newsId) ? 'none' : 'block',
                      }}
                    >
                      <thead>
                        <tr>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ verticalAlign: 'top' }}>
                            <table style={{ width: '150px' }}>
                              <thead>
                                <tr>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '6px 0 14px 0', verticalAlign: 'top' }}>
                                    {/* 이전 아이템과 동일 날자면 날자는 생략 */}
                                    {shouldShowDate && (
                                      <div style={{ padding: 4, fontWeight: 600, fontSize: '16px', color: '#495057' }}>
                                        {item.createdDate}
                                      </div>
                                    )}
                                    <div style={{ padding: 4, fontWeight: 600, fontSize: '16px', color: '#495057' }}>{item.createTime}</div>
                                    <div style={{ padding: 4, fontWeight: 400, fontSize: '14px', color: '#868E96' }}>
                                      {item.source ?? ''}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                          <td style={{ verticalAlign: 'top' }}>
                            <table style={{ width: '620px' }}>
                              <thead>
                                <tr>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '6px 6px 14px 6px', verticalAlign: 'top' }}>
                                    <div style={{ padding: '4px 0 10px 0', fontWeight: 600, fontSize: '18px', color: '#495057' }}>
                                      {item.title}
                                    </div>
                                    <div style={{ fontWeight: 400, fontSize: '16px', color: '#495057', whiteSpace: 'pre-line' }}>
                                      {item.content.map((content, index) => (
                                        <Fragment key={index}>
                                          {index > 0 && <br />}
                                          {content}
                                        </Fragment>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )
                })}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export default Chart
