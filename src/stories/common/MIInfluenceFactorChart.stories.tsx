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
    decreasingFactors: [
      {
        label: 'Decreasing Factor 1',
        value: 85.0,
        color: '#A9141A',
      },
      {
        label: 'D Factor 2',
        value: 40.0,
        color: '#5B6773',
      },
      {
        label: 'D Factor 3',
        value: 30.0,
        color: '#7A8790',
      },
      {
        label: 'D Factor 4',
        value: 20.0,
        color: '#8C98A0',
      },
      {
        label: 'D Factor 5',
        value: 5.0,
        color: '#9DAFB9',
      },
    ],
    increasingFactors: [
      {
        label: 'Increasing Factor 1',
        value: 100.0,
        color: '#3C8A36',
      },
      {
        label: 'Rig count',
        value: 80.0,
        color: '#5B6773',
      },
      {
        label: 'I Factor 3',
        value: 65.0,
        color: '#7A8790',
      },
      {
        label: 'I Factor 4',
        value: 35.0,
        color: '#8C98A0',
      },
      {
        label: 'I Factor 5',
        value: 1.0,
        color: '#9DAFB9',
      },
    ],
  },
}
