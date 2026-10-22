import { useState } from 'react'

import FundamentalModelAddColumnButton from '@/pages/mi/fundamentalModel/components/inputTable/FundamentalModelAddColumnButton'
import FundamentalModelRowMenu from '@/pages/mi/fundamentalModel/components/inputTable/FundamentalModelRowMenu'

interface Props<Row> {
  disabled?: boolean
  getRowId: (row: Row) => string | number
  getRowNumber: (row: Row) => number
  onAddColumn?: () => void
  onInsertAbove?: (row: Row) => void
  onInsertBelow?: (row: Row) => void
  onDeleteRow?: (row: Row) => void
  canDeleteRow?: (row: Row) => boolean
  canInsertAbove?: (row: Row) => boolean
  canInsertBelow?: (row: Row) => boolean
}

const useFundamentalModelTableActions = <Row,>({
  disabled,
  getRowId,
  getRowNumber,
  onAddColumn,
  onInsertAbove,
  onInsertBelow,
  onDeleteRow,
  canDeleteRow,
  canInsertAbove,
  canInsertBelow,
}: Props<Row>) => {
  const [activeRowId, setActiveRowId] = useState<string | number>()
  return {
    actionHeader: onAddColumn ? <FundamentalModelAddColumnButton disabled={disabled} onClick={onAddColumn} /> : undefined,
    isRowMenuOpen: (row: Row) => !disabled && activeRowId === getRowId(row),
    renderRowAction:
      onInsertAbove || onInsertBelow || onDeleteRow
        ? (row: Row) => {
          const canDelete = onDeleteRow && (canDeleteRow?.(row) ?? true)
          const insertAbove = onInsertAbove && (canInsertAbove?.(row) ?? true)
          const insertBelow = onInsertBelow && (canInsertBelow?.(row) ?? true)
          if (!insertAbove && !insertBelow && !canDelete) return null
          const id = getRowId(row)
          return (
            <FundamentalModelRowMenu
              rowNumber={getRowNumber(row)}
              disabled={disabled}
              open={!disabled && activeRowId === id}
              onOpenChange={(open) => setActiveRowId((current) => (open ? id : current === id ? undefined : current))}
              onInsertAbove={
                insertAbove
                  ? () => {
                    setActiveRowId(undefined)
                    onInsertAbove(row)
                  }
                  : undefined
              }
              onInsertBelow={
                insertBelow
                  ? () => {
                    setActiveRowId(undefined)
                    onInsertBelow(row)
                  }
                  : undefined
              }
              onDelete={
                canDelete
                  ? () => {
                    setActiveRowId(undefined)
                    onDeleteRow(row)
                  }
                  : undefined
              }
            />
          )
        }
        : undefined,
  }
}

export default useFundamentalModelTableActions
