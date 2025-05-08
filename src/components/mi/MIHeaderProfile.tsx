import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { Typography } from '@mui/material'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import * as React from 'react'

import MIProfile from '@/components/common/profile/MIProfile.tsx'

const MIHeaderProfile = () => {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null)
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget)
  }
  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

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
        K
      </Box>
      <Typography sx={{ flexGrow: 1, display: { xs: 'none', md: 'inline-block' } }} marginLeft={2} variant="body2SB14" color="gray.70">
        Sena Kim
      </Typography>
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
        onClick={handleOpenUserMenu}
      >
        {anchorElUser ? (
          <KeyboardArrowUpIcon sx={{ color: 'gray.80' }} fontSize="small" />
        ) : (
          <KeyboardArrowDownIcon sx={{ color: 'gray.60' }} fontSize="small" />
        )}
      </Box>
      <Menu
        sx={{
          mt: '46px',
          '.MuiPaper-root': {
            borderRadius: 2,
          },
          '.MuiList-root': {
            border: '1px solid #DEE2E6',
            paddingTop: 2,
            paddingBottom: 2,
            borderRadius: 2,
          },
        }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        className="profileMenu"
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        <MIProfile
          name="홍길동"
          email="gildong.hong@sk.com"
          company="SK C&C"
          team="Market Intelligence팀"
          buttonLabel="알람 관리"
          onAlarmClick={() => {
            console.log('알람 관리 버튼 클릭됨')
          }}
        />
      </Menu>
    </Box>
  )
}

export default MIHeaderProfile
