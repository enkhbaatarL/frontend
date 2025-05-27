import React from 'react'

interface LoadingSpinnerProps {
  size?: number
  color?: string
  speed?: number
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 42, color = 'rgba(0, 0, 0, 0.2)', speed = 1 }) => {
  // Calculate viewBox based on original dimensions
  const viewBox = '0 0 42 42'

  // Style for the spinner animation
  const spinnerStyle: React.CSSProperties = {
    animation: `spin ${1.2 / speed}s linear infinite`,
    transformOrigin: 'center',
  }

  // Keyframes for the animation
  const keyframes = `
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `

  return (
    <>
      <style>{keyframes}</style>
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={viewBox} fill="none">
        <g clipPath="url(#clip0_loading)">
          {/* Static circle background */}
          <path
            d="M20.998 38.999C30.9392 38.999 38.998 30.9401 38.998 20.999C38.998 11.0579 30.9392 2.99902 20.998 2.99902C11.0569 2.99902 2.99805 11.0579 2.99805 20.999C2.99805 30.9401 11.0569 38.999 20.998 38.999Z"
            stroke={color}
            strokeWidth="6"
          />

          {/* Rotating spinner part */}
          <path
            d="M21 0C26.5695 0 31.911 2.21249 35.8492 6.15076C39.7875 10.089 42 15.4305 42 21H36C36 19.0302 35.612 17.0796 34.8582 15.2597C34.1044 13.4399 32.9995 11.7863 31.6066 10.3934C30.2137 9.00052 28.5601 7.89563 26.7403 7.14181C24.9204 6.38799 22.9698 6 21 6V0Z"
            fill={color}
            style={spinnerStyle}
          />
        </g>
        <defs>
          <clipPath id="clip0_loading">
            <rect width="42" height="42" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </>
  )
}

export default LoadingSpinner

// Usage example:
// <LoadingSpinner size={60} color="rgba(0, 0, 0, 0.5)" speed={1.5} />
