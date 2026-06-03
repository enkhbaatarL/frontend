import { Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'

export interface KpiCardProps {
  title: string
  content: string | ReactNode
  description: string
}

const KpiCard = ({ title, content, description }: KpiCardProps) => (
  <Stack bgcolor="gray.5" borderRadius="10px" padding="20px" flex={1} minWidth={0} minHeight="120px" boxSizing="border-box">
    <Stack gap="6px" minWidth={0}>
      <Typography color="contentText.Normal" fontSize="13px" fontWeight={600} lineHeight="1.4" noWrap title={title}>
        {title}
      </Typography>
      {typeof content === 'string' ? (
        <Typography color="contentText.Black" fontSize="16px" fontWeight={700} lineHeight="1.4" noWrap title={content}>
          {content}
        </Typography>
      ) : (
        content
      )}
      <Typography
        color="contentText.Normal"
        fontSize="12px"
        fontWeight={500}
        lineHeight="1.4"
        title={description}
        sx={{
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          wordBreak: 'break-word',
        }}
      >
        {description}
      </Typography>
    </Stack>
  </Stack>
)

export default KpiCard
