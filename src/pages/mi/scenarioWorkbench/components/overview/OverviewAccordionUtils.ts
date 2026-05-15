import { useCallback, useEffect, useRef, useState } from 'react'

import type { SxProps, Theme } from '@mui/material'

import { scenarioWorkbenchColumnsToGridTemplate } from '@/pages/mi/scenarioWorkbench/components/table/scenarioWorkbenchGridColTemplate'

export const OVERVIEW_ACCORDION_ACTION_COLUMN_WIDTH_PX = 36
export const OVERVIEW_ACCORDION_LIST_LOADING_ROW_HEIGHT_PX = 42

export const toSxArray = (sx?: SxProps<Theme>) => (Array.isArray(sx) ? sx : sx ? [sx] : [])

export const overviewColumnsToGridTemplate = scenarioWorkbenchColumnsToGridTemplate

export const formatOverviewScenarioTags = (tags: string[] | undefined): string => {
  if (!tags?.length) return ''
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ')
}

export const useOverviewAccordionDetailLifecycle = (expanded: boolean) => {
  const [shouldRenderDetail, setShouldRenderDetail] = useState(expanded)
  const [detailRevealNonce, setDetailRevealNonce] = useState(0)
  const expandedRef = useRef(expanded)

  useEffect(() => {
    expandedRef.current = expanded

    if (expanded) {
      setShouldRenderDetail(true)
      setDetailRevealNonce((n) => n + 1)
    }
  }, [expanded])

  const handleDetailExited = useCallback(() => {
    if (!expandedRef.current) {
      setShouldRenderDetail(false)
    }
  }, [])

  return {
    shouldRenderDetail: expanded || shouldRenderDetail,
    detailRevealNonce,
    handleDetailExited,
  }
}
