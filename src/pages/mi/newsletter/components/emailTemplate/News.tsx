import AddIcon from '@mui/icons-material/Add'
import { Box, Typography } from '@mui/material'
import { useState, useEffect } from 'react'

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
}: Props) => {
  const [localUnPublishedNewsIds, setLocalUnPublishedNewsIds] = useState<string[]>(unPublishedNewsIds)

  useEffect(() => {
    setLocalUnPublishedNewsIds(unPublishedNewsIds)
  }, [unPublishedNewsIds])

  const handleFieldChange = (newsId: string, field: string, value: string | boolean) => {
    onNewsUpdate?.(newsId, field, value)
  }

  const getFieldValue = (newsId: string, field: string, defaultValue: string) => String(editingNews[newsId]?.[field] ?? defaultValue)

  const maxTempNewsItems = 10
  const canAddNewItem = tempNewsItems.length < maxTempNewsItems

  const validateRequiredFields = (item: IRelatedNewsEventItem) => {
    const time = String(getFieldValue(item.newsId, 'createTime', item.createTime))
    const date = String(getFieldValue(item.newsId, 'createdDate', item.createdDate))
    const title = String(getFieldValue(item.newsId, 'title', item.title))
    const content = String(getFieldValue(item.newsId, 'content', item.content.join('\n')))

    const hasRequiredValues = time.trim() !== '' && date.trim() !== '' && title.trim() !== '' && content.trim() !== ''

    const timeValid = !timeFormat(time)
    const dateValid = !dateFormat(date)
    const titleValid = !titleLength(title)
    const contentValid = !contentLength(content)

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
        return !timeFormat(value)
      case 'createdDate':
        return !dateFormat(value)
      case 'title':
        return !titleLength(value)
      case 'content':
        return !contentLength(value)
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
          return '시간을 입력해주세요'
        case 'createdDate':
          return '일자를 입력해주세요'
        case 'title':
          return '제목을 입력해주세요'
        case 'content':
          return '내용을 입력해주세요'
        default:
          return ''
      }
    }

    switch (field) {
      case 'createTime':
        return timeFormat(value) ?? ''
      case 'createdDate':
        return dateFormat(value) ?? ''
      case 'title':
        return titleLength(value) ?? ''
      case 'content':
        return contentLength(value) ?? ''
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
        margin: '30px auto 20px auto',
        padding: '0 12px',
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
                    관련 뉴스
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
              </tbody>
            </table>
          </th>
        </tr>
        <tr>
          <th colSpan={2} style={{ width: '100%', height: '12px', borderBottom: '1px solid #868E96' }}></th>
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
                    margin: '0 auto',
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
                    뉴스 항목 편집 후 저장 시 변경된 내용이 뉴스 목록 및 그래프에 적용됩니다
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
                        margin: '0 auto',
                      }}
                    >
                      <Box width="150px" display="flex" flexDirection="column" gap="4px">
                        <MIInputBox
                          label="시간"
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
                          label="일자"
                          required
                          value={getFieldValue(item.newsId, 'createdDate', item.createdDate)}
                          onChange={(value) => handleFieldChange(item.newsId, 'createdDate', value)}
                          placeholder="YYYY-MM-DD"
                          error={localUnPublishedNewsIds.includes(item.newsId) ? false : !isFieldValid(item, 'createdDate')}
                          helperText={localUnPublishedNewsIds.includes(item.newsId) ? '' : getFieldError(item, 'createdDate')}
                          offInitialError={isNewItem(item)}
                          disabled={localUnPublishedNewsIds.includes(item.newsId)}
                        />
                        <Box p="4px">
                          <Typography variant="body2" color="content.textNormal">
                            {item.source}
                          </Typography>
                        </Box>
                      </Box>
                      <Box flex={1} display="flex" flexDirection="column" gap="4px">
                        <MIInputBox
                          label="제목"
                          required
                          value={getFieldValue(item.newsId, 'title', item.title)}
                          onChange={(value) => handleFieldChange(item.newsId, 'title', value)}
                          placeholder="제목을 입력해 주세요"
                          error={localUnPublishedNewsIds.includes(item.newsId) ? false : !isFieldValid(item, 'title')}
                          helperText={localUnPublishedNewsIds.includes(item.newsId) ? '' : getFieldError(item, 'title')}
                          offInitialError={isNewItem(item)}
                          disabled={localUnPublishedNewsIds.includes(item.newsId)}
                        />
                        <MIInputBox
                          label="내용"
                          required
                          value={getFieldValue(item.newsId, 'content', item.content.join('\n'))}
                          onChange={(value) => handleFieldChange(item.newsId, 'content', value)}
                          placeholder="내용을 입력해 주세요"
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
                    Add a New Item
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
                    Reset
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
                    Apply
                  </MIButton>
                </Box>
              </td>
            </tr>
          </>
        )}
        {(mode === NewsletterDetailPageMode.VIEW || mode === NewsletterDetailPageMode.CAPTURE) && (
          <tr>
            <td colSpan={2} style={{ padding: '24px 0', width: '100%' }}>
              {[...(relatedNews || []), ...tempNewsItems]
                .filter((item) => !deletedNewsIds.includes(item.newsId))
                .map((item) => (
                  <table
                    key={item.newsId}
                    width="100%"
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
                        <td>
                          <table style={{ width: '150px' }}>
                            <thead>
                              <tr>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: '20px 0 36px 0', verticalAlign: 'top' }}>
                                  <p style={{ padding: 4, fontWeight: 600, fontSize: '16px', color: '#495057' }}>{item.createTime}</p>
                                  <p style={{ padding: 4, fontWeight: 600, fontSize: '16px', color: '#495057' }}>{item.createdDate}</p>
                                  <p style={{ padding: 4, fontWeight: 400, fontSize: '14px', color: '#868E96' }}>{item.source}</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td>
                          <table style={{ width: '626px' }}>
                            <thead>
                              <tr>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: '20px 6px 36px 6px', verticalAlign: 'top' }}>
                                  <p style={{ padding: '4px 0 10px 0', fontWeight: 600, fontSize: '18px', color: '#495057' }}>
                                    {item.title}
                                  </p>
                                  {item.content.map((content) => (
                                    <p
                                      key={content}
                                      style={{ padding: 0, fontWeight: 400, fontSize: '16px', color: '#495057', whiteSpace: 'pre-line' }}
                                    >
                                      {content}
                                    </p>
                                  ))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ))}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export default Chart
