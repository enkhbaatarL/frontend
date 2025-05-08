import { Box, Typography } from '@mui/material'
import { GridRowModel } from '@mui/x-data-grid'

import MITable, { MITableProps } from './MITable'
import MITablePagination from './MITablePagination'
import SearchIcon from '../icons/SearchIcon'
import MIInput from '../input/MIInput'

export interface MITableLayoutProps<T extends GridRowModel> {
  label?: string
  search?: {
    placeholder?: string
    onSearch?: (text: string) => void
    width?: number | string
  }
  actionButtons?: React.ReactElement
  tableProps: MITableProps<T>
  hidePagination?: boolean
}

export default function MITableLayout<T extends GridRowModel>(props: Readonly<MITableLayoutProps<T>>) {
  const hadHeader = props.label ?? props.search ?? props.actionButtons

  return (
    <Box>
      {hadHeader && (
        <Box mb={3} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
          <Box display={'flex'} alignItems={'center'}>
            {props.label && (
              <Typography variant="body1B16" color="gray.90">
                {props.label}
              </Typography>
            )}
          </Box>
          <Box display={'flex'} gap={'10px'}>
            {props.search && (
              <MIInput
                width={props.search?.width || 300}
                placeholder={props.search.placeholder}
                endIcon={<SearchIcon />}
                onChange={(e) => props.search?.onSearch?.(e.target.value)}
              />
            )}
            {props.actionButtons && <Box>{props.actionButtons}</Box>}
          </Box>
        </Box>
      )}
      <MITable {...props.tableProps} />
      {!props.hidePagination && <MITablePagination />}
    </Box>
  )
}
