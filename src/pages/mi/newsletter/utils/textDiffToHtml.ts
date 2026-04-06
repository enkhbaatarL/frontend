import DiffMatchPatch from 'diff-match-patch'
import DOMPurify from 'dompurify'

/** 삭제된 텍스트 스타일 - 취소선, 글씨 #e34449, 배경 #ffecec. padding은 em으로 두어 부모 font-size·Outlook 축소 폰트에 맞춤 */
const DEL_STYLE =
  'background-color: #ffecec; color: #e34449; text-decoration: line-through; padding: 0.12em 0.1em; box-decoration-break: clone; -webkit-box-decoration-break: clone;'

/** 추가된 텍스트 스타일 - 효과없음(밑줄X), 글씨 #008855, 배경 #e6f7ee. text-decoration:none으로 <ins> 기본 밑줄 제거 */
const INS_STYLE =
  'background-color: #e6f7ee; color: #008855; text-decoration: none; padding: 0.12em 0.1em; box-decoration-break: clone; -webkit-box-decoration-break: clone;'

/** dangerouslySetInnerHTML 주입 전 XSS 방지를 위한 DOMPurify 설정 */
const SANITIZE_CONFIG: { ALLOWED_TAGS: string[]; ALLOWED_ATTR: string[] } = {
  ALLOWED_TAGS: ['del', 'ins', 'br'],
  ALLOWED_ATTR: ['style'],
}

const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\'', '&#039;')

/**
 * 두 텍스트를 비교하여 diff가 적용된 HTML을 생성합니다.
 * DOMPurify로 sanitize하여 dangerouslySetInnerHTML 사용 시 XSS를 방지합니다.
 * @param previous - 이전 버전 텍스트
 * @param current - 현재 버전 텍스트
 * @returns diff가 <del>/<ins> 태그로 적용된 HTML 문자열
 */
export const textDiffToHtml = (previous: string, current: string): string => {
  if (previous === current) return DOMPurify.sanitize(escapeHtml(current), SANITIZE_CONFIG)
  if (!previous) return DOMPurify.sanitize(`<ins style="${INS_STYLE}">${escapeHtml(current)}</ins>`, SANITIZE_CONFIG)
  if (!current) return DOMPurify.sanitize(`<del style="${DEL_STYLE}">${escapeHtml(previous)}</del>`, SANITIZE_CONFIG)

  const dmp = new DiffMatchPatch()
  const diffs = dmp.diff_main(previous, current)
  // diff_cleanupSemantic 제거: "예정어"→"예정이다."처럼 일부만 바뀐 경우,
  // cleanup이 전체 문장을 delete+add로 묶어버리는 문제 방지. 최소 단위로 표시.
  // dmp.diff_cleanupSemantic(diffs)

  const result = diffs
    .map(([op, text]) => {
      const escaped = escapeHtml(text)
      if (op === -1) return `<del style="${DEL_STYLE}">${escaped}</del>`
      if (op === 1) return `<ins style="${INS_STYLE}">${escaped}</ins>`
      return escaped
    })
    .join('')
    .replaceAll('\n', '<br/>')

  return DOMPurify.sanitize(result, SANITIZE_CONFIG)
}
