export interface Source {
  index: number | string
  sourceNm: string
  url: string
}

export interface SuggestedQuestion {
  index: number
  text: string
}

export type ParsingStatus = 'idle' | 'parsing_sources' | 'parsing_questions'

export interface ParsedData {
  sources: Source[] | null
  suggestedQuestions: SuggestedQuestion[] | null
}

/**
 * JSON 문자열이 유효한지 간단히 검사합니다.
 * @param jsonString 검사할 JSON 문자열
 * @returns 유효한 JSON인지 여부
 */
const isValidJSON = (jsonString: string): boolean => {
  if (!jsonString.trim()) return false

  const trimmed = jsonString.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    // 대괄호 매칭 확인
    let bracketCount = 0
    let braceCount = 0
    let inString = false
    let escapeNext = false

    for (const char of trimmed) {
      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      if (char === '"' && !escapeNext) {
        inString = !inString
        continue
      }

      if (inString) continue

      if (char === '[') bracketCount++
      if (char === ']') bracketCount--
      if (char === '{') braceCount++
      if (char === '}') braceCount--

      // 대괄호가 음수가 되면 잘못된 형식
      if (bracketCount < 0 || braceCount < 0) return false
    }

    // 대괄호와 중괄호가 모두 매칭 필요
    return bracketCount === 0 && braceCount === 0
  }

  return false
}

/**
 * SOURCES 데이터를 파싱합니다.
 * @param text 파싱할 텍스트
 * @returns 파싱된 Source 배열 또는 null
 */
export const parseSources = (text: string): Source[] | null => {
  // greedy 매칭으로 마지막 완전한 SOURCES 블록을 찾음
  const regex = /<!-- SOURCES: (.*?) -->/gs
  const matches = Array.from(text.matchAll(regex))

  // 마지막 매칭 결과 사용 (가장 최근의 완전한 블록)
  if (matches.length > 0) {
    const lastMatch = matches.at(-1)
    if (!lastMatch) return null
    const jsonString = lastMatch[1]?.trim()

    if (jsonString) {
      if (!isValidJSON(jsonString)) {
        return null
      }

      try {
        const sources: Source[] = JSON.parse(jsonString)
        if (Array.isArray(sources) && sources.length > 0) {
          const isValid = sources.every(
            (source) =>
              source &&
              typeof source === 'object' &&
              (typeof source.index === 'number' || typeof source.index === 'string') &&
              typeof source.sourceNm === 'string' &&
              typeof source.url === 'string',
          )
          if (isValid) {
            return sources
          }
        }
      } catch {
        // JSON 파싱 에러 무시 (스트리밍 중)
        return null
      }
    }
  }
  return null
}

/**
 * SUGGESTED_QUESTIONS 데이터를 파싱합니다.
 * @param text 파싱할 텍스트
 * @returns 파싱된 SuggestedQuestion 배열 또는 null
 */
export const parseSuggestedQuestions = (text: string): SuggestedQuestion[] | null => {
  // greedy 매칭으로 마지막 완전한 SUGGESTED_QUESTIONS 블록을 찾음
  const regex = /<!-- SUGGESTED_QUESTIONS: (.*?) -->/gs
  const matches = Array.from(text.matchAll(regex))

  // 마지막 매칭 결과 사용 (가장 최근의 완전한 블록)
  if (matches.length > 0) {
    const lastMatch = matches.at(-1)
    if (!lastMatch) return null
    const jsonString = lastMatch[1]?.trim()

    if (jsonString) {
      if (!isValidJSON(jsonString)) {
        return null
      }

      try {
        const questions: SuggestedQuestion[] = JSON.parse(jsonString)
        if (Array.isArray(questions) && questions.length > 0) {
          const isValid = questions.every(
            (question) =>
              question && typeof question === 'object' && typeof question.index === 'number' && typeof question.text === 'string',
          )
          if (isValid) {
            return questions
          }
        }
      } catch {
        // JSON 파싱 에러 무시 (스트리밍 중)
        return null
      }
    }
  }
  return null
}

/**
 * SOURCES 파싱 상태를 확인합니다.
 * @param text 확인할 텍스트
 * @param currentSources 현재 파싱된 sources
 * @returns 파싱 상태
 */
export const getSourcesParsingStatus = (text: string, currentSources: Source[] | null): 'idle' | 'parsing' | 'complete' => {
  if (currentSources) {
    return 'complete'
  }
  if (text.includes('<!-- SOURCES:')) {
    const parsed = parseSources(text)
    return parsed ? 'complete' : 'parsing'
  }
  return 'idle'
}

/**
 * SUGGESTED_QUESTIONS 파싱 상태를 확인합니다.
 * @param text 확인할 텍스트
 * @param currentQuestions 현재 파싱된 questions
 * @returns 파싱 상태
 */
export const getSuggestedQuestionsParsingStatus = (
  text: string,
  currentQuestions: SuggestedQuestion[] | null,
): 'idle' | 'parsing' | 'complete' => {
  if (currentQuestions) {
    return 'complete'
  }
  if (text.includes('<!-- SUGGESTED_QUESTIONS:')) {
    const parsed = parseSuggestedQuestions(text)
    return parsed ? 'complete' : 'parsing'
  }
  return 'idle'
}
