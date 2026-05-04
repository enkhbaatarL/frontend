import { Box, Stack, Typography, type SxProps, type Theme } from '@mui/material'
import { type GridColDef, type GridRowModel } from '@mui/x-data-grid'

export const SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX = 138

export interface ScenarioWorkbenchTableHeaderProps<T extends GridRowModel> {
  columns: GridColDef<T>[]
  sx?: SxProps<Theme>
  sticky?: boolean
  stickyTop?: number | string // sticky 시 스크롤포트 상단으로부터의 오프셋
}

const ScenarioWorkbenchTableHeader = <T extends GridRowModel>({ columns, sx, sticky, stickyTop }: ScenarioWorkbenchTableHeaderProps<T>) => (
  <Stack
    direction="row"
    sx={[
      (theme) => ({
        alignItems: 'center',
        width: '100%',
        height: 36,
        borderBottom: `0.5px solid ${theme.palette.gray[60]}`,
        bgcolor: theme.palette.commonColor.White,
        ...(sticky
          ? {
            position: 'sticky',
            top: stickyTop ?? SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX,
            zIndex: 160,
            mb: 0,
            pb: 0,
          }
          : { mb: 1 }),
      }),
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
  >
    {columns.map((col) => (
      <Box
        key={col.field}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
          px: 1,
          ...(col.width
            ? { flex: '0 0 auto', width: `${col.width}px` }
            : { flex: `${col.flex ?? 1} 1 0`, minWidth: col.minWidth ? `${col.minWidth}px` : 0 }),
        }}
      >
        <Typography variant="body2SB14" color="gray.70" noWrap>
          {col.headerName ?? ''}
        </Typography>
      </Box>
    ))}
  </Stack>
)

export default ScenarioWorkbenchTableHeader
