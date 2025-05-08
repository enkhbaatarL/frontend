import { Box, Grid2 as Grid, IconButton, ListItemButton, MenuList, Tooltip, Typography } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import { isEmpty } from 'lodash-es'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Flex from '@/components/common/display/Flex'
import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'
import useAdminMenuItems from '@/hooks/useAdminMenuItems'
import useAdminPageInfo from '@/hooks/useAdminPageInfo'
import { ICustomRouteObject } from '@/types/common'

interface MenuItemProps {
  drawerOpen: boolean
  item: ICustomRouteObject
  depth?: number
  className?: string
}

const AdminMenuItem = ({ drawerOpen, item, depth = 0, className }: MenuItemProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const children = item.children?.filter(({ hidden }) => !hidden)

  const hasChildren = !isEmpty(children)
  const navigate = useNavigate()
  const { adminPageInfo } = useAdminPageInfo()
  const isActive = depth !== 0 && adminPageInfo.path.startsWith(item.path ?? '')
  const hasActiveChild = item.children?.some((child) => adminPageInfo.path.startsWith(child.path ?? ''))

  const [tooltipOpen, setTooltipOpen] = useState(false)

  useEffect(() => {
    if (hasActiveChild || isActive) {
      setOpen(true)
    }
  }, [hasActiveChild, isActive])

  if (item.hidden) return null

  return (
    <>
      <Tooltip
        open={tooltipOpen}
        onClose={() => setTooltipOpen(false)}
        onOpen={() => setTooltipOpen(true)}
        disableHoverListener={depth > 0 || (open && drawerOpen)}
        slotProps={{
          tooltip: {
            sx: {
              padding: 0,
              backgroundColor: 'transparent',
              boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.10)',
              marginLeft: `${drawerOpen ? '18px' : '8px'} !important`,
            },
          },
        }}
        placement="right-start"
        title={
          <MenuList
            sx={{
              borderRadius: '4px',
              marginLeft: '0',
              minWidth: '150px',
              paddingTop: 0,
              border: '1px solid #DEE2E6',
              backgroundColor: '#fff',
              '& .MuiButtonBase-root': {
                padding: '0 10px 0 12px',
                '&:nth-of-type(1)': {
                  padding: '10px 12px',
                  '& .MuiTypography-root': {
                    padding: 0,
                    backgroundColor: 'transparent',
                  },
                  '&:hover': {
                    backgroundColor: 'transparent',
                    '& .MuiTypography-root': {
                      backgroundColor: 'transparent',
                      fontWeight: 500,
                      color: '#495057',
                    },
                  },
                },
                '&:nth-of-type(2)': {
                  paddingTop: '8px',
                },
                '& .MuiTypography-root': {
                  padding: '6px 8px',
                  width: '100%',
                  borderRadius: '4px',
                  display: 'block',
                  transition: 'all 0.1s linear',
                },
                '&:hover': {
                  backgroundColor: 'transparent !important',
                  '& .MuiTypography-root': {
                    backgroundColor: '#F8F9FA',
                    fontWeight: 600,
                    color: '#212529',
                  },
                },
              },
            }}
          >
            <MenuItem disableRipple sx={{ borderBottom: '1px solid #DEE2E6', padding: '10px 12px', cursor: 'inherit' }} key={item.path}>
              <Typography variant="body2M14" color="gray.70">
                {item.label}
              </Typography>
            </MenuItem>
            {item.children?.map((child) =>
              !child.hidden ? (
                <MenuItem
                  disableRipple
                  onClick={() => {
                    if (child.path) navigate(child.path)
                    setTooltipOpen(false)
                  }}
                  key={child.label}
                >
                  <Typography variant="body2" color="gray.70">
                    {child.label}
                  </Typography>
                </MenuItem>
              ) : null,
            )}
          </MenuList>
        }
      >
        <ListItemButton
          disableRipple
          className={`${className ?? ''} ${open ? 'activeParent' : ''}`}
          onClick={() => {
            setTooltipOpen(false)
            if (hasChildren && drawerOpen) {
              setOpen(!open)
            } else if (item.path) {
              navigate(item.path)
            }
          }}
          sx={{
            borderRadius: '6px',
            padding: drawerOpen ? (depth > 0 ? '7px 10px 7px 36px' : '8px 0') : '0',
            color: isActive || hasActiveChild ? 'common.white' : depth > 0 ? 'coolGray.30' : 'coolGray.5',
            transition: 'all 0.15s ease-in-out',
            backgroundColor: isActive ? '#43526E !important' : '',
            '.MuiTypography-root': {
              transition: 'all 0.15s ease-in-out',
            },
            '.MuiBox-root': {
              color: '#909BB0',
            },
            '&:hover': {
              backgroundColor: depth > 0 || !drawerOpen ? '#354564' : 'transparent',
              '.MuiTypography-root': {
                color: '#fff',
              },
              '.MuiButtonBase-root': {
                color: '#fff',
                svg: {
                  color: '#fff',
                },
              },
              '.MuiBox-root': {
                svg: {
                  color: '#fff',
                },
              },
            },
          }}
        >
          <Flex className="full-width" justify="space-between">
            <Flex className="full-width" align="center">
              {depth === 0 && (
                <Box
                  borderRadius="6px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width={drawerOpen ? 28 : 44}
                  height={drawerOpen ? 28 : 44}
                  p={1}
                  sx={{
                    boxSizing: 'border-box',
                    backgroundColor: hasActiveChild ? (drawerOpen ? 'coolGray.90' : 'coolGray.50') : 'transparent',
                    marginRight: drawerOpen ? '8px' : 0,
                    color: hasActiveChild ? '#fff !important' : '#909BB0',
                  }}
                >
                  {item.icon?.({ fontSize: drawerOpen ? 'inherit' : 'small' })}
                </Box>
              )}
              {drawerOpen && (
                <Typography variant="body2" fontWeight={depth === 0 ? 600 : isActive ? 500 : 400}>
                  {item.label}
                </Typography>
              )}
            </Flex>
            {hasChildren && drawerOpen && (
              <IconButton
                sx={{
                  p: '4px',
                  boxSizing: 'border-box',
                  width: '28px',
                  height: '28px',
                  marginLeft: '4px',
                  color: 'currentcolor',
                }}
              >
                <KeyboardArrowUpIcon style={{ transform: open ? 'scaleY(1)' : 'scaleY(-1)', transformOrigin: 'center center' }} />
              </IconButton>
            )}
          </Flex>
        </ListItemButton>
      </Tooltip>
      {open &&
        item.children?.map((child) => (
          <AdminMenuItem
            className={drawerOpen ? '' : 'display-none'}
            key={child.path}
            drawerOpen={drawerOpen}
            item={child}
            depth={depth + 1}
          />
        ))}
    </>
  )
}

const AdminMenu = ({ drawerOpen }: { drawerOpen: boolean }) => {
  const adminMenuItems = useAdminMenuItems()

  return (
    <Grid container direction="column" gap={drawerOpen ? 0 : 3}>
      {adminMenuItems.map((item) => (
        <AdminMenuItem key={item.path} drawerOpen={drawerOpen} item={item} />
      ))}
    </Grid>
  )
}

export default AdminMenu
