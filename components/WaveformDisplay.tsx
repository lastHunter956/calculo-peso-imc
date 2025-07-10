"use client"

import { useEffect, useRef, useState } from "react"

interface WaveformDisplayProps {
  isActive: boolean
  intensity?: number
  color?: string
  className?: string
}

export function WaveformDisplay({ isActive, intensity = 1, color = "#64748b", className = "" }: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [time, setTime] = useState(0)

  const drawWaveform = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!isActive) return

    const centerY = canvas.height / 2
    const amplitude = 15 * intensity
    const frequency = 0.02
    const speed = 0.05

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
    gradient.addColorStop(0, color + "00")
    gradient.addColorStop(0.5, color)
    gradient.addColorStop(1, color + "00")

    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8

    // Main wave
    ctx.beginPath()
    for (let x = 0; x < canvas.width; x += 1) {
      const y = centerY + Math.sin(x * frequency + time * speed) * amplitude
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Secondary wave
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    for (let x = 0; x < canvas.width; x += 1) {
      const y = centerY + Math.sin(x * frequency * 1.5 + time * speed + Math.PI / 3) * amplitude * 0.6
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Tertiary wave
    ctx.globalAlpha = 0.2
    ctx.beginPath()
    for (let x = 0; x < canvas.width; x += 1) {
      const y = centerY + Math.sin(x * frequency * 0.7 + time * speed + Math.PI / 6) * amplitude * 0.8
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    drawWaveform(ctx, canvas)
    setTime((prev) => prev + 1)

    animationRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [isActive, intensity, color])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  )
}
