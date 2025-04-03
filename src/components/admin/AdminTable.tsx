import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Box, Typography, TypographyProps, ListItemIcon, Tooltip } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { DataGrid, DataGridProps, GridColDef, GridEventListener, GridRenderCellParams, GridRowModel } from '@mui/x-data-grid'
// eslint-disable-next-line import/no-extraneous-dependencies
import { Instance } from '@popperjs/core'
import clsx from 'clsx'
import { JSX, PropsWithChildren, useMemo, useRef, useState, MouseEvent, useEffect, HTMLAttributes } from 'react'

import AdminChip, { AdminChipProps } from './AdminChip'
import style from './AdminTable.module.scss'
import ErrorOutlineIcon from '../common/icons/ErrorOutlineIcon'

import AdminButton from '@/components/admin/AdminButton.tsx'
import AdminPagination from '@/components/admin/AdminPagination'
import { adminTableBaseProps } from '@/constants/admin'

interface AdminTableProps<T extends GridRowModel> extends DataGridProps {
  getRowId?: (row: T) => string | number
  columns: GridColDef[]
  rows?: T[]
  isLoading?: boolean
  noRowMessage?: string
  hidePagination?: boolean
  onRowClick?: GridEventListener<'rowClick'>
  size?: number
  page?: number
  onSizeChange?: (value: number) => void
  onPageChange?: (value: number) => void
  totalElements?: number
  totalPages?: number
}

export const AdminTableHeader = ({ children }: PropsWithChildren) => (
  <Box py={2} px={1} lineHeight="36px">
    <Typography variant="tableHeader1" color="gray.60">
      {children}
    </Typography>
  </Box>
)

interface AdminTableCellProps extends PropsWithChildren {
  disabled?: boolean
  typography?: TypographyProps
  chip?: AdminChipProps
  type?: 'text' | 'chip'
  tooltipContent?: string
  onClick?: () => void
  ellipsis?: boolean
  cursorPointer?: boolean
}

export const AdminTableCell = (props: AdminTableCellProps) => {
  const { children, typography, type = 'text', chip, onClick, disabled = false, tooltipContent, ellipsis = false, cursorPointer } = props
  const textRef = useRef<HTMLDivElement>(null)
  const [tooltipText, setTooltipText] = useState<string | undefined>(tooltipContent)

  const positionRef = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const popperRef = useRef<Instance>(null)
  const areaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ellipsis && textRef.current && typeof children === 'string') {
      const isTextOverflowing = textRef.current.scrollWidth > textRef.current.clientWidth
      if (isTextOverflowing && !tooltipContent) {
        setTooltipText(children)
      } else {
        setTooltipText(tooltipContent)
      }
    } else {
      setTooltipText(tooltipContent)
    }
  }, [children, ellipsis, tooltipContent])

  const handleMouseMove = (event: MouseEvent) => {
    positionRef.current = { x: event.clientX, y: event.clientY }

    if (popperRef.current !== null) {
      popperRef.current.update().then()
    }
  }

  if (type === 'chip') {
    return (
      <Tooltip
        title={tooltipText}
        slotProps={{
          popper: {
            popperRef,
            anchorEl: {
              getBoundingClientRect: () => new DOMRect(positionRef.current.x, areaRef.current!.getBoundingClientRect().y + 40, 0, 0),
            },
          },
        }}
        arrow
      >
        <Box ref={areaRef} onMouseMove={handleMouseMove}>
          <AdminChip label={children} {...chip} />
        </Box>
      </Tooltip>
    )
  }

  return (
    <Tooltip
      title={tooltipText}
      disableHoverListener={!tooltipText}
      slotProps={{
        popper: {
          popperRef,
          anchorEl: {
            getBoundingClientRect: () => new DOMRect(positionRef.current.x, areaRef.current!.getBoundingClientRect().y + 40, 0, 0),
          },
        },
      }}
      arrow
    >
      <Typography
        ref={(node: HTMLDivElement | null) => {
          areaRef.current = node
          textRef.current = node
        }}
        component="div"
        onMouseMove={handleMouseMove}
        variant="tableBody2"
        color={disabled ? 'gray.50' : 'gray.90'}
        {...typography}
        onClick={onClick}
        sx={{
          cursor: cursorPointer || onClick ? 'pointer' : 'default',
          padding: '10px 12px',
          width: '100%',
          ...(ellipsis && {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }),
          ...typography?.sx,
        }}
      >
        {children}
      </Typography>
    </Tooltip>
  )
}

