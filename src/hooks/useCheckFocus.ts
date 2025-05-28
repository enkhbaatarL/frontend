import { useEffect, useRef, useState } from 'react'

export default function useCheckFocus() {
  const ref = useRef<HTMLElement>(null)
  const [isFocus, setIsFocus] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsFocus(false)
      } else {
        setIsFocus(true)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return {
    ref,
    isFocus,
    setIsFocus,
  }
}
