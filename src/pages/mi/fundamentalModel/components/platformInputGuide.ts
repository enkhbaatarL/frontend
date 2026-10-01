import * as XLSX from 'xlsx-js-style'

import type {
  FundamentalModelInputGuideRule,
  FundamentalModelInputRole,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'

const guideRoles: Record<string, FundamentalModelInputRole> = {
  입력: 'scenario',
  '입력 / 업무 정합성': 'scenario',
  기준정보: 'reference',
  조건부: 'conditional',
}

const getText = (sheet: XLSX.WorkSheet, address: string) => String(sheet[address]?.v ?? '').trim()

export const getPlatformInputGuideRules = (sheet: XLSX.WorkSheet): FundamentalModelInputGuideRule[] => {
  if (!sheet['!ref']) return []

  const { e } = XLSX.utils.decode_range(sheet['!ref'])
  const rules: FundamentalModelInputGuideRule[] = []

  for (let row = 9; row <= e.r + 1; row += 1) {
    const sheetName = getText(sheet, `A${row}`)
    const range = getText(sheet, `B${row}`)
    const role = guideRoles[getText(sheet, `C${row}`)]
    if (!sheetName || !range || !role) continue

    try {
      const bounds = XLSX.utils.decode_range(range)
      rules.push({
        sheetName,
        range,
        role,
        item: getText(sheet, `D${row}`),
        emptyHandling: getText(sheet, `E${row}`),
        startRow: bounds.s.r + 1,
        endRow: bounds.e.r + 1,
        startColumn: bounds.s.c,
        endColumn: bounds.e.c,
      })
    } catch {
      continue
    }
  }

  return rules
}
