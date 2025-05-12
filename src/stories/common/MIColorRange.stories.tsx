import { Meta, StoryObj } from '@storybook/react'

import MIColorRange from '@/components/common/colorrange/MIColorRange'

const meta = {
  title: 'common/MIColorRange',
  component: MIColorRange,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    data: [],
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
} satisfies Meta<typeof MIColorRange>

export default meta

type Story = StoryObj<typeof meta>

export const MIColorRangeDefault: Story = {
  args: {
    data: [-1.0, -0.7, -0.3, 0, 0.3, 0.7, 1.0],
  },
}
