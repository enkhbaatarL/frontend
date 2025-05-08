import { Meta, StoryObj } from '@storybook/react'

import MIChartViewToggle from '@/components/common/chart/MIChartViewToogle'

const meta = {
  title: 'common/chart/MIChartViewToggle',
  component: MIChartViewToggle,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  args: {},
} satisfies Meta<typeof MIChartViewToggle>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultToggle: Story = {
  args: {
    label: 'MA',
  },
}
