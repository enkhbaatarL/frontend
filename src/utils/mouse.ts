import { MouseEvent } from 'react'

export const disableContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  return false
}
