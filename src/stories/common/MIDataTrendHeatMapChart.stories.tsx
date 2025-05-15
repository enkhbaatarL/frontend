import { Meta, StoryObj } from '@storybook/react'

import MIDataTrendHeatMapChart from '@/components/common/data-trend-chart/MIDataTrendHeatMapChart'

const meta = {
  title: 'common/chart/MIDataTrendHeatMapChart',
  component: MIDataTrendHeatMapChart,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  args: {},
} satisfies Meta<typeof MIDataTrendHeatMapChart>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultChart: Story = {
  args: {
    data: [
      [-0.04, -0.04, 0.03, -0.04, -0.04, 0.04, -0.04, -0.01, 0.0, -0.04, -0.02, -0.04, 0.04, 0.03, -0.02, 0.01],
      [-0.02, -0.02, 0.02, -0.02, -0.02, -0.03, -0.03, -0.04, -0.03, -0.03, -0.02, -0.03, 0.02, 0.01, -0.03, -0.03],
      [-0.04, -0.04, -0.01, -0.04, -0.04, -0.03, -0.03, -0.02, -0.02, -0.01, -0.04, -0.04, 0.03, -0.01, -0.03, 0.03],
      [-0.02, -0.02, 0.04, -0.02, -0.02, -0.03, -0.04, -0.03, -0.01, -0.02, -0.02, -0.02, 0.03, 0.02, -0.04, 0.02],
      [-0.04, -0.04, 0.03, -0.04, -0.04, 0.04, -0.04, -0.01, 0.0, -0.04, -0.02, -0.04, 0.04, 0.03, -0.02, 0.01],
      [-0.02, -0.02, 0.02, -0.02, -0.02, -0.03, -0.03, -0.04, -0.03, -0.03, -0.02, -0.03, 0.02, 0.01, -0.03, -0.03],
    ],
    height: 345,
  },
}
