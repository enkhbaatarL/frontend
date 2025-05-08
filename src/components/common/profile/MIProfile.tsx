import { Box, Card, Stack, Typography } from '@mui/material'

import MIButton from '@/components/common/button/MIButton.tsx'
import MIChip from '@/components/common/chip/MIChip.tsx'
import BusinessOutlineIcon from '@/components/common/icons/BusinessOutlineIcon'
import CompanyOutlineIcon from '@/components/common/icons/CompanyOutlineIcon'
import EmailOutlineIcon from '@/components/common/icons/EmailOutlineIcon'

type MIProfileProps = {
  name: string
  role?: string
  buttonLabel?: string
  email: string
  company: string
  team: string
  onAlarmClick?: () => void
}

export default function MIProfile({ name, role, email, company, team, buttonLabel, onAlarmClick }: Readonly<MIProfileProps>) {
  return (
    <Card sx={{ boxShadow: 'none' }} className="profileCard">
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box>
          <Typography marginRight="8px" color="gray.90" variant="body1B16">
            {name}
          </Typography>
          {role && <MIChip variant="filled" label={role} color={role === 'Admin' ? 'blue' : 'orange'} size="h24" />}
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
        <Stack sx={{ textAlign: 'center' }} direction="row" spacing={1.5} alignItems="center">
          <MIButton width="100%" color="primary" onClick={onAlarmClick}>
            {buttonLabel}
          </MIButton>
        </Stack>
      )}
    </Card>
  )
}
