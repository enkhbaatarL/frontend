import { Stack, Typography } from '@mui/material'

const ScenarioDesignStatusBadge = () => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="center"
    gap="4px"
    minWidth="42px"
    height="24px"
    padding="0px 8px"
    bgcolor="#E7F3FF"
    borderRadius="10px"
    boxSizing="border-box"
    flexShrink={0}
    sx={{
      userSelect: 'none',
    }}
  >
    <Stack
      component="span"
      alignItems="center"
      justifyContent="center"
      width="8px"
      height="8px"
      flexShrink={0}
      aria-hidden
      sx={{
        '&::before': {
          content: '""',
          display: 'block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'mari.Primary',
          transform: 'scale(0.5)',
          animation: 'scenarioDesignStatusDotBreath 4s ease-in-out infinite, breathe 4s linear infinite 0.4s',
        },
        '@keyframes scenarioDesignStatusDotBreath': {
          '0%, 100%': {
            transform: 'scale(0.5)',
          },
          '15%, 85%': {
            transform: 'scale(0.8)',
          },
        },
        '@keyframes breathe': {
          '0%, 100%': {
            boxShadow: '0 0 0 3px rgba(188, 237, 243, 0.5)',
          },
          '35%, 75%': {
            boxShadow: '0 0 0 0px rgba(188, 237, 243, 0.0)',
          },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '&::before': {
            animation: 'none',
            transform: 'scale(0.8)',
          },
        },
      }}
    />
    <Typography variant="body3SB12" color="mari.Primary" lineHeight={1.4} noWrap>
      진행중
    </Typography>
  </Stack>
)

export default ScenarioDesignStatusBadge
