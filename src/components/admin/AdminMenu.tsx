import { ExpandMore } from '@mui/icons-material'
import { ListItemButton } from '@mui/material'
import { isEmpty } from 'lodash-es'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Flex from '@/components/common/display/Flex'
import useAdminMenuItems, { IMenuItem } from '@/hooks/useAdminMenuItems'
import useAdminPageInfo from '@/hooks/useAdminPageInfo'

interface MenuItemProps {
  drawerOpen: boolean
  item: IMenuItem
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
          padding: '8px 14px',
          color: isActive ? 'primary.main' : 'inherit',
        }}
      >
        <Flex className="full-width" justify="space-between">
          <Flex className="full-width" gap={6}>
            <div style={{ minWidth: 24, minHeight: 24 }}>{item.icon}</div>
            <div className={drawerOpen ? '' : 'display-none'}>{item.label}</div>
          </Flex>
          {hasChildren && drawerOpen && <ExpandMore />}
        </Flex>
      </ListItemButton>
      {open &&
        item.children?.map((child) => (
          <MenuItem className={drawerOpen ? '' : 'display-none'} key={child.key} drawerOpen={drawerOpen} item={child} depth={depth + 1} />
        ))}
    </>
  )
}

const AdminMenu = ({ drawerOpen }: { drawerOpen: boolean }) => {
  const { adminMenuItems } = useAdminMenuItems()

  return (
    <>
      {adminMenuItems.map((item) => (
        <MenuItem key={item.key} drawerOpen={drawerOpen} item={item} />
      ))}
    </>
  )
}

export default AdminMenu
