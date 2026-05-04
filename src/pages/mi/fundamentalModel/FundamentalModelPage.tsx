import { Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

const FundamentalModelPage = () => {
  const { t } = useTranslation()
  return (
    <Stack gap={1} margin="auto" maxWidth="1440px" padding="40px 72px" boxSizing="border-box">
      <Typography variant="heading3" color="gray.90">
        {t('miFundamentalModel.title')}
      </Typography>
      <Typography variant="body2M14" color="gray.60" sx={{ mt: 1 }}>
        {t('miMenuItem.fundamentalModel.desc')}
      </Typography>
    </Stack>
  )
}

export default FundamentalModelPage
