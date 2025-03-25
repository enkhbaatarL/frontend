import clsx from 'clsx'
import { throttle } from 'lodash-es'
import { ComponentPropsWithoutRef, FunctionComponent, useEffect, useMemo, useRef, useState } from 'react'

import style from './DividerScroll.module.scss'

export type DividerScrollProps = {
  topBorder?: boolean
  bottomBorder?: boolean
  padding?: boolean
} & ComponentPropsWithoutRef<'div'>

const DividerScroll: FunctionComponent<DividerScrollProps> = ({
  className,
  topBorder = true,
  bottomBorder = true,
  padding,
  children,
  ...dividerScrollProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [hasTopBorder, setHasTopBorder] = useState(false)
  const [hasBottomBorder, setHasBottomBorder] = useState(false)

  const updateScrollState = () => {
    const container = containerRef.current

    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container
      const offset = 4

      setHasTopBorder(scrollTop > offset)
      setHasBottomBorder(scrollTop + clientHeight + offset <= scrollHeight)
    }
  }

  const handleScroll = throttle(updateScrollState, 50)

  const showTopBorder = useMemo(() => topBorder && hasTopBorder, [hasTopBorder, topBorder])
  const showBottomBorder = useMemo(() => bottomBorder && hasBottomBorder, [hasBottomBorder, bottomBorder])

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current

    if (container && content) {
      container.addEventListener('scroll', handleScroll)

      const resizeObserver = new ResizeObserver(() => {
        updateScrollState()
      })

      resizeObserver.observe(content)
      resizeObserver.observe(container)

      updateScrollState()

      return () => {
        container.removeEventListener('scroll', handleScroll)
        resizeObserver.disconnect()
      }
    }

    return () => {}
  }, [handleScroll])

  return (
    <div
      ref={containerRef}
      className={clsx(
        style.dividerScroll,
        !padding && style.noPadding,
        showTopBorder && style.showTopBorder,
        showBottomBorder && style.showBottomBorder,
        className,
      )}
      {...dividerScrollProps}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}

export default DividerScroll
