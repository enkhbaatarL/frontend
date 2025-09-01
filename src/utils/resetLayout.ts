let triggerResetFn: () => void = () => {}

export const setTriggerResetFn = (fn: () => void) => {
  triggerResetFn = fn
}

export const triggerLayoutReset = () => {
  triggerResetFn()
}
