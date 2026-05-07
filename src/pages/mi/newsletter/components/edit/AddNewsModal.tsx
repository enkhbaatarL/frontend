import RemoveRedEyeRoundedIcon from '@mui/icons-material/RemoveRedEyeRounded'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import { Box, Stack, Switch, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'

import type { INewsletterSnapshotFieldDef, IRelatedNewsEventItem } from '@/service/mi/newsletter'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import NewsFormFields, { type NewsFormFieldsValue } from '@/pages/mi/newsletter/components/edit/NewsFormFields'
import { useCreateTimeValidation } from '@/pages/mi/newsletter/hooks/useCreateTimeValidation'
import { getEffectiveFieldDef, hasNewsCardFieldDefs } from '@/pages/mi/newsletter/utils/snapshotUtils'

const TREND_OPTIONS = [
  { value: 'UP', label: '상승' },
  { value: 'NONE', label: '중립' },
  { value: 'DOWN', label: '하강' },
] as const

interface AddNewsModalProps {
  open: boolean
  onClose: () => void
  onAdd: (item: IRelatedNewsEventItem) => void
  /**
   * false면 「차트 표기」 블록을 숨기고, 추가 시 showInChart·trend는 비활성 값으로 저장합니다.
   * (SIG News, NEWS_FLOW 등 메인 플로우 차트가 없는 템플릿용)
   */
  showChartMapping?: boolean
  /** 섹션 내 첫 `NEWS_CARD` 템플릿 `fieldDefs` — 없으면 날짜·제목·내용은 기본 필수, 출처·원문링크·시간은 비필수 */
  fieldDefs?: Record<string, INewsletterSnapshotFieldDef>
}

const INITIAL_FORM_VALUE: NewsFormFieldsValue = {
  createdDate: undefined,
  createTime: '',
  source: '',
  originalLink: '',
  title: '',
  content: '',
}

const AddNewsModal = ({ open, onClose, onAdd, showChartMapping = true, fieldDefs }: AddNewsModalProps) => {
  const { getCreateTimeError, isCreateTimeValid } = useCreateTimeValidation()
  const [formValue, setFormValue] = useState<NewsFormFieldsValue>(INITIAL_FORM_VALUE)
  const [showInList, setShowInList] = useState(true)
  const [showInChart, setShowInChart] = useState(false)
  const [trend, setTrend] = useState<'UP' | 'NONE' | 'DOWN'>('NONE')

  const resetForm = useCallback(() => {
    setFormValue(INITIAL_FORM_VALUE)
    setShowInList(true)
    setShowInChart(false)
    setTrend('NONE')
  }, [])

  useEffect(() => {
    if (open) resetForm()
  }, [open, resetForm])

  const isValid = useMemo(() => {
    if (!hasNewsCardFieldDefs(fieldDefs)) {
      const tt = formValue.createTime.trim()
      const timeOk = tt === '' || isCreateTimeValid(formValue.createTime)
      return (
        formValue.createdDate !== undefined &&
        formValue.createdDate !== null &&
        timeOk &&
        formValue.title.trim() !== '' &&
        formValue.content.trim() !== ''
      )
    }
    const dDate = getEffectiveFieldDef(fieldDefs, 'createdDate')
    const dTime = getEffectiveFieldDef(fieldDefs, 'createTime')
    const dSource = getEffectiveFieldDef(fieldDefs, 'source')
    const dLink = getEffectiveFieldDef(fieldDefs, 'originalLink')
    const dTitle = getEffectiveFieldDef(fieldDefs, 'title')
    const dContent = getEffectiveFieldDef(fieldDefs, 'content')

    if (!dDate.disabled && dDate.required && (formValue.createdDate === undefined || formValue.createdDate === null)) {
      return false
    }
    if (!dTime.disabled) {
      const tt = formValue.createTime.trim()
      if (tt === '') {
        if (dTime.required) return false
      } else if (!isCreateTimeValid(formValue.createTime)) {
        return false
      }
    }
    if (!dSource.disabled && dSource.required && formValue.source.trim() === '') return false
    if (!dLink.disabled && dLink.required && formValue.originalLink.trim() === '') return false
    if (!dTitle.disabled && dTitle.required && formValue.title.trim() === '') return false
    if (!dContent.disabled && dContent.required && formValue.content.trim() === '') return false
    return true
  }, [fieldDefs, formValue, isCreateTimeValid])

  const handleAdd = useCallback(() => {
    if (!isValid) return

    const chartOn = showChartMapping && showInChart
    const createdDateStr =
      formValue.createdDate !== undefined && formValue.createdDate !== null ? formValue.createdDate.format('YYYY-MM-DD') : ''
    const item: IRelatedNewsEventItem = {
      newsId: uuid(),
      title: formValue.title.trim(),
      content: formValue.content.trim() ? formValue.content.split(/\n\n+/).filter(Boolean) : [],
      createdDate: createdDateStr,
      createTime: formValue.createTime.trim(),
      source: formValue.source.trim(),
      originalLink: formValue.originalLink.trim() || undefined,
      showInChart: chartOn,
      trend: chartOn ? trend : undefined,
      removed: false,
      visibility: showInList,
      ...(hasNewsCardFieldDefs(fieldDefs) ? { fieldDefs } : {}),
    }
    onAdd(item)
    onClose()
  }, [isValid, formValue, fieldDefs, showChartMapping, showInChart, trend, showInList, onAdd, onClose])

  return (
    <MIConfirm
      open={open}
      title="뉴스 추가"
      width={700}
      handleClose={onClose}
      disableBackdropClick
      justifyContentAction="end"
      titleSx={{ padding: '12px 24px' }}
      paperSx={{
        borderRadius: '10px',
        boxShadow: '0px 18px 50px rgba(0, 0, 0, 0.1)',
      }}
      contentSx={{
        padding: 0,
        paddingTop: 0,
      }}
      actions={[
        {
          label: '취소',
          variant: 'outlined',
          color: 'gray',
          onClick: onClose,
        },
        {
          label: '추가',
          variant: 'filled',
          color: 'primary',
          onClick: handleAdd,
          disabled: !isValid,
        },
      ]}
    >
      <Stack gap="20px" padding="24px">
        <NewsFormFields
          value={formValue}
          onChange={(updates) => setFormValue((prev) => ({ ...prev, ...updates }))}
          fieldDefs={fieldDefs}
          getCreateTimeError={getCreateTimeError}
          isCreateTimeValid={isCreateTimeValid}
          datePickerZIndex={1400}
        />

        <Box border="1px solid" borderColor="contentBorder.Normal" borderRadius="10px" bgcolor="commonColor.White" p="20px">
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap="24px">
            <Stack direction="row" gap="6px" flex={1} minWidth={0}>
              <RemoveRedEyeRoundedIcon sx={{ fontSize: 20, color: 'contentText.Normal' }} />
              <Stack gap="6px">
                <Typography variant="body2SB14" color="contentText.Black">
                  뉴스 노출
                </Typography>
                <Typography variant="body3" color="contentText.Subtext">
                  작성된 뉴스를 New Flow 목록에 노출합니다.
                </Typography>
              </Stack>
            </Stack>
            <Switch checked={showInList} onChange={(_, c) => setShowInList(c)} size="small" />
          </Stack>
        </Box>

        {showChartMapping ? (
          <Box border="1px solid" borderColor="contentBorder.Normal" borderRadius="10px" bgcolor="commonColor.White" p="20px">
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap="24px">
              <Stack direction="row" gap="6px" flex={1} minWidth={0}>
                <ShowChartRoundedIcon sx={{ fontSize: 20, color: 'contentText.Normal' }} />
                <Stack gap="6px">
                  <Typography variant="body2SB14" color="contentText.Black">
                    차트 표기
                  </Typography>
                  <Typography variant="body3" color="contentText.Subtext">
                    뉴스 발생 시점을 주요 지표 차트 위에 직접 매핑하여 시장 변동의 맥락을 제공합니다. 뉴스 등록 완료 후, 차트 상에 표시된
                    기사 요약을 자유롭게 이동시켜 직접 조정할 수 있습니다.
                  </Typography>
                </Stack>
              </Stack>
              <Stack alignItems="flex-end" gap="10px" flexShrink={0}>
                <Switch checked={showInChart} onChange={(_, c) => setShowInChart(c)} size="small" />
                <MISlidingSegmented
                  options={TREND_OPTIONS}
                  value={trend}
                  onChange={(v) => setTrend(v as 'UP' | 'NONE' | 'DOWN')}
                  disabled={!showInChart}
                  fullWidth
                  width={180}
                />
              </Stack>
            </Stack>
          </Box>
        ) : null}
      </Stack>
    </MIConfirm>
  )
}

export default AddNewsModal