export interface ActionItem {
  label: string
  icon: JSX.Element
  onClick: () => void
}

export interface AdminActionCellProps {
  actions: ActionItem[]
}

export const AdminTableAction = ({ actions }: AdminActionCellProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <AdminButton
        sx={{
          padding: 0,
          minWidth: 'unset',
          width: 28,
          height: 28,
          borderRadius: '6px',
          background: open ? 'rgba(46, 63, 94, 0.10)' : 'transparent',
        }}
        onClick={handleClick}
      >
        <MoreVertIcon sx={{ color: open ? '#343A40' : 'gray.60', cursor: 'pointer' }} fontSize="small" />
      </AdminButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={action.label + index}
            sx={{ padding: '8px 14px', minWidth: '90px' }}
            onClick={() => {
              action.onClick()
              handleClose()
            }}
          >
            <ListItemIcon sx={{ minWidth: '20px !important', marginRight: 2, color: 'gray.60' }}>{action.icon}</ListItemIcon>
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

const AdminTableNoRowsOverlay = (props: { noRowMessage?: string } & HTMLAttributes<HTMLDivElement>) => (
  <Box className={clsx(style.adminTableNoRowsOverlay)} {...props}>
    <Box display="flex" flexDirection="column" rowGap="10px" alignItems="center">
      <ErrorOutlineIcon />
      <Typography variant="body6" color="gray.60">
        {props.noRowMessage ?? '표시할 데이터가 없습니다'}
      </Typography>
    </Box>
  </Box>
)

const AdminTable = <T extends GridRowModel>({
  getRowId,
  columns,
  rows,
  noRowMessage,
  hidePagination,
  onRowClick,
  isLoading,
  size,
  onSizeChange,
  onPageChange,
  page,
  totalElements,
  totalPages,
}: AdminTableProps<T>) => {
  const memoizedColumns = useMemo(
    () =>
      columns.map((column) => {
        const renderCell = column.renderCell
          ? column.renderCell
          : (params: GridRenderCellParams) => (
            <AdminTableCell ellipsis cursorPointer={!!onRowClick}>
              {params.value}
            </AdminTableCell>
          )

        return {
          ...column,
          headerAlign: column.align,
          width: rows?.length === 0 ? 'auto' : column.width,
          minWidth: rows?.length === 0 ? 'unset' : column.minWidth,
          flex: rows?.length === 0 ? 1 : column.flex,
          renderHeader: () => <AdminTableHeader>{column.headerName}</AdminTableHeader>,
          renderCell,
        }
      }) as GridColDef<T>[],
    [columns, onRowClick, rows?.length],
  )

  const paginationRange = useMemo(() => {
    if (!totalElements) return null

    const currentPage = page ?? 1
    const pageSize = size ?? 20
    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalElements ?? 0)
    return `${start}-${end} of ${(totalElements ?? 0).toLocaleString()}`
  }, [page, size, totalElements])

  const handleChange = (event: SelectChangeEvent) => {
    onSizeChange?.(parseInt(event.target.value))
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <DataGrid
        slots={{
          noRowsOverlay: AdminTableNoRowsOverlay,
        }}
        slotProps={{
          noRowsOverlay: { children: noRowMessage },
        }}
        onRowClick={onRowClick}
        getRowId={getRowId}
        rows={rows ?? []}
        columns={memoizedColumns}
        getRowClassName={() => (onRowClick ? 'clickable-row' : '')}
        {...adminTableBaseProps}
        sx={{
          ...adminTableBaseProps.sx,
          '& .MuiDataGrid-row, & .MuiDataGrid-cell': {
            cursor: onRowClick ? 'pointer' : 'default',
          },
        }}
        rowHeight={40}
        columnHeaderHeight={36}
        style={{ borderLeftColor: 'transparent', borderRightColor: 'transparent' }}
        className="dataGridAdmin"
        loading={isLoading}
      />

      {!hidePagination && (
        <Box display="flex" alignItems="center" justifyContent="space-between" pt="20px" pb="10px">
          <Typography variant="body3" color="gray.60">
            {paginationRange}
          </Typography>
          <AdminPagination onPageChange={onPageChange} page={page} count={totalPages} />
          <FormControl sx={{ width: '72px' }}>
            <Select sx={{ minWidth: 'unset' }} size="small" value={(size ?? 20).toString()} onChange={handleChange}>
              {[10, 15, 20, 25, 30].map((pageSize) => (
                <MenuItem key={pageSize} sx={{ fontSize: 12 }} value={pageSize}>
                  {pageSize}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  )
}

export default AdminTable
