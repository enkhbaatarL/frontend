import { useCallback, useMemo, useState, type CSSProperties } from 'react'

export const getSheetColumnWidths = (minimumWidths: number[], viewportWidth: number, actionWidth: number) => {
  let remainingWidth = viewportWidth - actionWidth
  let remainingCount = minimumWidths.length
  const fixedWidths = new Map<number, number>()

  // Match minmax(width, 1fr), including tables narrower than the viewport.
  const sortedWidths = minimumWidths.map((width, index) => ({ width, index })).sort((a, b) => b.width - a.width)
  for (const { width, index } of sortedWidths) {
    if (width <= remainingWidth / remainingCount) break
    fixedWidths.set(index, width)
    remainingWidth -= width
    remainingCount -= 1
  }
  return minimumWidths.map((width, index) => fixedWidths.get(index) ?? Math.max(width, remainingWidth / remainingCount))
}

export const getSheetScrollShadows = (
  offsets: number[],
  pinnedStyles: Map<number, CSSProperties>,
  viewport: { width: number; scrollLeft: number },
  actionWidth: number,
) => {
  const maxScrollLeft = Math.max(0, offsets.at(-1)! + actionWidth - viewport.width)
  const scrollLeft = Math.min(Math.max(0, viewport.scrollLeft), maxScrollLeft)
  const boundaries = [...pinnedStyles].map(([index, style]) => {
    const stickyLeft = Number.parseFloat(String(style.left))
    const stickyRight = Number.parseFloat(String(style.right))
    const width = offsets[index + 1] - offsets[index]
    const columnLeft = Math.max(stickyLeft, Math.min(offsets[index] - scrollLeft, viewport.width - stickyRight - width))
    return {
      columnIndex: index,
      left: columnLeft + width,
      right: viewport.width - columnLeft,
      stuckLeft: offsets[index] < scrollLeft + stickyLeft - 1,
      stuckRight: offsets[index + 1] > scrollLeft + viewport.width - stickyRight + 1,
    }
  })
  const leftBoundary = Math.max(0, ...boundaries.filter(({ stuckLeft }) => stuckLeft).map(({ left }) => left))
  const rightBoundary = Math.max(actionWidth, ...boundaries.filter(({ stuckRight }) => stuckRight).map(({ right }) => right))
  return {
    left: boundaries.map(({ columnIndex, left, stuckLeft }) => ({
      columnIndex,
      offset: left,
      visible: scrollLeft > 1 && stuckLeft && left === leftBoundary,
    })),
    right: [
      ...boundaries.map(({ columnIndex, right, stuckRight }) => ({
        columnIndex,
        offset: right,
        visible: maxScrollLeft - scrollLeft > 1 && stuckRight && right === rightBoundary,
      })),
      { columnIndex: -1, offset: actionWidth, visible: maxScrollLeft - scrollLeft > 1 && rightBoundary === actionWidth },
    ],
  }
}

const useSheetColumnPinning = (
  fields: string[],
  minimumWidths: number[],
  viewport: { width: number; scrollLeft: number },
  actionWidth: number,
) => {
  const [pinnedFields, setPinnedFields] = useState<string[]>([])
  const hasHorizontalScroll = minimumWidths.reduce((sum, width) => sum + width, actionWidth) > viewport.width + 1
  const widths = useMemo(
    () => getSheetColumnWidths(minimumWidths, viewport.width, actionWidth),
    [minimumWidths, viewport.width, actionWidth],
  )
  const offsets = useMemo(() => {
    const result = [0]
    for (const width of widths) result.push(result.at(-1)! + width)
    return result
  }, [widths])
  const pinnedIndices = useMemo(
    () => fields.flatMap((field, index) => (hasHorizontalScroll && pinnedFields.includes(field) ? [index] : [])),
    [fields, hasHorizontalScroll, pinnedFields],
  )
  const pinnedStyles = useMemo(() => {
    const result = new Map<number, CSSProperties>()
    const totalPinnedWidth = pinnedIndices.reduce((sum, index) => sum + widths[index], 0)
    let left = 0
    for (const index of pinnedIndices) {
      result.set(index, {
        position: 'sticky',
        left: `${left}px`,
        right: `${actionWidth + totalPinnedWidth - left - widths[index]}px`,
        zIndex: 1,
      })
      left += widths[index]
    }
    return result
  }, [actionWidth, pinnedIndices, widths])
  const togglePin = useCallback((field: string) => {
    setPinnedFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]))
  }, [])
  const getColumnStyle = useCallback(
    (index: number): CSSProperties => ({ gridColumn: index + 1, ...pinnedStyles.get(index) }),
    [pinnedStyles],
  )
  const includePinnedIndices = useCallback(
    (indices: number[]) => [...new Set([...indices, ...pinnedIndices])].sort((a, b) => a - b),
    [pinnedIndices],
  )

  const scrollShadows = getSheetScrollShadows(offsets, pinnedStyles, viewport, actionWidth)

  return { widths, offsets, pinnedStyles, togglePin, getColumnStyle, includePinnedIndices, hasHorizontalScroll, scrollShadows }
}

export default useSheetColumnPinning
