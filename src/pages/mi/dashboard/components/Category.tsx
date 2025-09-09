import { Box, Typography } from '@mui/material'
import { useState } from 'react'

import crudeOilImg from '@/assets/dashboard/category/crude-oil.png'
import dramImg from '@/assets/dashboard/category/dram.png'
import lngImg from '@/assets/dashboard/category/lng.png'
import batteryImg from '@/assets/dashboard/newsFeed/battery.png'

interface CategoryProps {
  onCategoryChange?: (category: string) => void
}

const categories = [
  { key: 'crudeOil', label: 'Crude Oil', image: crudeOilImg },
  { key: 'lng', label: 'LNG', image: lngImg },
  { key: 'dram', label: 'DRAM', image: dramImg },
  { key: 'battery', label: 'Battery', image: batteryImg },
]

const Category = ({ onCategoryChange }: CategoryProps) => {
  const [selectedCategory, setSelectedCategory] = useState('crudeOil')

  const handleCategoryClick = (categoryKey: string) => {
    setSelectedCategory(categoryKey)
    onCategoryChange?.(categoryKey)
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      gap="6px"
      borderRadius="100px"
      padding="6px"
      sx={{
        backgroundColor: '#E9ECEF',
        userSelect: 'none',
      }}
    >
      {categories.map((item) => {
        const isSelected = selectedCategory === item.key

        return (
          <Box
            key={item.key}
            display="flex"
            alignItems="center"
            borderRadius="100px"
            padding={isSelected ? '0 12px' : '0 6px'}
            height="36px"
            sx={{
              backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
              boxShadow: isSelected ? '0px 0px 6px 0px rgba(0, 0, 0, 0.15)' : 'none',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            onClick={() => handleCategoryClick(item.key)}
          >
            <Box display="flex" justifyContent="center" alignItems="center" width="36px" height="36px" draggable={false}>
              <img
                src={item.image}
                alt={item.label}
                width={36}
                height={36}
                style={{
                  objectFit: 'cover',
                  borderRadius: '4px',
                }}
                draggable={false}
              />
            </Box>
            <Box
              pr={isSelected ? '6px' : '0'}
              sx={{
                width: isSelected ? 'auto' : 0,
                opacity: isSelected ? 1 : 0,
                transitionProperty: 'width, opacity',
                transitionDuration: isSelected ? '0.3s' : '0s',
                transitionTimingFunction: 'ease-in-out',
                pointerEvents: isSelected ? 'auto' : 'none',
              }}
            >
              <Typography
                fontSize="14px"
                fontWeight={600}
                color="#495057"
                fontFamily="Pretendard"
                lineHeight={1.1}
                textAlign="center"
                whiteSpace="nowrap"
                sx={{
                  transition: 'opacity 0.2s ease-in-out',
                  opacity: isSelected ? 1 : 0,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default Category
