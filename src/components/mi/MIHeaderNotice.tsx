import NotificationsIcon from '@mui/icons-material/Notifications'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Badge, Box, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIButton from '@/components/common/button/MIButton'
import NoticeIcon from '@/components/common/icons/NoticeIcon'
import MITabs from '@/components/common/tabs/MITabs'
import { getNextGenMIEventDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import { UserRole } from '@/service/admin/members'
import boardService, { INoticeInfo } from '@/service/mi/board'
import notificationService, { IBellNotification } from '@/service/mi/notification'
import useAuthStore from '@/store/useAuthStore'

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
        <Typography
          color={isRead ? 'gray.60' : 'gray.90'}
          variant="body2SB14"
          fontWeight={500}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '280px',
            '& > span': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        >
          <span>{title}</span>
        </Typography>
      }
      secondary={
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Typography variant="body2R14" color={isRead ? 'gray.60' : 'gray.70'} component="span">
            <Typography variant="chip1" marginRight={1.5} color={isRead ? 'gray.60' : 'gray.70'} component="span">
              {trend === 'up' ? '상승' : '하락'}
            </Typography>
            {subtitle}
          </Typography>
          <Typography variant="body3R12" color="gray.60" component="span">
            {date}
          </Typography>
        </span>
      }
    />
  </ListItem>
)

const highlightKeywordInAlert = (text: string, keyword: string, isRead: boolean) => {
  const index = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (index < 0) return text
  const matched = text.slice(index, index + keyword.length)

  return (
    <>
      {text.slice(0, index)}
      <Typography component="span" variant="body2R14" color={isRead ? 'gray.60' : 'mari.Primary'}>
        {matched}
      </Typography>
      {text.slice(index + keyword.length)}
    </>
  )
}

const KeywordAlertItem = ({
  keywordName,
  eventName,
  date,
  isRead,
  onClick,
}: {
  keywordName: string
  eventName: string
  date: string
  isRead: boolean
  onClick: () => void
}) => (
  <ListItem
    onClick={onClick}
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
    }}
  >
    <Box sx={{ width: 6, marginRight: '18px' }}>
      {!isRead && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />}
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
        color: 'contentIcon.ActivePrimary',
        backgroundColor: 'commonColor.Primarylight1',
        fontWeight: 700,
      }}
    >
      #
    </ListItemAvatar>
    <ListItemText
      sx={{ margin: 0 }}
      primary={
        <Typography color={isRead ? 'gray.60' : 'gray.90'} variant="body2SB14" noWrap>
          {`키워드 알림 · ${keywordName}`}
        </Typography>
      }
      secondary={
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
          <Typography variant="body2R14" color={isRead ? 'gray.60' : 'gray.70'} component="span" noWrap>
            {highlightKeywordInAlert(eventName, keywordName, isRead)}
          </Typography>
          <Typography variant="body3R12" color="gray.60" component="span" sx={{ flexShrink: 0 }}>
            {date}
          </Typography>
        </span>
      }
    />
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
        <Typography
          color={isRead ? 'gray.60' : 'gray.90'}
          variant="body2SB14"
          fontWeight={500}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '280px',
            '& > span': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        >
          <span>{title}</span>
        </Typography>
      }
      secondary={
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Typography variant="body2R14" color={isRead ? 'gray.60' : 'gray.70'} component="span">
            {subtitle}
          </Typography>
          <Typography variant="body3R12" color="gray.60" component="span">
            {date}
          </Typography>
        </span>
      }
    />
  </ListItem>
)

