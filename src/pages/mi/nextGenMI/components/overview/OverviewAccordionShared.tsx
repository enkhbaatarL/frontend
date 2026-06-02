import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Collapse, Fade, Skeleton, Stack, Typography, type SxProps, type Theme, useMediaQuery } from '@mui/material'
import { type GridColDef, type GridRenderCellParams, type GridRowModel } from '@mui/x-data-grid'
import { isValidElement, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'

import {
  OVERVIEW_ACCORDION_COLLAPSE_DURATION_MS,
  OVERVIEW_ACCORDION_COLLAPSE_EXIT_DURATION_MS,
  OVERVIEW_ACCORDION_COLLAPSE_FADE_ENTER_MS,
  OVERVIEW_ACCORDION_COLLAPSE_FADE_EXIT_MS,
  OVERVIEW_ACCORDION_DETAIL_BODY_REVEAL_MS,
  OVERVIEW_ACCORDION_EXPAND_DETAIL_DELAY_MS,
  overviewAccordionCollapseExitEase,
  overviewAccordionCollapsedHeightEase,
  overviewAccordionDetailSurfaceRevealKeyframes,
  overviewAccordionSoftEase,
  overviewAccordionSurfaceEase,
} from './overviewAccordionMotion'
import { toSxArray } from './OverviewAccordionUtils'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import NextGenMIEventDetailTableBodyText, {
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  NEXT_GEN_MI_EVENT_DETAIL_TABLE_CELL_PX,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailTableBodyText'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'

const DETAIL_SHORTCUT_HOVER_MS = 220
const DETAIL_SHORTCUT_HOVER_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const renderCellContentToNode = (content: unknown): ReactNode => {
  if (content === null || content === undefined) return null
  if (isValidElement(content)) return content
  if (typeof content === 'string' || typeof content === 'number') return content
  return String(content)
}

const DefaultEllipsisTooltip = ({
  value,
  children,
  textAlign,
}: {
  value: string
  children: ReactNode
  textAlign: 'left' | 'center' | 'right'
}) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)

  const body = (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        textAlign,
      }}
    >
      {children}
    </Box>
  )

  if (!isEllipsis) return body
  return <NextGenMIFollowCursorTooltip title={value}>{body}</NextGenMIFollowCursorTooltip>
}

export interface OverviewAccordionSummaryRowProps<T extends GridRowModel> {
  row: T
  rowKey: string | number
  columns: GridColDef<T>[]
  gridTemplateColumns: string
  expanded: boolean
  actionColumnField?: string
  actionLabel: string
  minHeight: number
  getCellSx?: (params: { field: string; row?: T }) => SxProps<Theme>
  onCollapsedSummaryClick: () => void
  onExpandedCollapseClick: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  sx?: SxProps<Theme>
  collapsedSummaryHovered?: boolean
  onCollapsedDetailShortcutClick?: () => void
}

