import { Menu, MenuProps } from '@mui/material'

import ScrollWrapper from './ScrollWrapper'

const CustomMenu = (props: MenuProps) => {
  const { children, slotProps, ...rest } = props

  return (
    <Menu
      {...rest}
      slotProps={{
        ...slotProps,
        paper: {
          ...slotProps?.paper,
          sx: {
            overflow: 'hidden',
          },
        },
      }}
    >
      <ScrollWrapper maxHeight={196}>{children}</ScrollWrapper>
    </Menu>
  )
}

export default CustomMenu
