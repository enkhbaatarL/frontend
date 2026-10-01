import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import OutputSheetTable from '@/pages/mi/fundamentalModel/components/sheetTemplates/Output/OutputSheetTable'

const USCostOfSupply = (props: SheetTemplateProps) => (
  <OutputSheetTable {...props} firstColumn={1} lastColumn={10} firstRow={7} lastRow={818} />
)

export default USCostOfSupply
