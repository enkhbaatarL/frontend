import { Box, IconButton, ListItemButton, Typography } from '@mui/material'
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

const MenuItem = ({ drawerOpen, item, depth = 0, className }: MenuItemProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const children = item.children?.filter(({ hidden }) => !hidden)

  const hasChildren = !isEmpty(children)
  const navigate = useNavigate()
  const { adminPageInfo } = useAdminPageInfo()
  const isActive = depth !== 0 && adminPageInfo.path.startsWith(item.path ?? '')
  const hasActiveChild = item.children?.some((child) => adminPageInfo.path.startsWith(child.path ?? ''))

  useEffect(() => {
    if (hasActiveChild || isActive) {
      setOpen(true)
    }
  }, [hasActiveChild, isActive])

  if (item.hidden) return null

  return (
    <>
      <ListItemButton
        className={className}
        onClick={() => {
          if (hasChildren) {
            if (drawerOpen) setOpen(!open)
          } else if (item.path) {
            navigate(item.path)
          }
        }}
        sx={{
          padding: drawerOpen ? '8px 12px' : '8px 10px',
          color: isActive || hasActiveChild ? 'common.white' : 'coolGray.10',
        }}
      >
        <Flex className="full-width" justify="space-between" align="center">
          <Flex className="full-width" gap={6} align="center">
            <Box
              borderRadius="6px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              width={24}
              height={24}
              p={1}
              sx={{ backgroundColor: hasActiveChild ? 'coolGray.90' : 'transparent' }}
            >
              {item.icon}
            </Box>
            {drawerOpen && (
              <Typography variant="body2" fontWeight={600}>
                {item.label}
              </Typography>
            )}
          </Flex>
          {hasChildren && drawerOpen && (
            <IconButton sx={{ p: '6px' }}>
              <KeyboardArrowUpIcon style={{ transform: open ? 'scaleY(1)' : 'scaleY(-1)', transformOrigin: 'center center' }} />
            </IconButton>
          )}
        </Flex>
      </ListItemButton>
      {open &&
        item.children?.map((child) => (
          <MenuItem className={drawerOpen ? '' : 'display-none'} key={child.path} drawerOpen={drawerOpen} item={child} depth={depth + 1} />
        ))}
    </>
  )
}

const AdminMenu = ({ drawerOpen }: { drawerOpen: boolean }) => {
  const adminMenuItems = useAdminMenuItems()

  return (
    <>
      {adminMenuItems.map((item) => (
        <MenuItem key={item.path} drawerOpen={drawerOpen} item={item} />
      ))}
    </>
  )
}

export default AdminMenu
