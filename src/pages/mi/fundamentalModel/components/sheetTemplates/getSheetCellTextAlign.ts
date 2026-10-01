const getSheetCellTextAlign = (value: string | number): 'left' | 'right' =>
  /^[-+]?(?:\d+(?:,\d{3})*(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?%?$/.test(String(value).trim()) ? 'right' : 'left'

export default getSheetCellTextAlign
