"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AudioVisualizer } from "./AudioVisualizer"
import { useAudioFeedback } from "@/hooks/useAudioFeedback"

interface ParticleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  onMouseEnter?: () => void
  className?: string
  disabled?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  audioType?: "hover" | "click" | "success" | "navigation" | "error" | "toggle"
  [key: string]: any
}

export function ParticleButton({
  children,
  onClick,
  onMouseEnter,
  className = "",
  disabled = false,
  variant = "default",
  size = "default",
  audioType = "click",
  ...props
}: ParticleButtonProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const { playSound } = useAudioFeedback()

  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovering(true)
      playSound("hover")
      onMouseEnter?.()
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const handleMouseDown = () => {
    if (!disabled) {
      setIsClicking(true)
    }
  }

  const handleMouseUp = () => {
    setIsClicking(false)
  }

  const handleClick = () => {
    if (!disabled) {
      playSound(audioType)
      onClick?.()
    }
  }

  return (
    <div className="relative">
      <Button
        {...props}
        className={`relative overflow-hidden ${className}`}
        disabled={disabled}
        variant={variant}
        size={size}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      >
        {children}
      </Button>

      {/* Audio Visualizer Overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-md overflow-hidden">
        <AudioVisualizer
          isPlaying={isHovering || isClicking}
          audioType={isClicking ? audioType : "hover"}
          className="opacity-70"
        />
      </div>
    </div>
  )
}