const MIHeaderNotice = () => {
  const navigate = useNavigate()
  const [isNoticeMenuOpen, setIsNoticeMenuOpen] = useState(false)
  const [notices, setNotices] = useState<INoticeInfo[]>([])
  const [isLoadingNotices, setIsLoadingNotices] = useState(false)
  const [alerts, setAlerts] = useState<IBellNotification[]>([])
  const [alertsIsLoading, setAlertsIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const { data: filterOptions } = useQuery({
    queryKey: ['getNoticeFilter'],
    queryFn: async () => await boardService.getNoticeFilter(),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 읽지 않은 알림이나 공지사항이 있는지 확인
  const hasUnreadItems = useMemo(() => {
    const hasUnreadNotices = notices.some((notice) => !notice.isRead)
    return hasUnreadNotices || unreadCount > 0
  }, [notices, unreadCount])

  const handleToggleNoticeMenu = () => {
    if (isNoticeMenuOpen) {
      setIsNoticeMenuOpen(false)
    } else {
      setIsNoticeMenuOpen(true)
    }
  }

  const handleCloseNoticeMenu = () => {
    setIsNoticeMenuOpen(false)
  }

  const anchorEl = useRef<HTMLElement>(null)

  const fetchAlerts = useCallback(async () => {
    if (user?.userRoleCd !== UserRole.USER) return

    try {
      setAlertsIsLoading(true)
      const response = await notificationService.getBellNotifications({ page: 1, size: 10 })
      setAlerts(response.detail ?? [])
    } catch {
      return
    } finally {
      setAlertsIsLoading(false)
    }
  }, [user?.userRoleCd])

  const fetchUnreadCount = useCallback(async () => {
    if (user?.userRoleCd !== UserRole.USER) {
      setUnreadCount(0)
      return
    }

    try {
      const response = await notificationService.getBellNotificationUnreadCount()
      setUnreadCount(response.unreadCount ?? 0)
    } catch {
      return
    }
  }, [user?.userRoleCd])

  useEffect(() => {
    const fetchNotices = async () => {
      if (customerCompanyNo) {
        try {
          setIsLoadingNotices(true)
          const response = await boardService.getNotice({ customerCompanyNo })
          if (response.detail) {
            setNotices(response.detail)
          }
        } catch {
          return
        } finally {
          setIsLoadingNotices(false)
        }
      }
    }

    fetchNotices()
  }, [customerCompanyNo])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    if (!isNoticeMenuOpen) return
    fetchAlerts()
    fetchUnreadCount()
  }, [isNoticeMenuOpen, fetchAlerts, fetchUnreadCount])

  const handleNoticeClick = (noticeNo: number) => {
    navigate(`/mi/notices/${noticeNo}`)
    handleCloseNoticeMenu()
  }

  const handleNotificationClick = () => {
    navigate('/mi/notifications')
    handleCloseNoticeMenu()
  }

  const handleBellItemClick = async (alert: IBellNotification) => {
    const response = await notificationService.readBellNotification(alert.notificationType, alert.notificationId)

    if (response.notificationType === 'EVENT_KEYWORD' && response.eventKeyword) {
      navigate(getNextGenMIEventDetailPath(String(response.eventKeyword.eventId)))
    } else if (response.goodsThreshold) {
      navigate(`/mi/data-detail/${response.goodsThreshold.goodsNo}/${response.goodsThreshold.goodsDataNo}`, {
        state: { goodsDataSrcNo: response.goodsThreshold.goodsDataSourceNo },
        replace: true,
      })
    }

    handleCloseNoticeMenu()
    await Promise.all([fetchAlerts(), fetchUnreadCount()])
  }

  const tabsData = [
    {
      label: 'Recent Alerts',
      content: (
        <>
          <ScrollWrapper sx={{ margin: '0 -20px' }} maxHeight={556}>
            {alertsIsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={5} height={400}>
                <Typography variant="body2R14" color="gray.60">
                  Loading...
                </Typography>
              </Box>
            ) : alerts.length > 0 ? (
              alerts.map((alert) =>
                alert.notificationType === 'EVENT_KEYWORD' && alert.eventKeyword ? (
                  <KeywordAlertItem
                    key={`${alert.notificationType}-${alert.notificationId}`}
                    keywordName={alert.eventKeyword.keywordName}
                    eventName={alert.eventKeyword.eventName}
                    date={dayjs(alert.notifiedAt).format('YYYY-MM-DD')}
                    isRead={alert.isRead}
                    onClick={() => handleBellItemClick(alert)}
                  />
                ) : alert.goodsThreshold ? (
                  <AlertItem
                    id={alert.notificationId}
                    key={`${alert.notificationType}-${alert.notificationId}`}
                    trend={['INCRATE', 'UPPER'].includes(alert.goodsThreshold.notificationCriticalValueSeparateCd) ? 'up' : 'down'}
                    title={alert.goodsThreshold.goodsDataSourceNm}
                    subtitle={alert.goodsThreshold.criticalValueSettingVol
                      .toString()
                      .concat(alert.goodsThreshold.criticalValueSettingUnitNm || '')}
                    date={dayjs(alert.notifiedAt).format('YYYY-MM-DD')}
                    isRead={alert.isRead}
                    onClick={() => handleBellItemClick(alert)}
                  />
                ) : null,
              )
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" p={5} height={400}>
                <Typography variant="body2R14" color="gray.60">
                  No results found
                </Typography>
              </Box>
            )}
          </ScrollWrapper>
          <Box sx={{ margin: '0 -20px' }} borderTop={'1px solid #E9ECEF'} p={5}>
            <MIButton
              disabled={user?.userRoleCd !== UserRole.USER}
              width={'100%'}
              color={'gray'}
              type={'outlined'}
              contentType={'text'}
              size={'h42'}
              onClick={handleNotificationClick}
            >
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
              <Box display="flex" justifyContent="center" alignItems="center" p={5} height={400}>
                <Typography variant="body2R14" color="gray.60">
                  Loading...
                </Typography>
              </Box>
            ) : notices.length > 0 ? (
              notices.map((notice) => (
                <NoticeItem
                  id={notice.bulletinNo}
                  key={notice.bulletinNo}
                  trend={'down'} // 미사용
                  title={notice.bulletinTitleName}
                  subtitle={
                    filterOptions?.category.find((item) => item.key === notice.bulletinCategorySeparateCode)?.value ??
                    notice.bulletinCategorySeparateCode
                  }
                  date={dayjs(notice.createDt).format('YYYY-MM-DD')}
                  isRead={notice.isRead}
                  onClick={handleNoticeClick}
                />
              ))
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" p={5} height={400}>
                <Typography variant="body2R14" color="gray.60">
                  No results found
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
        setIsNoticeMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <Box position={'relative'} ref={anchorEl}>
      <MIButton onClick={handleToggleNoticeMenu} color="gray" active={isNoticeMenuOpen} contentType={'icon'} size={'h28'} type={'ghost'}>
        {hasUnreadItems ? (
          <Badge className="BadgeDote" variant="dot" color="error">
            <NotificationsIcon />
          </Badge>
        ) : (
          <NotificationsIcon />
        )}
      </MIButton>
      {isNoticeMenuOpen && (
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
