import { Meta, StoryObj } from '@storybook/react'

import { useMockDevice } from '@/hooks/useMockDevice'
import TableDevice from '@/pages/mi/dashboard/components/TableDevice'
const meta = {
  title: 'common/TableDevice',
  component: TableDevice,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    backgrounds: {
      default: 'white',
      values: [
        { name: 'white', value: '#ffffff' },
        { name: 'gray', value: '#f0f0f0' },
      ],
    },
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
} satisfies Meta<typeof TableDevice>

export default meta

type Story = StoryObj<typeof meta>

export const TableDeviceDefault: Story = {
  args: {
    data: useMockDevice,
  },
}
