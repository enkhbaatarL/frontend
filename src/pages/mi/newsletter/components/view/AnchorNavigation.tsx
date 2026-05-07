import { Box, Divider, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { RevisionVersion } from '@/pages/mi/newsletter/components/view/RevisionToolbar'

import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import { INITIAL_VERSION_ID } from '@/pages/mi/newsletter/components/view/RevisionToolbar'

export type AnchorItem = {
  id: string
  label: string
}

export type AnchorNavigationProps = {
  items: AnchorItem[]
  newsletterTitle?: string
  scrollContainerId?: string
  isScrolled?: boolean
  onPrepareScroll?: () => void
  onScrollComplete?: () => void
  stickyTop?: number
  scrolledOffset?: number
  unscrolledOffset?: number
  revisionSection?: {
    versions: RevisionVersion[]
    selectedVersionId: string
    onVersionChange: (versionId: string) => void
    /** 비교대상: 직전버전(n vs n-1) | 최초버전(n vs 0) */
    comparisonTarget: 'previous' | 'initial'
    onComparisonTargetChange: (target: 'previous' | 'initial') => void
  }
}

const SCROLL_CONTAINER_ID = 'main-scroll-wrapper'

const SCROLL_TARGET_OFFSET = {
  unscrolledOffset: 360,
  scrolledOffset: 152,
} as const

const SCROLL_DURATION_MS = 450
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const DEFAULT_STICKY_TOP = 170
const ACTIVATION_BUFFER_PX = 50

const COMPARISON_OPTIONS = [
  { value: 'previous' as const, label: '직전버전' },
  { value: 'initial' as const, label: '최초버전' },
] as const

const CHANGE_LEGEND_ITEMS: Array<{
  label: string
  bgcolor: string
  borderColor: string
  textColor: string
  strikethrough?: boolean
}> = [
  { label: '추가된 내용', bgcolor: '#e8f7ee', borderColor: '#9ed8b8', textColor: '#1f8a4c', strikethrough: false },
  { label: '삭제된 내용', bgcolor: '#fdecec', borderColor: '#f4b5b5', textColor: '#d64545', strikethrough: true },
  { label: '수정된 내용', bgcolor: '#fff6e5', borderColor: '#ffd591', textColor: '#b26a00', strikethrough: false },
]

const AnchorNavigation = ({
  items,
  newsletterTitle,
  scrollContainerId = SCROLL_CONTAINER_ID,
  isScrolled = false,
  onPrepareScroll: _onPrepareScroll,
  onScrollComplete,
  stickyTop = DEFAULT_STICKY_TOP,
  scrolledOffset: scrolledOffsetProp,
  unscrolledOffset: unscrolledOffsetProp,
  revisionSection,
}: AnchorNavigationProps) => {
  const scrolledOffset = scrolledOffsetProp ?? SCROLL_TARGET_OFFSET.scrolledOffset
  const unscrolledOffset = unscrolledOffsetProp ?? SCROLL_TARGET_OFFSET.unscrolledOffset
  const [activeId, setActiveId] = useState<string | null>(null)
  const rafRef = useRef<number | null>(null)
  const suppressActiveCheckRef = useRef(false)
  const lastScrolledToIdRef = useRef<string | null>(null)

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const el = document.getElementById(sectionId)
      const scrollEl = document.getElementById(scrollContainerId)
      if (!el || !scrollEl) return

      suppressActiveCheckRef.current = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null

      const atTop = scrollEl.scrollTop === 0

      if (atTop) {
        const offset = unscrolledOffset
        const containerRect = scrollEl.getBoundingClientRect()
        const targetRect = el.getBoundingClientRect()
        const targetScrollTop = Math.max(0, scrollEl.scrollTop + (targetRect.top - containerRect.top) - offset)
        const startScrollTop = scrollEl.scrollTop
        const startTime = performance.now()

        const animate = (now: number) => {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1)
          const eased = easeOutCubic(progress)
          scrollEl.scrollTop = startScrollTop + (targetScrollTop - startScrollTop) * eased
          if (progress < 1) {
            rafRef.current = requestAnimationFrame(animate)
          } else {
            rafRef.current = null
            suppressActiveCheckRef.current = false
            lastScrolledToIdRef.current = sectionId
            requestAnimationFrame(() => {
              scrollEl.dispatchEvent(new Event('scroll', { bubbles: false }))
            })
          }
        }
        rafRef.current = requestAnimationFrame(animate)
      } else {
        const offset = scrolledOffset
        const containerRect = scrollEl.getBoundingClientRect()
        const targetRect = el.getBoundingClientRect()
        const targetScrollTop = Math.max(0, scrollEl.scrollTop + (targetRect.top - containerRect.top) - offset)
        const startScrollTop = scrollEl.scrollTop
        const startTime = performance.now()

        const animate = (now: number) => {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1)
          const eased = easeOutCubic(progress)
          scrollEl.scrollTop = startScrollTop + (targetScrollTop - startScrollTop) * eased
          if (progress < 1) {
            rafRef.current = requestAnimationFrame(animate)
          } else {
            rafRef.current = null
            suppressActiveCheckRef.current = false
            lastScrolledToIdRef.current = sectionId
            requestAnimationFrame(() => {
              scrollEl.dispatchEvent(new Event('scroll', { bubbles: false }))
            })
            onScrollComplete?.()
          }
        }
        rafRef.current = requestAnimationFrame(animate)
      }
    },
    [scrollContainerId, onScrollComplete, scrolledOffset, unscrolledOffset],
  )

  useEffect(() => {
    const scrollEl = document.getElementById(scrollContainerId)
    if (!scrollEl || items.length === 0) return undefined

    const checkActiveSection = () => {
      if (suppressActiveCheckRef.current) return
      const containerRect = scrollEl.getBoundingClientRect()
      const refY = (isScrolled ? containerRect.top + scrolledOffset : containerRect.top + unscrolledOffset) + ACTIVATION_BUFFER_PX

      const lastId = lastScrolledToIdRef.current
      if (lastId) {
        lastScrolledToIdRef.current = null
        setActiveId(lastId)
        return
      }

      let active: string | null = items[0]?.id ?? null

      for (let i = items.length - 1; i >= 0; i--) {
        const el = document.getElementById(items[i].id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= refY) {
          active = items[i].id
          break
        }
      }

      setActiveId(active)
    }

    checkActiveSection()
    scrollEl.addEventListener('scroll', checkActiveSection, { passive: true })
    const resizeObserver = new ResizeObserver(checkActiveSection)
    resizeObserver.observe(scrollEl)

    return () => {
      scrollEl.removeEventListener('scroll', checkActiveSection)
      resizeObserver.disconnect()
    }
  }, [items, scrollContainerId, isScrolled, scrolledOffset, unscrolledOffset])

  const comparisonInfoText = useMemo(() => {
    if (!revisionSection) return 'Original'

    const selectedId = revisionSection.selectedVersionId
    const selectedSeq = selectedId === INITIAL_VERSION_ID ? null : Number.parseInt(selectedId, 10)
    const versions = revisionSection.versions ?? []

    if (revisionSection.comparisonTarget === 'initial') {
      return 'Original'
    }

    if (!selectedSeq || Number.isNaN(selectedSeq)) {
      return 'Original'
    }

    let prevSeq = -1
    for (const v of versions) {
      const seq = Number.parseInt(v.id, 10)
      if (!Number.isNaN(seq) && seq > 0 && seq < selectedSeq) {
        prevSeq = Math.max(prevSeq, seq)
      }
    }

    if (prevSeq < 0) return 'Original'
    const prev = versions.find((v) => Number.parseInt(v.id, 10) === prevSeq)
    return prev?.label ?? 'Original'
  }, [revisionSection])

  if (items.length === 0 && !revisionSection) return null

  return (
    <Stack
      gap="24px"
      px="20px"
      sx={{
        width: 220,
        flexShrink: 0,
        position: 'sticky',
        top: stickyTop,
        alignSelf: 'flex-start',
        userSelect: 'none',
      }}
    >
      {revisionSection && (
        <>
          <Stack gap="12px" width="100%">
            <Typography variant="body2SB14" color="contentText.Normal">
              비교대상
            </Typography>
            <Stack gap="8px" width="100%">
              <MISlidingSegmented
                options={COMPARISON_OPTIONS}
                value={revisionSection.comparisonTarget}
                onChange={(v) => revisionSection.onComparisonTargetChange(v as 'previous' | 'initial')}
                fullWidth
              />
              <Typography variant="body3" color="contentText.Subtext">
                {comparisonInfoText}
              </Typography>
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: 'contentBorder.Normal' }} />

          <Stack gap="12px" width="100%">
            <Typography variant="body2SB14" color="contentText.Normal">
              변경사항
            </Typography>
            <Stack gap="4px" alignSelf="flex-start" width="fit-content">
              {CHANGE_LEGEND_ITEMS.map((item) => (
                <Stack
                  key={item.label}
                  padding="6px 10px"
                  borderRadius="4px"
                  bgcolor={item.bgcolor}
                  border="0.5px solid"
                  borderColor={item.borderColor}
                >
                  <Typography
                    variant="body3"
                    color={item.textColor}
                    sx={{
                      textDecoration: 'strikethrough' in item && item.strikethrough ? 'line-through' : 'none',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: 'contentBorder.Normal' }} />
        </>
      )}

      {!revisionSection && (
        <>
          <Typography variant="body2M14" color="contentText.Subtext">
            바로가기
          </Typography>
          {newsletterTitle && (
            <Typography
              color="contentText.Black"
              fontSize="18px"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {newsletterTitle}
            </Typography>
          )}
          <Stack gap="14px">
            {items.map((item) => {
              const isActive = activeId === item.id
              return (
                <Box
                  key={item.id}
                  onClick={() => {
                    scrollToSection(item.id)
                    setActiveId(item.id)
                  }}
                  sx={{
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    width: 'fit-content',
                    maxWidth: '100%',
                  }}
                >
                  <Typography
                    variant={isActive ? 'body1M16' : 'body1R16'}
                    color={isActive ? 'contentText.Black' : 'contentText.Subtext'}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        </>
      )}
    </Stack>
  )
}

export default AnchorNavigation
