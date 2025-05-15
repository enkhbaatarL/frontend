import { Meta, StoryObj } from '@storybook/react'

import MIInfluenceFactorChart from '@/components/common/influence-factor-chart/MIInfluenceFactorChart'

const meta = {
  title: 'common/chart/MIInfluenceFactorChart',
  component: MIInfluenceFactorChart,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  args: {},
} satisfies Meta<typeof MIInfluenceFactorChart>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultChart: Story = {
  args: {
    height: 150,
    data: {
      'Case 1': {
        value: 95,
        color: '#2c3e50',
      },
      'Case 2': {
        value: 75,
        color: '#607d8b',
      },
      'Case 3': {
        value: 35,
        color: '#95a5a6',
      },
      'Case 4': {
        value: 15,
        color: '#b0bec5',
      },
    },
  },
}
