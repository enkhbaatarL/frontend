import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { Typography } from '@mui/material'
import Box from '@mui/material/Box'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIProfile from '@/components/common/profile/MIProfile'
import authService from '@/service/common/auth.ts'
import useAuthStore from '@/store/useAuthStore'

const MIHeaderProfile = () => {
  const { user, token } = useAuthStore()
  const navigate = useNavigate()

  const [anchorElUser, setAnchorElUser] = useState(false)
  const anchorEl = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (anchorEl.current && !anchorEl.current.contains(event.target as Node)) {
        setAnchorElUser(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <Box sx={{ py: 0, px: 0, display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          width: { xs: 25, md: 28 },
          height: { xs: 25, md: 28 },
          borderRadius: 50,
          backgroundColor: '#8C9F60',
          fontWeight: 600,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}
      >
        {(user?.userNm ?? '')[0]}
      </Box>
      <Typography sx={{ flexGrow: 1, display: { xs: 'none', md: 'inline-block' } }} marginLeft={2} variant="body2SB14" color="gray.70">
        {user?.userNm}
      </Typography>
      <Box ref={anchorEl} sx={{ position: 'relative' }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '11px',
            cursor: 'pointer',
            backgroundColor: anchorElUser ? '#F0F3F6' : 'transparent',
            '&:hover': {
              backgroundColor: '#F0F3F6',
            },
          }}
          onClick={() => setAnchorElUser(!anchorElUser)}
        >
          {anchorElUser ? (
            <KeyboardArrowUpIcon sx={{ color: 'gray.80' }} fontSize="small" />
          ) : (
            <KeyboardArrowDownIcon sx={{ color: 'gray.60' }} fontSize="small" />
          )}
        </Box>
        {anchorElUser && (
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
              padding: '8px 0',
              backgroundColor: '#fff',
            }}
            className="profileMenu"
          >
            <MIProfile
              name={user?.userNm ?? ''}
              email={user?.userLoginId ?? ''}
              company={user?.companyNm ?? ''}
              team={user?.departmentNm ?? ''}
              role={user?.isOtherServiceAccessPossible ? user?.userRoleCd : undefined}
              buttonLabel={user?.isOtherServiceAccessPossible ? '어드민 페이지' : undefined}
              onButtonClick={async () => {
                if (token) {
                  await authService.getAdminAccessCheck(token)
                  navigate('/admin')
                }
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default MIHeaderProfile
