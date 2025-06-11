import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Divider, Tooltip, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import VisibilityIcon from '@/components/common/icons/VisibilityIcon'
import VisibilityOffIcon from '@/components/common/icons/VisibilityOffIcon'
import theme from '@/theming'

export interface GoodsInfo {
  goodsNo: number
  goodsDataNo: number
  goodsDataName: string
  goodsDataSourceNo: number
  goodsDataSourceName: string
}

export default function MIChartViewToggleAndLinkDetail(
  props: Readonly<{
    goodsInfo: GoodsInfo
    color?: string
    value?: boolean
    isShow: boolean
    onChange?: (state: { label: string; isShow: boolean }) => void
    maxWidth?: number
  }>,
) {
  const navigate = useNavigate()

  const toggle = () => {
    const newIsShow = !props.isShow
    props.onChange?.({
      label: props.goodsInfo.goodsDataSourceName,
      isShow: newIsShow,
    })
  }

  return (
    <Box
      display={'flex'}
      alignItems={'center'}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': {
          '& svg': {
            color: `${theme.palette.gray[70]}`,
          },
        },
      }}
    >
      <Box
        padding="0 6px 0 2px"
        sx={{
          '& svg': { display: 'block' },
        }}
        onClick={toggle}
      >
        {props.isShow ? (
          <VisibilityIcon width={20} height={20} color={theme.palette.gray[60]} />
        ) : (
          <VisibilityOffIcon width={20} height={20} color={theme.palette.gray[60]} />
        )}
      </Box>
      <Divider
        orientation="vertical"
        variant="middle"
        component="div"
        sx={{
          width: '1px',
          height: 18,
          margin: '2px',
        }}
      />
      <Tooltip
        title={`${props.goodsInfo.goodsDataName} • ${props.goodsInfo.goodsDataSourceName}`}
        placement="right-end"
        disableInteractive
        followCursor
      >
        <Box
          display={'flex'}
          alignItems={'center'}
          height={'100%'}
          pl={'8px'}
          onClick={() => {
            navigate(`/mi/data-detail/${props.goodsInfo.goodsNo}/${props.goodsInfo.goodsDataNo}`, {
              state: { goodsDataSrcNo: props.goodsInfo.goodsDataSourceNo },
            })
          }}
        >
          {props.color && (
            <Box
              mr={'8px'}
              width={'11px'}
              height={'11px'}
              bgcolor={props.color}
              borderRadius={'3px'}
              sx={{
                opacity: props.isShow ? 1 : 0.3,
              }}
            />
          )}
          <Typography
            mt={'1px'}
            variant="body3M12"
            color={props.isShow ? 'gray.70' : 'gray.50'}
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: props.maxWidth ? `${props.maxWidth}px` : '152px',
            }}
          >
            {props.goodsInfo.goodsDataSourceName}
          </Typography>
          <Box
            ml={'2px'}
            mr={'-4px'}
            display={'flex'}
            alignItems={'center'}
            color={props.isShow ? 'gray.70' : 'gray.50'}
            sx={{
              '&:hover': {
                '& svg': {
                  color: 'inherit',
                },
              },
            }}
          >
            <ChevronRightIcon fontSize={'small'} style={{ color: theme.palette.gray[60] }} />
          </Box>
        </Box>
      </Tooltip>
    </Box>
  )
}
