import remarkGfm, { type Options as RemarkGfmOptions } from 'remark-gfm'

import type { PluggableList } from 'unified'

export const markdownRemarkGfmOptions: RemarkGfmOptions = {
  singleTilde: false,
}

export const markdownRemarkPlugins: PluggableList = [[remarkGfm, markdownRemarkGfmOptions]]
