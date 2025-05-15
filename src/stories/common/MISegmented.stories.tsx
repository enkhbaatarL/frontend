import StarIcon from '@mui/icons-material/Star'
import { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import MISegmented from '@/components/common/segmentedbtn/MISegmented'

const meta = {
  title: 'common/MISegmented',
  component: MISegmented,
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
} satisfies Meta<typeof MISegmented>

export default meta

type Story = StoryObj<typeof meta>

export const MISegmentedDefault: Story = {
  args: {
    children: 'Segmented name',
    size: 'h38',
  },
}
export const MISegmentedIcon: Story = {
  args: {
    startIcon: <StarIcon />,
    type: 'icon',
    size: 'h38',
  },
}
export const MISegmentedStartIcon: Story = {
  args: {
    startIcon: <StarIcon />,
    type: 'Rectangle',
    children: 'Segmented name',
    size: 'h38',
  },
}
