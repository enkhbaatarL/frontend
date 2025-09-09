import { Box, Typography } from '@mui/material'

interface NewsFeedCategoryProps {
  label: string
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  image?: string
}

const NewsFeedCategory = ({ label, image, selected = false, onClick, disabled = false }: NewsFeedCategoryProps) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  const getTextColor = () => {
    if (disabled) return '#868E96'
    if (selected) return '#364FC7'
    return '#212529'
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="start"
      alignItems="center"
      width="70px"
      height="auto"
      borderRadius="5px"
      gap="2px"
      sx={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease-in-out',
        opacity: disabled ? 0.5 : 1,
        '&:hover':
          disabled || selected
            ? {}
            : {
              '& .category-thumbnail': {
                backgroundColor: '#F4F6FF',
                borderColor: '#495057',
              },
              '& .category-text': {
                color: '#000000',
              },
            },
      }}
      onClick={handleClick}
    >
      <Box
        className="category-thumbnail"
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="62px"
        height="62px"
        borderRadius="1000px"
        sx={{
          border: selected ? '2px solid #364FC7' : '1px solid #E9ECEF',
          backgroundColor: selected ? '#F4F6FF' : '#FFFFFF',
          boxSizing: 'border-box',
        }}
      >
        <img src={image} alt={label} width={60} draggable={false} />
      </Box>
      <Box display="flex" justifyContent="center" alignItems="center" width="100%" padding="4px 16px" gap="8px">
        <Typography
          className="category-text"
          fontFamily="Pretendard"
          fontSize="14px"
          lineHeight="1.1em"
          textAlign="center"
          color={getTextColor()}
          fontWeight={selected ? 700 : 500}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  )
}

export default NewsFeedCategory