export const OverviewAccordionSummaryRow = <T extends GridRowModel>({
  row,
  rowKey,
  columns,
  gridTemplateColumns,
  expanded,
  actionColumnField,
  minHeight,
  getCellSx,
  onCollapsedSummaryClick,
  onExpandedCollapseClick,
  onMouseEnter,
  onMouseLeave,
  collapsedSummaryHovered = false,
  onCollapsedDetailShortcutClick,
  sx,
}: OverviewAccordionSummaryRowProps<T>) => {
  const cellPx = `${NEXT_GEN_MI_EVENT_DETAIL_TABLE_CELL_PX}px`
  const cellPy = `${NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_CELL_PY}px`
  const primitiveBodySx = { lineHeight: NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT }

  const cellJustifyContent = (align?: GridColDef['align']) =>
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => {
        if (!expanded) onCollapsedSummaryClick()
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={(e) => {
        if (!expanded && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onCollapsedSummaryClick()
        }
      }}
      sx={[
        {
          display: 'grid',
          gridTemplateColumns,
          alignItems: 'stretch',
          width: '100%',
          minWidth: 0,
          minHeight,
          cursor: expanded ? 'default' : 'pointer',
          userSelect: 'none',
          transition: 'background-color 120ms ease',
          outline: 'none',
          '&:focus-visible': {
            boxShadow: '0 0 0 2px rgba(54, 79, 199, 0.35)',
          },
        },
        ...toSxArray(sx),
      ]}
    >
      {columns.map((col) => {
        const isActionColumn = actionColumnField !== undefined && col.field === actionColumnField
        const value = (row as Record<string, unknown>)[col.field]
        const content = isActionColumn
          ? null
          : col.renderCell
            ? col.renderCell({
              row,
              value,
              field: col.field,
              id: rowKey,
              formattedValue: value,
              api: undefined,
              rowNode: undefined,
              colDef: col,
              cellMode: 'view',
              hasFocus: false,
              tabIndex: 0,
              isEditable: false,
            } as unknown as GridRenderCellParams<T, unknown>)
            : value
        const node = renderCellContentToNode(content)
        const textAlign: 'left' | 'center' | 'right' = col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left'
        const shouldWrapEllipsisTooltip =
          !col.renderCell &&
          typeof value === 'string' &&
          value.length > 0 &&
          col.field !== 'status' &&
          col.field !== 'type' &&
          col.field !== 'jkmImpact' &&
          col.field !== 'ttfImpact' &&
          col.field !== 'hhImpact'

        return (
          <Box
            key={col.field}
            sx={[
              {
                display: 'flex',
                alignItems: 'center',
                justifyContent: cellJustifyContent(col.align),
                px: cellPx,
                py: cellPy,
                overflow: 'hidden',
                minWidth: 0,
                boxSizing: 'border-box',
              },
              ...toSxArray(getCellSx?.({ field: col.field, row })),
            ]}
          >
            {isActionColumn ? (
              <Box
                sx={{
                  position: 'relative',
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!expanded && onCollapsedDetailShortcutClick !== undefined && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: collapsedSummaryHovered ? 1 : 0,
                      transition: `opacity ${DETAIL_SHORTCUT_HOVER_MS}ms ${DETAIL_SHORTCUT_HOVER_EASE}`,
                      pointerEvents: collapsedSummaryHovered ? 'auto' : 'none',
                      '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                      },
                    }}
                  >
                    <MIBaseButton
                      variant="outlined"
                      enableHoverBackground
                      aria-label="상세 보기"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCollapsedDetailShortcutClick()
                      }}
                      sx={{
                        width: '22px',
                        minWidth: '0px',
                        height: '22px',
                        padding: '3px',
                        borderRadius: '4px',
                        backgroundColor: 'commonColor.White',
                      }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 14, color: 'contentIcon.Enabled' }} />
                    </MIBaseButton>
                  </Box>
                )}
                <MIBaseButton
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    if (expanded) onExpandedCollapseClick()
                  }}
                  sx={{
                    height: '36px',
                    padding: '8px',
                    pointerEvents: expanded ? 'auto' : 'none',
                    opacity: expanded ? 1 : 0,
                  }}
                >
                  <ExpandLessRoundedIcon sx={{ fontSize: 20 }} />
                </MIBaseButton>
              </Box>
            ) : typeof node === 'string' || typeof node === 'number' ? (
              <NextGenMIEventDetailTableBodyText
                value={String(node)}
                variant={NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT}
                tooltipWhenTruncated
                sx={[
                  {
                    alignSelf: 'stretch',
                    flex: '1 1 0',
                    minWidth: 0,
                    textAlign,
                  },
                  primitiveBodySx,
                ]}
              />
            ) : shouldWrapEllipsisTooltip ? (
              <DefaultEllipsisTooltip value={value as string} textAlign={textAlign}>
                {node}
              </DefaultEllipsisTooltip>
            ) : (
              node
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export interface OverviewAccordionSkeletonRowsProps<T extends GridRowModel> {
  columns: GridColDef<T>[]
  gridTemplateColumns: string
  skeletonRowCount?: number
  rowSx?: SxProps<Theme>
  getCellSx?: (params: { field: string; row?: T }) => SxProps<Theme>
  sx?: SxProps<Theme>
}

export const OverviewAccordionSkeletonRows = <T extends GridRowModel>({
  columns,
  gridTemplateColumns,
  skeletonRowCount,
  rowSx,
  getCellSx,
  sx,
}: OverviewAccordionSkeletonRowsProps<T>) => {
  const cellPx = `${NEXT_GEN_MI_EVENT_DETAIL_TABLE_CELL_PX}px`
  const cellPy = `${NEXT_GEN_MI_EVENT_DETAIL_TABLE_BODY_CELL_PY}px`
  const effectiveSkeletonRows = Math.max(1, skeletonRowCount ?? 8)
  const rowSxArray = toSxArray(rowSx)

  return (
    <Stack gap={0} sx={[{ width: '100%', minWidth: 0, maxWidth: '100%' }, ...toSxArray(sx)]}>
      {Array.from({ length: effectiveSkeletonRows }).map((_, idx) => (
        <Box
          key={idx}
          sx={[
            (theme) => ({
              display: 'grid',
              gridTemplateColumns,
              alignItems: 'stretch',
              minHeight: 55,
              borderBottom: `1px solid ${theme.palette.contentBorder?.Normal ?? theme.palette.gray[40]}`,
            }),
            ...rowSxArray,
          ]}
        >
          {columns.map((col) => (
            <Box
              key={col.field}
              sx={[
                {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
                  px: cellPx,
                  py: cellPy,
                  overflow: 'hidden',
                  minWidth: 0,
                  boxSizing: 'border-box',
                },
                ...toSxArray(getCellSx?.({ field: col.field })),
              ]}
            >
              {String(col.headerName ?? '').trim() ? <Skeleton variant="rounded" width="100%" height={28} /> : null}
            </Box>
          ))}
        </Box>
      ))}
    </Stack>
  )
}

export const OverviewAccordionNoRows = ({ message }: { message: string }) => (
  <Box
    sx={{
      width: '100%',
      minHeight: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'gray.5',
      borderRadius: '10px',
    }}
  >
    <Typography variant="body6" color="gray.60">
      {message}
    </Typography>
  </Box>
)

export interface OverviewAccordionDetailBodyRevealProps {
  revealKey: number
  children: ReactNode
}

export const OverviewAccordionDetailBodyReveal = ({ revealKey, children }: OverviewAccordionDetailBodyRevealProps) => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { defaultMatches: false })
  const [revealed, setRevealed] = useState(prefersReducedMotion)

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      setRevealed(true)
      return undefined
    }

    let outerRaf = 0
    let innerRaf = 0
    let canceled = false

    setRevealed(false)
    outerRaf = globalThis.requestAnimationFrame(() => {
      innerRaf = globalThis.requestAnimationFrame(() => {
        if (!canceled) setRevealed(true)
      })
    })

    return () => {
      canceled = true
      globalThis.cancelAnimationFrame(outerRaf)
      globalThis.cancelAnimationFrame(innerRaf)
    }
  }, [revealKey, prefersReducedMotion])

  return (
    <Box
      sx={{
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 0,
        opacity: revealed ? 1 : 0,
        pointerEvents: revealed ? 'auto' : 'none',
        transition: prefersReducedMotion ? 'none' : `opacity ${OVERVIEW_ACCORDION_DETAIL_BODY_REVEAL_MS}ms ${overviewAccordionSoftEase}`,
        '@media (prefers-reduced-motion: reduce)': {
          opacity: 1,
          transition: 'none',
        },
      }}
    >
      {children}
    </Box>
  )
}

