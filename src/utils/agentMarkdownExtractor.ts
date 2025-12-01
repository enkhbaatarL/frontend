export interface Source {
  index: string
  sourceNm: string
  url: string
}

export interface SuggestedQuestion {
  index: number
  text: string
}

export interface ParsedTable {
  tableId: string
  headers: string[]
  rows: string[][]
}

export type ParsingStatus = 'idle' | 'parsing_sources' | 'parsing_questions'

import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

export interface ParsedData {
  sources: Source[] | null
  suggestedQuestions: SuggestedQuestion[] | null
  tables: ParsedTable[] | null
}

// remark AST 타입 정의
interface TableNode {
  type: 'table'
  children: TableRowNode[]
}

interface TableRowNode {
  type: 'tableRow'
  children: TableCellNode[]
}

interface TableCellNode {
  type: 'tableCell'
  children: Array<{ type: string; value?: string; children?: Array<{ type: string; value?: string }> }>
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
          const isValid = sources.every((source) => source && typeof source === 'object' && typeof source.index === 'string')
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
          const isValid = questions.every((question) => question && typeof question === 'object')
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
  if (currentSources && currentSources.length > 0) {
    return 'complete'
  }

  const sourcesCommentStart = text.indexOf('<!-- SOURCES:')
  if (sourcesCommentStart === -1) {
    return 'idle'
  }

  // SOURCES 주석이 시작된 위치 이후에 --> 가 있는지 확인
  const afterCommentStart = text.substring(sourcesCommentStart)
  const sourcesCommentEnd = afterCommentStart.indexOf('-->')

  if (sourcesCommentEnd === -1) {
    // 주석이 열려있지만 닫히지 않았으면 파싱 중
    return 'parsing'
  }

  // 주석이 닫혔으면 파싱 시도
  const parsed = parseSources(text)
  if (parsed && parsed.length > 0) {
    return 'complete'
  }

  // 주석은 닫혔지만 파싱 실패 (잘못된 형식일 수 있음)
  // 이 경우에도 'idle'로 반환하여 메시지를 표시하지 않음
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
  if (currentQuestions && currentQuestions.length > 0) {
    return 'complete'
  }

  const questionsCommentStart = text.indexOf('<!-- SUGGESTED_QUESTIONS:')
  if (questionsCommentStart === -1) {
    return 'idle'
  }

  // SUGGESTED_QUESTIONS 주석이 시작된 위치 이후에 --> 가 있는지 확인
  const afterCommentStart = text.substring(questionsCommentStart)
  const questionsCommentEnd = afterCommentStart.indexOf('-->')

  if (questionsCommentEnd === -1) {
    // 주석이 열려있지만 닫히지 않았으면 파싱 중
    return 'parsing'
  }

  // 주석이 닫혔으면 파싱 시도
  const parsed = parseSuggestedQuestions(text)
  if (parsed && parsed.length > 0) {
    return 'complete'
  }

  // 주석은 닫혔지만 파싱 실패 (잘못된 형식일 수 있음)
  // 이 경우에도 'idle'로 반환하여 메시지를 표시하지 않음
  return 'idle'
}

/**
 * 텍스트 노드에서 텍스트를 추출합니다.
 */
const extractTextFromNode = (node: { type: string; value?: string; children?: Array<{ type: string; value?: string }> }): string => {
  if (node.value) {
    return node.value
  }
  if (node.children) {
    return node.children.map((child) => extractTextFromNode(child)).join('')
  }
  return ''
}

/**
 * 테이블 셀에서 텍스트를 추출합니다.
 */
const extractCellText = (cell: TableCellNode): string => {
  if (!cell.children || cell.children.length === 0) {
    return ''
  }
  return cell.children
    .map((child) => extractTextFromNode(child))
    .join('')
    .trim()
}

/**
 * unified와 remark를 사용하여 마크다운 텍스트에서 테이블을 파싱합니다.
 * @param text 파싱할 마크다운 텍스트
 * @returns 파싱된 테이블 배열
 */
export const parseMarkdownTables = (text: string): ParsedTable[] => {
  try {
    const processor = unified().use(remarkParse).use(remarkGfm)
    const ast = processor.parse(text)

    const tables: ParsedTable[] = []
    let tableIndex = 0

    // AST를 순회하며 테이블 노드 찾기
    const traverse = (node: { type: string; children?: unknown[] }): void => {
      if (node.type === 'table') {
        const tableNode = node as TableNode
        const rows = tableNode.children

        if (rows.length === 0) {
          return
        }

        // 첫 번째 행은 헤더 (remark-gfm은 헤더를 별도로 처리하지 않으므로 첫 행이 헤더)
        const headerRow = rows[0]
        const headers = headerRow.children.map((cell) => extractCellText(cell))

        // 나머지 행들은 데이터
        const dataRows: string[][] = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          const cells = row.children.map((cell) => extractCellText(cell))
          dataRows.push(cells)
        }

        if (headers.length > 0) {
          tables.push({
            tableId: `table-${tableIndex++}`,
            headers,
            rows: dataRows,
          })
        }
      }

      // 자식 노드 재귀적으로 탐색
      if (node.children) {
        for (const child of node.children) {
          if (typeof child === 'object' && child !== null && 'type' in child) {
            traverse(child as { type: string; children?: unknown[] })
          }
        }
      }
    }

    traverse(ast)

    return tables
  } catch (error) {
    console.error('Failed to parse markdown tables:', error)
    return []
  }
}
