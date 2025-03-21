import { ReactNode, CSSProperties, HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  align?: 'start' | 'end' | 'center' | 'baseline'
  direction?: 'column' | 'row' | 'column-reverse' | 'row-reverse'
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gap?: number
  fullWidth?: true
  onClick?: () => void
}

const Flex = ({
  children,
  align = 'start',
  direction = 'row',
  justify = 'flex-start',
  wrap = 'nowrap',
  gap = 0,
  fullWidth,
  style,
  ...Props
}: Partial<Props>) => {
  const flexStyle: CSSProperties = {
    display: 'flex',
    alignItems: align,
    flexDirection: direction,
    justifyContent: justify,
    flexWrap: wrap,
    gap: gap,
    width: fullWidth ? '100%' : 'auto',
    ...style,
  }

  return (
    <div style={flexStyle} {...Props}>
      {children}
    </div>
  )
}

export default Flex
