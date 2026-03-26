import type { IReferenceTableData } from '@/service/mi/newsletter'
import type { CSSProperties } from 'react'

import { EMAIL_FONT_FAMILY } from '@/utils/email'

const HEADER_STYLE: CSSProperties = {
  padding: '9px 8px',
  whiteSpace: 'nowrap',
  color: '#868E96',
  backgroundColor: '#F8F9FA',
  borderBottom: '1px solid #CED4DA',
  fontFamily: EMAIL_FONT_FAMILY,
  fontWeight: 600,
  fontSize: '13px',
  lineHeight: '18px',
}

const getHeaderAlign = (index: number): CSSProperties['textAlign'] => (index === 0 ? 'center' : 'right')

const CELL_STYLE: CSSProperties = {
  padding: '9px 8px',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid #DEE2E6',
  fontFamily: EMAIL_FONT_FAMILY,
  fontWeight: 400,
  fontSize: '14px',
  color: '#212529',
  lineHeight: '20px',
}

const getCellAlign = (index: number): CSSProperties['textAlign'] => (index === 0 ? 'center' : 'right')

const getCellBackgroundColor = (index: number): string | undefined => (index === 0 || index === 4 ? '#F8F9FA' : undefined)

interface ReferenceTableProps {
  tableData: IReferenceTableData
  width?: string
}

const ReferenceTable = ({ tableData, width = '100%' }: ReferenceTableProps) => {
  const { headers, rows } = tableData
  const cssWidth = width.includes('%') ? width : `${width}px`

  if (!headers?.length && !rows?.length) {
    return null
  }

  return (
    <table width={width} cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse', width: cssWidth }}>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th
              key={header.field}
              style={{
                ...HEADER_STYLE,
                textAlign: getHeaderAlign(index),
              }}
            >
              {header.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.cells.join(',')}>
            {row.cells.map((cell, index) => (
              <td
                key={`${index}-${cell}`}
                style={{
                  ...CELL_STYLE,
                  textAlign: getCellAlign(index),
                  backgroundColor: getCellBackgroundColor(index),
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ReferenceTable
