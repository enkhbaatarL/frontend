import { action } from '@storybook/addon-actions'
import { Meta, StoryObj } from '@storybook/react'

import AdminItemUpload from '@/components/admin/AdminItemUpload.tsx'
const meta = {
  title: 'common/AdminItemUpload',
  component: AdminItemUpload,
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
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    onDelete: action('deleted'),
  },
} satisfies Meta<typeof AdminItemUpload>

export default meta

type Story = StoryObj<typeof meta>

export const AdminItemUploadDefault: Story = {
  args: {
    progressValue: 80,
    file: {
      url: '/src/assets/bgcard.png',
      name: 'sample.jpg',
      size: 512 * 1024,
      type: 'image/jpeg',
    },
    widthItem: 456,
    onDelete: () => alert('Item deleted'),
  },
}

export const AdminItemUploadCsv: Story = {
  args: {
    progressValue: 10,
    file: {
      url: '/src/assets/fileicon.svg',
      name: 'document_file_name.csv',
      size: 512 * 1024,
      type: 'text/csv',
    },
    widthItem: 456,
    onDelete: () => alert('Item deleted'),
  },
}
export const AdminItemUploadNoImage: Story = {
  args: {
    progressValue: 100,
    file: {
      name: 'document_file_name.csv',
      size: 512 * 1024,
      type: 'text/csv',
    },
    widthItem: 456,
    onDelete: () => alert('Item deleted'),
  },
}
