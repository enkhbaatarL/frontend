import { Box, Grid2 as Grid, IconButton, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'

import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs'
import BackIcon from '@/components/common/icons/BackIcon'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useAdminPageInfo from '@/hooks/useAdminPageInfo'

const AdminHeader = () => {
  const navigate = useNavigate()
  const params = useParams()
  const { customComponent, subHeader, customTitle } = useAdminHeader()
  const { adminPageInfo } = useAdminPageInfo()

  const backPage = () => {
    if (adminPageInfo.parentPath) {
      let parentPath = adminPageInfo.parentPath
      Object.entries(params).forEach(([key, value]) => {
        parentPath = parentPath.replace(`:${key}`, value as string)
      })

      navigate(parentPath)
      return
    }

    navigate(-1)
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
            {customTitle ?? (
              <Typography color="gray.90" variant="heading2">
                {adminPageInfo.label}
              </Typography>
            )}
          </Box>
          {customComponent}
        </Grid>
      </Grid>
      {subHeader}
    </header>
  )
}

export default AdminHeader
