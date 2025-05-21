import { Box, Card, Stack, Typography } from '@mui/material'
import { t } from 'i18next'

import MIButton from '@/components/common/button/MIButton'
import MIChip from '@/components/common/chip/MIChip'
import ArrowRight from '@/components/common/icons/ArrowRight'
import BusinessOutlineIcon from '@/components/common/icons/BusinessOutlineIcon'
import CompanyOutlineIcon from '@/components/common/icons/CompanyOutlineIcon'
import EmailOutlineIcon from '@/components/common/icons/EmailOutlineIcon'
import { UserRole } from '@/service/admin/members'

type MIProfileProps = {
  name: string
  role?: UserRole
  buttonLabel?: string
  email: string
  company: string
  team: string
  onButtonClick?: () => void
}

const MIProfile = ({ name, role, email, company, team, buttonLabel, onButtonClick }: Readonly<MIProfileProps>) => (
  <Card sx={{ boxShadow: 'none' }} className="profileCard">
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box>
        <Typography marginRight="8px" color="gray.90" variant="body1B16">
          {name}
        </Typography>
        {role && (
          <MIChip
            variant="filled"
            label={role === UserRole.ADMIN ? 'Admin' : t('운영자')}
            color={role === UserRole.ADMIN ? 'blue' : 'orange'}
            size="h24"
          />
        )}
      </Box>
    </Stack>
    <Stack gap={1.5}>
      <Stack direction="row" alignItems="center">
        <Box
          sx={{
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          width={22}
          height={22}
          padding={1}
        >
          <EmailOutlineIcon />
        </Box>
        <Typography paddingLeft={2} color="gray.70" variant="body3">
          {email}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center">
        <Box
          sx={{
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          width={22}
          height={22}
          padding={1}
        >
          <CompanyOutlineIcon />
        </Box>
        <Typography paddingLeft={2} color="gray.70" variant="body3">
          {company}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center">
        <Box
          sx={{
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          width={22}
          height={22}
          padding={1}
        >
          <BusinessOutlineIcon />
        </Box>
        <Typography paddingLeft={2} color="gray.70" variant="body3">
          {team}
        </Typography>
      </Stack>
    </Stack>
    {buttonLabel && (
      <Stack sx={{ textAlign: 'center', justifyContent: 'center' }} direction="row" spacing={1.5} alignItems="center">
        <MIButton width="220px" color="gray" type="outlined" size="h34" onClick={onButtonClick} endIcon={<ArrowRight />}>
          {buttonLabel}
        </MIButton>
      </Stack>
    )}
  </Card>
)

export default MIProfile
