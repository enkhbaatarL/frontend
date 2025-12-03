export interface MaskConfig {
  pattern: RegExp
  placeholder?: string
  format?: (value: string) => string
  calculateCursorPosition?: (formattedValue: string, selectionStart: number, inputType: string, inputData?: string) => number
}

export const PREDEFINED_MASKS: Record<string, MaskConfig> = {
  DATE: {
    pattern: /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12]\d|30|31)$/,
    placeholder: 'yyyy-mm-dd',
    format: (value: string) =>
      value
        .replaceAll(/\D/g, '')
        .slice(0, 8)
        .replaceAll(/^(\d{0,4})(\d{0,2})(\d{0,2})$/g, '$1-$2-$3')
        .replaceAll(/(-{1,2})$/g, '') ?? '',
    calculateCursorPosition: (formattedValue: string, selectionStart: number, inputType: string, inputData?: string): number => {
      let cursorIndex = selectionStart

      if (formattedValue.length !== 10) {
        if (!'0123456789'.includes(inputData ?? ' ') && !['deleteContentBackward', 'deleteContentForward'].includes(inputType)) {
          cursorIndex -= 1
        }

        // 하이픈이 삭제된 위치에 커서가 있을 때
        if (formattedValue[selectionStart - 1] === '-') {
          cursorIndex = inputType === 'deleteContentBackward' ? cursorIndex - 1 : cursorIndex + 1
        }
      }

      return cursorIndex
    },
  },
  TIME: {
    pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
    placeholder: 'hh:mm',
    format: (value: string) => {
      const digits = value.replaceAll(/\D/g, '').slice(0, 4)
      if (digits.length === 0) return ''

      const hours = digits.slice(0, 2)
      const minutes = digits.slice(2, 4)

      if (minutes.length > 0) {
        return `${hours}:${minutes}`
      } else if (hours.length > 0) {
        return hours
      }

      return ''
    },
    calculateCursorPosition: (formattedValue: string, selectionStart: number, inputType: string, inputData?: string): number => {
      let cursorIndex = selectionStart

      if (formattedValue.length !== 5) {
        if (!'0123456789'.includes(inputData ?? ' ') && !['deleteContentBackward', 'deleteContentForward'].includes(inputType)) {
          cursorIndex -= 1
        }

        if (formattedValue[selectionStart - 1] === ':') {
          cursorIndex = inputType === 'deleteContentBackward' ? cursorIndex - 1 : cursorIndex + 1
        }
      }

      return cursorIndex
    },
  },
}
