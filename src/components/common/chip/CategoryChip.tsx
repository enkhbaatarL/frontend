import { Box, Typography } from '@mui/material'

interface CategoryChipProps {
  name: string
  isActive?: boolean
  image?: string
  onClick?: () => void
  disabled?: boolean
}

const CategoryChip = ({ name, image, isActive = false, onClick, disabled = false }: CategoryChipProps) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  const getTextColor = () => {
    if (disabled) return '#868E96'
    if (isActive) return '#364FC7'
    return '#495057'
  }

  const getBackgroundColor = () => {
    if (isActive) return '#F4F6FF'
    return '#FFFFFF'
  }

  const getBorderColor = () => {
    if (isActive) return '#364FC7'
    return '#DEE2E6'
  }

  const getBorderWidth = () => {
    if (isActive) return '2px'
    return '1px'
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={0.75}
      padding="6px 10px 6px 8px"
      height={36}
      borderRadius="100px"
      sx={{
        backgroundColor: getBackgroundColor(),
        border: `${getBorderWidth()} solid ${getBorderColor()}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease-in-out',
        opacity: disabled ? 0.5 : 1,
        boxSizing: 'border-box',
        '&:hover':
          disabled || isActive
            ? {}
            : {
              backgroundColor: '#F4F6FF',
              borderColor: '#495057',
            },
      }}
      onClick={handleClick}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={24}
        height={24}
        borderRadius="50%"
        sx={{
          backgroundColor: '#E9ECEF',
          border: '0.4px solid #E9ECEF',
        }}
      >
        {image ? (
          <img src={image} alt={name} width={20} height={20} style={{ borderRadius: '50%' }} draggable={false} />
        ) : (
          <Typography variant="body2" color="gray.70" fontSize={12} fontWeight={500}>
            {name.charAt(0).toUpperCase()}
          </Typography>
        )}
      </Box>

      <Typography
        variant="body2"
        color={getTextColor()}
        sx={{
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1.1,
        }}
      >
        {name}
      </Typography>
    </Box>
  )
}

export default CategoryChip
