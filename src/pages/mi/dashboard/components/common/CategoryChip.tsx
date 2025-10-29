import { Stack, StackProps, Tooltip } from '@mui/material'

interface Props extends StackProps {
  tooltipTitle?: string
}

const CategoryChip = ({ tooltipTitle, children, ...props }: Props) => (
  <Tooltip title={tooltipTitle} placement="top-start" followCursor>
    <Stack
      alignItems="center"
      justifyContent="center"
      borderRadius="4px"
      bgcolor="white"
      border="1px solid"
      borderColor="content.borderEnabled"
      height={26}
      minWidth={26}
      boxSizing="border-box"
      overflow="hidden"
      {...props}
    >
      {children}
    </Stack>
  </Tooltip>
)

export default CategoryChip
