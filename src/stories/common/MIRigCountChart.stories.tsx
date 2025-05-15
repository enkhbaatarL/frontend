import { Meta, StoryObj } from '@storybook/react'

import MIRigCountChart from '@/components/common/influence-factor-chart/MIRigCountChart'
import { generateMonthDataAsStrings } from '@/components/common/influence-factor-chart/mockRigCountData'

const meta = {
  title: 'common/chart/MIRigCountChart',
  component: MIRigCountChart,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  args: {},
} satisfies Meta<typeof MIRigCountChart>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultChart: Story = {
  args: {
    height: 250,
    data: {
      labels: generateMonthDataAsStrings('2024-10', 7),
      values: [8500, 9200, 9600, 10000, 10400, 10800, 11200],
    },
  },
}
