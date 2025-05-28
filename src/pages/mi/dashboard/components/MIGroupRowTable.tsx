import { styled, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { ReactElement, useMemo } from 'react'
import { Fragment } from 'react/jsx-runtime'

// Define TypeScript interfaces for the component props
export interface RowData {
  label: string
  values: (number | string | null)[]
  customCell?: (value: string | number | null) => ReactElement
}

export interface GroupData {
  name: string
  rows: RowData[]
}

export interface MIGroupRowTableProps {
  columnHeaders: string[]
  data: GroupData[]
}

// Styled components using MUI's styled API
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.gray[5],
    padding: '8px 12px',
    borderBottom: '1px solid #CED4DA',
  },
}))

const GroupNameCell = styled(TableCell)(({ theme }) => ({
  verticalAlign: 'middle',
  backgroundColor: theme.palette.common.white,
  borderBottom: '1px solid #DEE2E6',
}))

const RowLabelCell = styled(TableCell)(({ theme }) => ({
  padding: '10px 12px',
  backgroundColor: theme.palette.common.white,
  borderBottom: '1px solid #DEE2E6',
}))

const DataCell = styled(TableCell)(({ theme }) => ({
  padding: '10px 12px',
  textAlign: 'right',
  backgroundColor: theme.palette.common.white,
  borderBottom: '1px solid #DEE2E6',
}))

export const TrendDataCell = (props: { value: string | number | null }) => {
  const value = useMemo(() => {
    if (props.value === null) return '-'
    if (typeof props.value === 'number' && props.value >= 0) return `+${props.value}`
    if (typeof props.value === 'number' && props.value < 0) return props.value

    return '-'
  }, [props.value])

  const color = useMemo(() => {
    if (props.value === null) return '#212529'
    if (typeof props.value === 'number' && props.value >= 0) return '#498B47'
    if (typeof props.value === 'number' && props.value < 0) return '#CC4D50'

    return '#212529'
  }, [props.value])

  return (
    <DataCell>
      <Typography variant="tableBody2" color={color}>
        {value ?? '-'}
      </Typography>
    </DataCell>
  )
}

export default function MIGroupRowTable(props: MIGroupRowTableProps) {
  const { columnHeaders, data } = props

  return (
    <TableContainer>
      <Table size="small" aria-label="data comparison table">
        <TableHead sx={{}}>
          <TableRow>
            <StyledTableCell colSpan={2}>
              <Typography variant="tableHeaderSemibold" fontWeight={400} color="gray.60">
                {columnHeaders[0] || 'Items'}
              </Typography>
            </StyledTableCell>
            {columnHeaders.slice(1).map((header, index) => (
              <StyledTableCell key={index}>
                <Typography variant="tableHeaderSemibold" fontWeight={400} color="gray.60">
                  {header}
                </Typography>
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((group, groupIndex) => (
            <Fragment key={groupIndex}>
              {group.rows.map((row, rowIndex) => (
                <TableRow key={`${groupIndex}-${rowIndex}`}>
                  {rowIndex === 0 ? (
                    // Group name cell with rowspan for the first row
                    <GroupNameCell rowSpan={group.rows.length}>
                      <Typography variant="tableBody1" color="gray.90">
                        {group.name}
                      </Typography>
                    </GroupNameCell>
                  ) : null}

                  {/* Row label */}
                  <RowLabelCell>
                    <Typography variant="tableBody2" color="gray.90">
                      {row.label}
                    </Typography>
                  </RowLabelCell>

                  {/* Data cells */}
                  {row.values.map((value, valueIndex) => (
                    <Fragment key={valueIndex}>
                      {row.customCell ? (
                        row.customCell(value)
                      ) : (
                        <DataCell>
                          <Typography variant="tableBody2" color="gray.90">
                            {value ?? '-'}
                          </Typography>
                        </DataCell>
                      )}
                    </Fragment>
                  ))}
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
