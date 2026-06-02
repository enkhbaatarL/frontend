const SCROLL_CHAIN_EPSILON_PX = 1
const LINE_HEIGHT_PX = 16

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const normalizeDeltaY = (event: WheelEvent, container: HTMLElement) => {
  if (event.deltaMode === 1) return event.deltaY * LINE_HEIGHT_PX
  if (event.deltaMode === 2) return event.deltaY * container.clientHeight
  return event.deltaY
}

const isElementScrollableY = (element: Element) => {
  const { overflowY } = window.getComputedStyle(element)

  if (!['auto', 'scroll', 'overlay'].includes(overflowY)) return false

  return element.scrollHeight > element.clientHeight + SCROLL_CHAIN_EPSILON_PX
}

const canScrollY = (element: Element, deltaY: number) => {
  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight)

  if (maxScrollTop <= SCROLL_CHAIN_EPSILON_PX) return false
  if (deltaY < 0) return element.scrollTop > SCROLL_CHAIN_EPSILON_PX
  if (deltaY > 0) return element.scrollTop < maxScrollTop - SCROLL_CHAIN_EPSILON_PX

  return false
}

const closestScrollableDescendantBefore = (target: EventTarget | null, boundary: HTMLElement, deltaY: number) => {
  if (!(target instanceof Element)) return null

  let element: Element | null = target

  while (element && element !== boundary) {
    if (isElementScrollableY(element) && canScrollY(element, deltaY)) return element
    element = element.parentElement
  }

  return null
}

const findScrollableParent = (container: HTMLElement, deltaY: number) => {
  let element = container.parentElement

  while (element) {
    if (isElementScrollableY(element) && canScrollY(element, deltaY)) return element
    element = element.parentElement
  }

  const scrollingElement = document.scrollingElement

  if (scrollingElement && scrollingElement !== container && canScrollY(scrollingElement, deltaY)) return scrollingElement

  return null
}

export const chainBoundaryWheelScroll = (event: WheelEvent, container: HTMLElement | null) => {
  if (!container || event.defaultPrevented || event.ctrlKey || event.shiftKey) return false
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return false

  const deltaY = normalizeDeltaY(event, container)

  if (Math.abs(deltaY) <= SCROLL_CHAIN_EPSILON_PX) return false
  if (closestScrollableDescendantBefore(event.target, container, deltaY)) return false

  if (canScrollY(container, deltaY)) return false

  const parent = findScrollableParent(container, deltaY)

  if (!parent) return false

  event.preventDefault()
  event.stopPropagation()

  const parentMaxScrollTop = Math.max(0, parent.scrollHeight - parent.clientHeight)
  parent.scrollTop = clamp(parent.scrollTop + deltaY, 0, parentMaxScrollTop)

  return true
}
