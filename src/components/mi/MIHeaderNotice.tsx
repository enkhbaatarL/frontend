import NotificationsIcon from '@mui/icons-material/Notifications'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Badge, Box, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material'
import Menu from '@mui/material/Menu'
import * as React from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIButton from '@/components/common/button/MIButton.tsx'
import MITabs from '@/components/common/tabs/MITabs.tsx'
import useMockNotice from '@/hooks/useMockNotice.tsx'

interface NoticeItemProps {
  id: number
  trend: 'up' | 'down'
  title: string
  subtitle: string
  date: string
  isRead: boolean
  onClick?: (id: number) => void
}
const NoticeItem = ({ id, trend, title, subtitle, date, isRead, onClick }: NoticeItemProps) => (
  <ListItem
    onClick={() => onClick?.(id)}
    sx={{
      padding: 5,
      position: 'relative',
      borderBottom: '1px solid #E9ECEF',
      width: 'auto',
      cursor: 'pointer',
      transition: 'all 0.15s linear',
      backgroundColor: isRead ? '#F8F9FA' : '#fff',
      '.MuiTypography-root': {
        transition: 'all 0.15s linear',
      },
      '&:hover': {
        backgroundColor: isRead ? '#F1F3F5' : '#F8F9FA',
        '.readText': {
          '.MuiTypography-root': {
            color: '#495057',
          },
        },
      },
    }}
  >
    <Box
      sx={{
        width: 6,
        marginRight: '18px',
      }}
    >
      {!isRead && (
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'error.main',
          }}
        />
      )}
    </Box>

    <ListItemAvatar
      sx={{
        marginRight: '12px',
        width: '34px',
        minWidth: 'unset',
        height: '34px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: trend === 'up' ? '#498B47' : '#CC4D50',
        backgroundColor: trend === 'up' ? 'rgba(73, 139, 71, 0.10)' : 'rgba(204, 77, 80, 0.10)',
      }}
    >
      {trend === 'up' ? <TrendingUpIcon fontSize={'small'} /> : <TrendingDownIcon fontSize={'small'} />}
    </ListItemAvatar>
    <ListItemText
      sx={{ margin: 0 }}
      className={isRead ? 'readText' : ''}
      primary={
        <Typography color={isRead ? 'gray.60' : 'gray.90'} variant="body2SB14" fontWeight={500}>
          {title}
        </Typography>
      }
      secondary={
        <Typography variant="body2R14" color={isRead ? 'gray.60' : 'gray.70'} component="div">
          <Typography variant="chip1" marginRight={1.5} color={isRead ? 'gray.60' : 'gray.70'} component="span">
            {trend === 'up' ? '상승' : '하락'}
          </Typography>
          {subtitle}
        </Typography>
      }
    />
    <Box sx={{ minHeight: '43px' }}>
      <Typography variant="body3R12" color="gray.60">
        {date}
      </Typography>
    </Box>
  </ListItem>
)
const MIHeaderNotice = () => {
  const [anchorElNotice, setAnchorElNotice] = React.useState<null | HTMLElement>(null)
  const handleOpenNoticeMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotice(event.currentTarget)
  }
  const handleCloseNoticeMenu = () => {
    setAnchorElNotice(null)
  }

  const tabsData = [
    {
      label: 'Recent Alerts',
      content: (
        <ScrollWrapper sx={{ margin: '0 -20px' }} maxHeight={638}>
          {useMockNotice(10).map((notice) => (
            <NoticeItem
              id={notice.id}
              key={notice.id}
              trend={notice.trend}
              title={notice.title}
              subtitle={notice.subtitle}
              date={notice.date}
              isRead={notice.isRead}
              onClick={(id) => console.log(id)}
            />
          ))}
        </ScrollWrapper>
      ),
    },
    {
      label: 'Notice',
      content: (
        <ScrollWrapper sx={{ margin: '0 -20px' }} maxHeight={638}>
          {useMockNotice(5).map((notice) => (
            <NoticeItem
              id={notice.id}
              key={notice.id}
              trend={notice.trend}
              title={notice.title}
              subtitle={notice.subtitle}
              date={notice.date}
              isRead={notice.isRead}
              onClick={(id) => console.log(id)}
            />
          ))}
        </ScrollWrapper>
      ),
    },
  ]

  return (
    <>
      <MIButton
        onClick={handleOpenNoticeMenu}
        color="gray"
        active={Boolean(anchorElNotice)}
        contentType={'icon'}
        size={'h28'}
        type={'ghost'}
      >
        <Badge className="BadgeDote" variant="dot" color="error">
          <NotificationsIcon />
        </Badge>
      </MIButton>
      <Menu
        sx={{
          mt: '42px',
          '.MuiPaper-root': {
            borderRadius: 1,
            overflowY: 'hidden',
            maxHeight: 'unset',
          },
          '.MuiList-root': {
            border: '1px solid #DEE2E6',
            padding: 5,
            paddingBottom: 0,
            borderRadius: 1,
            width: '450px',
            '.MuiListItem-root:last-child': {
              border: 0,
            },
            '@media(max-width: 767px)': {
              width: '300px',
            },
          },
        }}
        anchorEl={anchorElNotice}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        className="profileMenu"
        open={Boolean(anchorElNotice)}
        onClose={handleCloseNoticeMenu}
      >
        <MITabs widthItem={'50%'} isNotice arrayItem={tabsData} />
      </Menu>
    </>
  )
}

export default MIHeaderNotice
