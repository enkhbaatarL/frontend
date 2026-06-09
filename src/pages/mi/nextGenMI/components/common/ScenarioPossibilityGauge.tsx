import { Box, Stack } from '@mui/material'

import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import { FILLED_BARS_TO_LABEL, probabilityToFilledBars } from '@/pages/mi/nextGenMI/utils/probabilityFormatting'

type ScenarioPossibilityGaugeProps = {
  /** 발생 확률 (0~100 정수) */
  probability: number
  /** 배경 hover 영역과 패딩 숨김 여부 */
  hideBackground?: boolean
}

/** 발생가능성 게이지 — 6x6 사각 5개 (채움/빈칸), 36px justify-between */
const ScenarioPossibilityGauge = ({ probability, hideBackground = false }: ScenarioPossibilityGaugeProps) => {
  const filledBars = probabilityToFilledBars(probability / 100)

  return (
    <NextGenMIFollowCursorTooltip
      title={
        <Box component="p" m={0} fontSize="12px" lineHeight={1.4} color="common.white">
          발생가능성: {FILLED_BARS_TO_LABEL[filledBars]}
        </Box>
      }
    >
      <Stack
        direction="row"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="10px"
        padding={hideBackground ? '0px' : '12px'}
        boxSizing="border-box"
        sx={
          hideBackground
            ? undefined
            : {
              transition: 'background-color 120ms ease',
              '&:hover': {
                bgcolor: 'gray.5',
              },
            }
        }
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" width="36px" height="6px">
          {[0, 1, 2, 3, 4].map((index) => (
            <Box
              key={index}
              width="6px"
              height="6px"
              borderRadius="2px"
              // 디자인 고유색 (테마 토큰 없음): 채움 핑크 / 빈칸 연하늘
              bgcolor={index < filledBars ? '#ef1b88' : '#bad1d7'}
            />
          ))}
        </Stack>
      </Stack>
    </NextGenMIFollowCursorTooltip>
  )
}

export default ScenarioPossibilityGauge
