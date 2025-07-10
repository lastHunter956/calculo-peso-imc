"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AdvancedWebGLParticleSystem } from "./AdvancedWebGLParticleSystem"
import { useAudioFeedback } from "@/hooks/useAudioFeedback"

interface CollisionButtonProps {
  children: React.ReactNode
  onClick?: () => void
  onMouseEnter?: () => void
  className?: string
  disabled?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  audioType?: "hover" | "click" | "success" | "navigation" | "error" | "toggle"
  intensity?: number
  enableCollisions?: boolean
  enableMagnetism?: boolean
  [key: string]: any
}

export function CollisionButton({
  children,
  onClick,
  onMouseEnter,
  className = "",
  disabled = false,
  variant = "default",
  size = "default",
  audioType = "click",
  intensity = 1,
  enableCollisions = true,
  enableMagnetism = true,
  ...props
}: CollisionButtonProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const { playSound } = useAudioFeedback()

  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovering(true)
      setShowParticles(true)
      playSound("hover")
      onMouseEnter?.()
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setTimeout(() => {
      if (!isClicking) setShowParticles(false)
    }, 1500)
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
      setShowParticles(true)
      playSound(audioType)
      onClick?.()

      // Keep particles active for longer on click
      setTimeout(() => {
        if (!isHovering) setShowParticles(false)
      }, 3000)
    }
  }

  return (
    <div className="relative">
      <Button
        {...props}
        className={`relative overflow-hidden ${className} transition-all duration-300 hover:shadow-2xl`}
        disabled={disabled}
        variant={variant}
        size={size}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        style={{
          transform: isClicking
            ? "scale(0.98) translateZ(0)"
            : isHovering
              ? "scale(1.02) translateZ(0)"
              : "scale(1) translateZ(0)",
        }}
      >
        <span className="relative z-10">{children}</span>
      </Button>

      {/* Advanced 3D Particle System with Collisions */}
      <div className="absolute inset-0 pointer-events-none rounded-md overflow-hidden">
        <AdvancedWebGLParticleSystem
          isActive={showParticles}
          audioType={isClicking ? audioType : "hover"}
          intensity={isClicking ? intensity * 1.8 : intensity}
          enableCollisions={enableCollisions}
          enableMagnetism={enableMagnetism}
          className="opacity-85"
        />
      </div>

      {/* Enhanced collision glow effect */}
      {showParticles && (
        <div
          className="absolute inset-0 rounded-md pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(circle at center, ${
              audioType === "success"
                ? "rgba(16, 185, 129, 0.3)"
                : audioType === "navigation"
                  ? "rgba(59, 130, 246, 0.3)"
                  : audioType === "error"
                    ? "rgba(239, 68, 68, 0.3)"
                    : audioType === "toggle"
                      ? "rgba(139, 92, 246, 0.3)"
                      : "rgba(100, 116, 139, 0.3)"
            } 0%, transparent 70%)`,
            opacity: isClicking ? 1 : 0.6,
            transform: isClicking ? "scale(1.1)" : "scale(1)",
          }}
        />
      )}
    </div>
  )
}
