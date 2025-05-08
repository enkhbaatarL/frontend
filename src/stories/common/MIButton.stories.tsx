import { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import MIButton from '@/components/common/button/MIButton'
import SearchIcon from '@/components/common/icons/SearchIcon'

const meta = {
  title: 'common/MIButton',
  component: MIButton,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
} satisfies Meta<typeof MIButton>

export default meta

type Story = StoryObj<typeof meta>

export const ButtonWithEndIcon: Story = {
  args: {
    children: 'Button',
    size: 'h28',
    endIcon: <SearchIcon />,
  },
}

export const ButtonWithStartIcon: Story = {
  args: {
    children: 'Button',
    size: 'h28',
    startIcon: <SearchIcon />,
  },
}

export const ButtonIcon: Story = {
  args: {
    size: 'h28',
    type: 'outlined',
    contentType: 'icon',
    startIcon: <SearchIcon />,
  },
}
