import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { timeFormat } from '@/components/common/input/validators'

export const useCreateTimeValidation = () => {
  const { t } = useTranslation()

  const getCreateTimeError = useCallback(
    (value: string) => {
      const trimmed = String(value ?? '').trim()
      if (trimmed === '') return t('newsletter.editMode.error.time')
      return timeFormat(trimmed, undefined, t) ?? ''
    },
    [t],
  )

  const isCreateTimeValid = useCallback(
    (value: string) => {
      const trimmed = String(value ?? '').trim()
      if (trimmed === '') return false
      return !timeFormat(trimmed, undefined, t)
    },
    [t],
  )

  return { getCreateTimeError, isCreateTimeValid }
}
