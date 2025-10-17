import { Stack, StackProps } from '@mui/material'

const CategoryChip = ({ children, ...props }: StackProps) => (
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
    {...props}
  >
    {children}
  </Stack>
)

export default CategoryChip
