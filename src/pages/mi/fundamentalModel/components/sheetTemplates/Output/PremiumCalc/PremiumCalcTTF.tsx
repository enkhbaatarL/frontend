import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import OutputSheetTable from '@/pages/mi/fundamentalModel/components/sheetTemplates/Output/OutputSheetTable'

const PremiumCalcTTF = (props: SheetTemplateProps) => (
  <OutputSheetTable {...props} firstColumn={1} lastColumn={7} firstRow={38} lastRow={47} />
)

export default PremiumCalcTTF
