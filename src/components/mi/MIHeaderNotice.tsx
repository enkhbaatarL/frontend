import NotificationsIcon from '@mui/icons-material/Notifications'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Badge, Box, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useState, MouseEvent as ReactMouseEvent, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIButton from '@/components/common/button/MIButton'
import NoticeIcon from '@/components/common/icons/NoticeIcon'
import MITabs from '@/components/common/tabs/MITabs'
import useMockNotice from '@/hooks/useMockNotice'
import boardService, { INoticeInfo } from '@/service/mi/board'
import useAuthStore from '@/store/useAuthStore.ts'

interface NoticeItemProps {
  id: number
  trend: 'up' | 'down'
  title: string
  subtitle: string
  date: string
  isRead: boolean
  onClick?: (id: number) => void
}
const AlertItem = ({ id, trend, title, subtitle, date, isRead, onClick }: NoticeItemProps) => (
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

const NoticeItem = ({ id, title, subtitle, date, isRead, onClick }: NoticeItemProps) => (
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
        color: isRead ? '#868E96' : '#2E3F5E',
        backgroundColor: 'rgba(46, 63, 94, 0.05)',
      }}
    >
      <NoticeIcon fontSize={'small'} />
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
  const navigate = useNavigate()
  const [anchorElNotice, setAnchorElNotice] = useState<null | HTMLElement>(null)
  const [notices, setNotices] = useState<INoticeInfo[]>([])
  const [isLoadingNotices, setIsLoadingNotices] = useState(false)
  const { accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const handleOpenNoticeMenu = (event: ReactMouseEvent<HTMLElement>) => {
    setAnchorElNotice(event.currentTarget)
  }

  const handleCloseNoticeMenu = () => {
    setAnchorElNotice(null)
  }
  const anchorEl = useRef<HTMLElement>(null)

  // 공지사항 데이터 로드
  useEffect(() => {
    const fetchNotices = async () => {
      if (anchorElNotice) {
        try {
          setIsLoadingNotices(true)
          const response = await boardService.getNotice({ customerCompanyNo })
          if (response.detail) {
            setNotices(response.detail)
          }
        } catch (error) {
          console.error('Failed to fetch notices:', error)
        } finally {
          setIsLoadingNotices(false)
        }
      }
    }

    fetchNotices()
  }, [anchorElNotice, customerCompanyNo])

  const handleNoticeClick = (noticeNo: number) => {
    navigate(`/mi/notices/${noticeNo}`)
    handleCloseNoticeMenu()
  }

  const tabsData = [
    {
      label: 'Recent Alerts',
      content: (
        <>
          <ScrollWrapper sx={{ margin: '0 -20px' }} maxHeight={556}>
            {useMockNotice(10).map((notice) => (
              <AlertItem
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
          <Box sx={{ margin: '0 -20px' }} borderTop={'1px solid #E9ECEF'} p={5}>
            <MIButton width={'100%'} color={'gray'} type={'outlined'} contentType={'text'} size={'h42'}>
              Manage My Alerts
            </MIButton>
          </Box>
        </>
      ),
    },
    {
      label: 'Notice',
      content: (
        <>
          <ScrollWrapper sx={{ margin: '0 -20px' }} maxHeight={638}>
            {isLoadingNotices ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={5}>
                <Typography variant="body2R14" color="gray.60">
                  Loading...
                </Typography>
              </Box>
            ) : notices.length > 0 ? (
              notices.map((notice) => (
                <NoticeItem
                  id={notice.bulletinNo}
                  key={notice.bulletinNo}
                  trend={'down'} // API에서 trend 정보가 없으므로 기본값 사용
                  title={notice.bulletinTitleName}
                  subtitle={notice.bulletinCategorySeparateCode}
                  date={dayjs(notice.auditInfo?.createDt).format('YYYY-MM-DD HH:mm')}
                  isRead={notice.isRead} // 읽음 상태 정보가 없으므로 기본값 사용
                  onClick={handleNoticeClick}
                />
              ))
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" p={5}>
                <Typography variant="body2R14" color="gray.60">
                  공지사항이 없습니다.
                </Typography>
              </Box>
            )}
          </ScrollWrapper>
          <Box sx={{ margin: '0 -20px' }} borderTop={'1px solid #E9ECEF'} p={5}>
            <MIButton
              onClick={(e) => {
                e.preventDefault()
                navigate('/mi/notices')
                handleCloseNoticeMenu()
              }}
              width={'100%'}
              color={'gray'}
              type={'outlined'}
              contentType={'text'}
              size={'h42'}
            >
              More
            </MIButton>
          </Box>
        </>
      ),
    },
  ]

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (anchorEl.current && !anchorEl.current.contains(event.target as Node)) {
        setAnchorElNotice(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <Box position={'relative'} ref={anchorEl}>
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
      {Boolean(anchorElNotice) && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            right: 0,
            mt: '12px',
            zIndex: 10,
            border: '1px solid #DEE2E6',
            boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
            padding: '20px 20px 0 20px',
            backgroundColor: '#fff',
            width: '450px',
          }}
        >
          <MITabs widthItem={'50%'} isNotice arrayItem={tabsData} />
        </Box>
      )}
    </Box>
  )
}

export default MIHeaderNotice
