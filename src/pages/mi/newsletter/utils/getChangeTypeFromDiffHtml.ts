/** diff HTML에서 <ins>만 있으면 추가, <del>만 있으면 삭제, 둘 다 있으면 수정 */
export const getChangeTypeFromDiffHtml = (...diffHtmls: (string | undefined)[]): 'added' | 'deleted' | 'modified' => {
  const combined = diffHtmls.filter(Boolean).join('') || ''
  const hasIns = /<ins[\s>]/.test(combined)
  const hasDel = /<del[\s>]/.test(combined)
  if (hasIns && hasDel) return 'modified'
  if (hasIns) return 'added'
  if (hasDel) return 'deleted'
  return 'modified'
}
