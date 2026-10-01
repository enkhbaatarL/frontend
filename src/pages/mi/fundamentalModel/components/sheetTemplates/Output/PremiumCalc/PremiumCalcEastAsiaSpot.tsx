import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import OutputSheetTable from '@/pages/mi/fundamentalModel/components/sheetTemplates/Output/OutputSheetTable'

const PremiumCalcEastAsiaSpot = (props: SheetTemplateProps) => (
  <OutputSheetTable {...props} firstColumn={1} lastColumn={7} firstRow={56} lastRow={65} />
)

export default PremiumCalcEastAsiaSpot
