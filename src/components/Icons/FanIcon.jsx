import React from 'react'

/**
 * Fan icon - Custom SVG component matching Phosphor icon style
 * Based on Phosphor Icons v2.0+ Fan icon
 */
const FanIcon = ({ size = 24, weight = 'regular', color = 'currentColor', ...props }) => {
  const strokeWidth = weight === 'fill' ? 0 : 16
  const fillColor = weight === 'fill' ? color : 'none'
  const strokeColor = weight === 'fill' ? 'none' : color

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="256" height="256" fill="none"/>
      <circle
        cx="128"
        cy="128"
        r="24"
        fill={fillColor}
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M104.31,124.14a52,52,0,1,1,47.69-92l-18.17,72.54"
        fill={fillColor}
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M136.5,150.45A52,52,0,1,1,33,155.13l71.91-20.54"
        fill={fillColor}
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M143.19,109.41A52,52,0,1,1,199,196.7l-53.74-52"
        fill={fillColor}
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}

export default FanIcon
