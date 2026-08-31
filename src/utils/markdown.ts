import remarkGfm, { type Options as RemarkGfmOptions } from 'remark-gfm'

import type { PluggableList } from 'unified'

export const markdownRemarkGfmOptions: RemarkGfmOptions = {
  singleTilde: false,
}

export const markdownRemarkPlugins: PluggableList = [[remarkGfm, markdownRemarkGfmOptions]]

export const normalizeMarkdownStrongDelimiter = (markdown: string) =>
  markdown.replaceAll(/(?<!\\)\*\*([^*\n]*[^\p{L}\p{N}\s*])\*\*(?=\p{Script=Hangul})/gu, '**$1**&#8203;')
