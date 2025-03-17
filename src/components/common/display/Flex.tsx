import { ReactNode, CSSProperties } from 'react'

interface Props {
  children: ReactNode
  align?: 'start' | 'end' | 'center' | 'baseline'
  direction?: 'column' | 'row' | 'column-reverse' | 'row-reverse'
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gap?: number
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

const Flex = ({
  children,
  align = 'center',
  direction = 'row',
  justify = 'flex-start',
  wrap = 'nowrap',
  gap = 0,
  className,
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
    ...style,
  }

  return (
    <div style={flexStyle} className={className} {...Props}>
      {children}
    </div>
  )
}

export default Flex