export interface OverviewAccordionCollapseProps {
  expanded: boolean
  children: ReactNode
  onEntered?: () => void
  onExited?: () => void
}

export const OverviewAccordionCollapse = ({ expanded, children, onEntered, onExited }: OverviewAccordionCollapseProps) => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { defaultMatches: false })

  const [detailContentMounted, setDetailContentMounted] = useState(false)
  const [detailAreaOpen, setDetailAreaOpen] = useState(false)

  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined

    if (expanded) {
      const delayMs = prefersReducedMotion ? 0 : OVERVIEW_ACCORDION_EXPAND_DETAIL_DELAY_MS
      timerId = globalThis.setTimeout(() => {
        setDetailContentMounted(true)
        setDetailAreaOpen(true)
      }, delayMs)
    } else {
      setDetailAreaOpen(false)
    }

    return () => {
      if (timerId !== undefined) globalThis.clearTimeout(timerId)
    }
  }, [expanded, prefersReducedMotion])

  const handleExited = () => {
    setDetailContentMounted(false)
    onExited?.()
  }

  const collapseTimeout = prefersReducedMotion
    ? 0
    : {
      enter: OVERVIEW_ACCORDION_COLLAPSE_DURATION_MS,
      exit: OVERVIEW_ACCORDION_COLLAPSE_EXIT_DURATION_MS,
    }
  const fadeTimeout = prefersReducedMotion
    ? { enter: 0, exit: 0 }
    : { enter: OVERVIEW_ACCORDION_COLLAPSE_FADE_ENTER_MS, exit: OVERVIEW_ACCORDION_COLLAPSE_FADE_EXIT_MS }

  const collapseSx = {
    overflow: 'hidden',
    willChange: prefersReducedMotion ? 'auto' : 'height',
    contain: 'paint',
    '& .MuiCollapse-wrapper': {
      overflow: 'hidden',
    },
    '& .MuiCollapse-wrapperInner': {
      width: '100%',
      minWidth: 0,
    },
  } satisfies SxProps<Theme>

  return (
    <Collapse
      in={detailAreaOpen}
      timeout={collapseTimeout}
      easing={{ enter: overviewAccordionCollapsedHeightEase, exit: overviewAccordionCollapseExitEase }}
      sx={collapseSx}
      onEntered={onEntered}
      onExited={handleExited}
    >
      <Fade in={detailAreaOpen} timeout={fadeTimeout} easing={{ enter: overviewAccordionSoftEase, exit: overviewAccordionSurfaceEase }}>
        <Box
          sx={{
            outline: 'none',
            width: '100%',
            minWidth: 0,
            transformOrigin: 'top center',
            ...(detailAreaOpen && !prefersReducedMotion
              ? {
                animation: `${overviewAccordionDetailSurfaceRevealKeyframes} ${OVERVIEW_ACCORDION_COLLAPSE_FADE_ENTER_MS}ms ${overviewAccordionSoftEase} both`,
              }
              : {}),
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              transform: 'none',
            },
          }}
        >
          {detailContentMounted ? children : null}
        </Box>
      </Fade>
    </Collapse>
  )
}
