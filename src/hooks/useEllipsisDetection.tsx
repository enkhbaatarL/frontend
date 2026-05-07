import { useEffect, useRef, useState } from 'react'

export default function useEllipsisDetection(observedKey?: unknown) {
  const ref = useRef<HTMLElement>(null)
  const [isEllipsis, setIsEllipsis] = useState(false)
  const checkOverflow = () => {
    if (ref.current) {
      setIsEllipsis(ref.current.scrollWidth > ref.current.clientWidth || ref.current.scrollHeight > ref.current.clientHeight)
    }
  }

  useEffect(() => {
    checkOverflow()

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow()
    })

    if (ref.current) {
      resizeObserver.observe(ref.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [observedKey])

  return { isEllipsis, ref }
}
