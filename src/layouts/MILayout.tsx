import { Box } from '@mui/material'
import { Grid2 as Grid, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import AdminConfirm from '@/components/admin/AdminConfirm.tsx'
import MIFooter from '@/components/mi/MIFooter'
import MIHeaderMainLayout from '@/components/mi/MIHeaderMainLayout'
import MIProvider from '@/providers/MIProvider'
import boardService, { INoticeDetailInfo, INoticeInfo } from '@/service/mi/board.ts'

const MILayout = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showNoticePopup, setShowNoticePopup] = useState(false)
  const [noticeData, setNoticeData] = useState<INoticeInfo | null>(null)
  const [noticeDetailData, setNoticeDetailData] = useState<INoticeDetailInfo | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const portalOpen = document.querySelector('[role="menu"], [role="listbox"]')

      document.body.classList.toggle('mui-list-open', !!portalOpen)
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  // getNotice 호출하여 공지사항 데이터 가져오기
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await boardService.getNotice({
          page: 1,
          size: 1,
          // 팝업으로 표시할 공지사항 필터 추가 가능
          // status: 'published',
          // target: 'popup'
        })

        if (response.detail && response.detail.length > 0) {
          const latestNotice = response.detail[0]
          setNoticeData(latestNotice)

          // 로컬스토리지를 확인하여 오늘 하루 보지 않기를 선택했는지 확인
          const todayDontShow = localStorage.getItem(`notice_dont_show_${latestNotice.bulletinNo}`)
          const today = new Date().toDateString()

          if (!todayDontShow || todayDontShow !== today) {
            // 상세 정보도 가져오기
            const detailResponse = await boardService.getNoticeDetail(latestNotice.bulletinNo)
            setNoticeDetailData(detailResponse)
            setShowNoticePopup(true)
          }
        }
      } catch (error) {
        console.error('Failed to fetch notice:', error)
      }
    }

    fetchNotice()
  }, [])

  const handleDontShowToday = () => {
    if (noticeData) {
      const today = new Date().toDateString()
      localStorage.setItem(`notice_dont_show_${noticeData.bulletinNo}`, today)
    }
    setShowNoticePopup(false)
  }

  const handleClose = () => {
    setShowNoticePopup(false)
  }

  return (
    <MIProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div className={`main-header ${isScrolled ? 'fixed-header' : ''}`}>
          <MIHeaderMainLayout />
        </div>
        <Box
          sx={{
            paddingTop: '106px',
            flex: 1,
            '@media(max-width: 600px)': {
              paddingTop: '90px',
            },
          }}
        >
          <Outlet />
        </Box>

        <MIFooter />

        {/* 공지사항 팝업 */}
        {noticeData && noticeDetailData && (
          <AdminConfirm
            open={showNoticePopup}
            title={noticeDetailData.bulletinTitleNm}
            width={800}
            handleClose={handleClose}
            actions={[
              {
                label: '오늘 하루 보지 않기',
                variant: 'outlined',
                color: 'gray',
                onClick: handleDontShowToday,
              },
              {
                label: '닫기',
                variant: 'filled',
                color: 'primary',
                onClick: handleClose,
              },
            ]}
          >
            {noticeDetailData.fileUrl && <img style={{ display: 'block' }} width="100%" src={noticeDetailData.fileUrl} alt="" />}
            <Grid direction="column" paddingY={5} gap={4} container>
              <Typography variant="body3R14" component="div" color="gray.90">
                {noticeDetailData.bulletinCntt}
              </Typography>
            </Grid>
          </AdminConfirm>
        )}
      </div>
    </MIProvider>
  )
}

export default MILayout
