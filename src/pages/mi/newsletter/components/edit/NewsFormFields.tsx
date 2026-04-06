import { Box, Stack } from '@mui/material'

import type { INewsletterSnapshotFieldDef } from '@/service/mi/newsletter'
import type { Dayjs } from 'dayjs'

import MIMaskInput from '@/components/common/input/MIMaskInput'
import MIDatePickerMenu from '@/components/common/menu/MIDatePickerMenu'
import { PREDEFINED_MASKS } from '@/constants/masks'
import { getEffectiveFieldDef } from '@/pages/mi/newsletter/utils/snapshotUtils'

export interface NewsFormFieldsValue {
  createdDate: Dayjs | undefined
  createTime: string
  source: string
  originalLink: string
  title: string
  content: string
}

export interface NewsFormFieldsProps {
  value: NewsFormFieldsValue
  onChange: (updates: Partial<NewsFormFieldsValue>) => void
  getCreateTimeError?: (value: string) => string
  isCreateTimeValid?: (value: string) => boolean
  onTitleChange?: (title: string) => void
  datePickerZIndex?: number
  /** 뉴스 카드 블록 API `fieldDefs` — 키: createdDate, createTime, source, originalLink, title, content */
  fieldDefs?: Record<string, INewsletterSnapshotFieldDef>
}

const NewsFormFields = ({
  value,
  onChange,
  getCreateTimeError,
  isCreateTimeValid,
  onTitleChange,
  datePickerZIndex,
  fieldDefs,
}: NewsFormFieldsProps) => {
  const hasTimeValidation = getCreateTimeError !== null && isCreateTimeValid !== null
  const dDate = getEffectiveFieldDef(fieldDefs, 'createdDate')
  const dTime = getEffectiveFieldDef(fieldDefs, 'createTime')
  const dSource = getEffectiveFieldDef(fieldDefs, 'source')
  const dLink = getEffectiveFieldDef(fieldDefs, 'originalLink')
  const dTitle = getEffectiveFieldDef(fieldDefs, 'title')
  const dContent = getEffectiveFieldDef(fieldDefs, 'content')

  const createTimeRequired = !dTime.disabled && dTime.required
  const createTimeTrimmed = value.createTime.trim()
  const createTimeHasError =
    hasTimeValidation && !dTime.disabled && (createTimeTrimmed === '' ? createTimeRequired : !isCreateTimeValid!(value.createTime))
  const createTimeHelperText =
    hasTimeValidation && !dTime.disabled
      ? createTimeTrimmed === '' && !createTimeRequired
        ? undefined
        : getCreateTimeError!(value.createTime) || undefined
      : undefined

  return (
    <Stack gap="12px">
      <Stack direction="row" gap="12px" flexWrap="nowrap">
        <Box flexShrink={0} width={140}>
          <MIDatePickerMenu
            label="날짜"
            placement="bottom-start"
            value={value.createdDate}
            onChange={(date) => onChange({ createdDate: date })}
            width="100%"
            height="36px"
            required={dDate.required}
            disabled={dDate.disabled}
            rootSx={{ flexShrink: 0 }}
            zIndex={datePickerZIndex}
          />
        </Box>
        <Box flexShrink={0} width={100}>
          <MIMaskInput
            label="시간"
            placeholder="hh:mm"
            value={value.createTime}
            mask={PREDEFINED_MASKS.TIME}
            onUpdateValue={(v) => onChange({ createTime: v ?? '' })}
            error={createTimeHasError}
            helperText={createTimeHelperText}
            offInitialError={hasTimeValidation}
            width="100%"
            required={createTimeRequired}
            disabled={dTime.disabled}
          />
        </Box>
        <Box flexShrink={0} width={160}>
          <MIMaskInput
            label="출처"
            placeholder="출처 입력"
            value={value.source}
            onUpdateValue={(v) => onChange({ source: v ?? '' })}
            width="100%"
            required={dSource.required}
            disabled={dSource.disabled}
          />
        </Box>
        <Box flex={1} minWidth={0}>
          <MIMaskInput
            label="원문링크"
            placeholder="원문링크 입력"
            value={value.originalLink}
            onUpdateValue={(v) => onChange({ originalLink: v ?? '' })}
            width="100%"
            required={dLink.required}
            disabled={dLink.disabled}
          />
        </Box>
      </Stack>
      <MIMaskInput
        label="제목"
        placeholder="제목 입력"
        value={value.title}
        onUpdateValue={(newTitle = '') => {
          onChange({ title: newTitle })
          onTitleChange?.(newTitle)
        }}
        maxLength={100}
        required={dTitle.required}
        disabled={dTitle.disabled}
      />
      <MIMaskInput
        label="내용"
        placeholder="내용 입력"
        value={value.content}
        onUpdateValue={(v) =>
          onChange({
            content: v ?? '',
          })
        }
        multiline
        rows={6}
        maxLength={1000}
        required={dContent.required}
        disabled={dContent.disabled}
      />
    </Stack>
  )
}

export default NewsFormFields
