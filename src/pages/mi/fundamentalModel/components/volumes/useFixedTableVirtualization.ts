import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'

interface VirtualRange {
  start: number
  end: number
}

interface UseFixedTableVirtualizationParams {
  rowCount: number
  rowHeight: number
  rowViewportHeight: number
  columnWidths: number[]
  columnViewportWidth: number
  verticalScrollRef: RefObject<HTMLDivElement | null>
  horizontalScrollRef: RefObject<HTMLDivElement | null>
  enabled?: boolean
}

const ROW_OVERSCAN = 4
const COLUMN_OVERSCAN = 2

const rangesEqual = (left: VirtualRange, right: VirtualRange) => left.start === right.start && left.end === right.end

const getFixedRange = (count: number, itemSize: number, scrollOffset: number, viewportSize: number, overscan: number): VirtualRange => {
  if (count === 0) return { start: 0, end: 0 }

  const start = Math.max(0, Math.floor(scrollOffset / itemSize) - overscan)
  const end = Math.min(count, Math.ceil((scrollOffset + viewportSize) / itemSize) + overscan)
  return { start, end }
}

const getVariableRange = (widths: number[], scrollOffset: number, viewportSize: number): VirtualRange => {
  if (widths.length === 0) return { start: 0, end: 0 }

  const viewportEnd = scrollOffset + viewportSize
  let offset = 0
  let firstVisible = 0
  let end = widths.length

  for (let index = 0; index < widths.length; index += 1) {
    const nextOffset = offset + widths[index]
    if (nextOffset > scrollOffset) {
      firstVisible = index
      break
    }
    offset = nextOffset
  }

  offset = widths.slice(0, firstVisible).reduce((sum, width) => sum + width, 0)
  for (let index = firstVisible; index < widths.length; index += 1) {
    offset += widths[index]
    if (offset >= viewportEnd) {
      end = index + 1
      break
    }
  }

  return {
    start: Math.max(0, firstVisible - COLUMN_OVERSCAN),
    end: Math.min(widths.length, end + COLUMN_OVERSCAN),
  }
}

/** 고정 높이 행과 가변 너비 열을 가진 Volumes 표의 가시 영역만 계산한다. */
const useFixedTableVirtualization = ({
  rowCount,
  rowHeight,
  rowViewportHeight,
  columnWidths,
  columnViewportWidth,
  verticalScrollRef,
  horizontalScrollRef,
  enabled = true,
}: UseFixedTableVirtualizationParams) => {
  const [rowRange, setRowRange] = useState<VirtualRange>(() => getFixedRange(rowCount, rowHeight, 0, rowViewportHeight, ROW_OVERSCAN))
  const [columnRange, setColumnRange] = useState<VirtualRange>(() => getVariableRange(columnWidths, 0, columnViewportWidth))

  const updateRowRange = useCallback(() => {
    const scrollElement = verticalScrollRef.current
    const nextRange = getFixedRange(
      rowCount,
      rowHeight,
      scrollElement?.scrollTop ?? 0,
      scrollElement?.clientHeight || rowViewportHeight,
      ROW_OVERSCAN,
    )
    setRowRange((current) => (rangesEqual(current, nextRange) ? current : nextRange))
  }, [rowCount, rowHeight, rowViewportHeight, verticalScrollRef])

  const updateColumnRange = useCallback(() => {
    const scrollElement = horizontalScrollRef.current
    const nextRange = getVariableRange(columnWidths, scrollElement?.scrollLeft ?? 0, scrollElement?.clientWidth || columnViewportWidth)
    setColumnRange((current) => (rangesEqual(current, nextRange) ? current : nextRange))
  }, [columnViewportWidth, columnWidths, horizontalScrollRef])

  useEffect(() => {
    if (!enabled) return undefined

    const verticalScrollElement = verticalScrollRef.current
    const horizontalScrollElement = horizontalScrollRef.current
    updateRowRange()
    updateColumnRange()

    verticalScrollElement?.addEventListener('scroll', updateRowRange, { passive: true })
    horizontalScrollElement?.addEventListener('scroll', updateColumnRange, { passive: true })

    const resizeObserver = new ResizeObserver(() => {
      updateRowRange()
      updateColumnRange()
    })
    if (verticalScrollElement) resizeObserver.observe(verticalScrollElement)
    if (horizontalScrollElement) resizeObserver.observe(horizontalScrollElement)

    return () => {
      verticalScrollElement?.removeEventListener('scroll', updateRowRange)
      horizontalScrollElement?.removeEventListener('scroll', updateColumnRange)
      resizeObserver.disconnect()
    }
  }, [enabled, horizontalScrollRef, updateColumnRange, updateRowRange, verticalScrollRef])

  const columnOffset = useMemo(
    () => columnWidths.slice(0, columnRange.start).reduce((sum, width) => sum + width, 0),
    [columnRange.start, columnWidths],
  )

  return {
    rowRange,
    columnRange,
    rowOffset: rowRange.start * rowHeight,
    columnOffset,
    totalRowHeight: rowCount * rowHeight,
  }
}

export default useFixedTableVirtualization
