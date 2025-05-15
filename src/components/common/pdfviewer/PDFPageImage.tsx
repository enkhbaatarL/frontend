import { Box } from '@mui/material'
import { MouseEventHandler, Ref } from 'react'

interface PDFPageImageProps {
  imageSrc: string
  scale: number
  rotation: number
  dragOffset: { x: number; y: number }
  isDragging: boolean
  canDrag: boolean
  onMouseDown: MouseEventHandler
  onMouseMove: MouseEventHandler
  onMouseUp: () => void
  onMouseLeave: () => void
  imageRef?: Ref<HTMLImageElement>
  containerRef?: Ref<HTMLDivElement>
}

const PDFPageImage = ({
  imageSrc,
  scale,
  rotation,
  dragOffset,
  isDragging,
  canDrag,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  imageRef,
  containerRef,
}: PDFPageImageProps) => (
  <Box
    ref={containerRef}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
    onMouseLeave={onMouseLeave}
    style={{
      cursor: isDragging ? 'grabbing' : canDrag ? 'grab' : 'default',
      position: 'relative',
    }}
  >
    <div
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <img
        ref={imageRef}
        src={imageSrc}
        alt="PDF page"
        className="shadow-lg bg-white max-h-full"
        draggable="false"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          maxWidth: '100%',
        }}
      />
    </div>
  </Box>
)

export default PDFPageImage
