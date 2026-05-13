export const SCENARIO_WORKBENCH_MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'

export const scrollScenarioWorkbenchLayoutToTop = (embeddedScrollRoot?: HTMLElement | null): void => {
  const apply = function (): void {
    if (embeddedScrollRoot) {
      embeddedScrollRoot.scrollTop = 0
      return
    }
    const el = document.getElementById(SCENARIO_WORKBENCH_MAIN_SCROLL_WRAPPER_ID)
    if (el) {
      el.scrollTop = 0
    }
    window.scrollTo(0, 0)
  }

  apply()
  queueMicrotask(apply)
  requestAnimationFrame(() => {
    apply()
    requestAnimationFrame(apply)
  })
}
