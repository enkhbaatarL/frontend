import { Box, Grid2 as Grid, IconButton, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import BackIcon from '../common/icons/BackIcon'

import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useAdminPageInfo from '@/hooks/useAdminPageInfo'

const AdminHeader = () => {
  const navigate = useNavigate()
  const { customComponent } = useAdminHeader()
  const { adminPageInfo } = useAdminPageInfo()
  const backPage = () => {
    navigate(-1)
    // TODO: 상위 페이지로 이동하는 로직 추가
  }

  return (
    <header className="full-width">
      <Grid
        container
        direction="column"
        sx={{
          px: 6,
          pt: 5,
          pb: 2.5,
          borderBottom: '1px solid',
          borderColor: 'gray.30',
          bgColor: 'white',
        }}
      >
        <AdminBreadcrumbs />
        <Grid paddingTop={5} paddingBottom={2.5} container alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems={'center'} columnGap="10px">
            {adminPageInfo.hasBack && (
              <IconButton aria-label="close" onClick={backPage} sx={{ padding: '6px' }}>
                <BackIcon />
              </IconButton>
            )}

            <Typography color="gray.90" variant="heading2">
              {adminPageInfo.label}
            </Typography>
          </Box>

          {customComponent}
        </Grid>
      </Grid>
    </header>
  )
}

export default AdminHeader
