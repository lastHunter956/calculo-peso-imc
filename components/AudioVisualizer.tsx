"use client"

import { useEffect, useRef, useState } from "react"

interface AudioVisualizerProps {
  isPlaying: boolean
  audioType: "hover" | "click" | "success" | "navigation" | "error" | "toggle"
  className?: string
}

export function AudioVisualizer({ isPlaying, audioType, className = "" }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [particles, setParticles] = useState<Particle[]>([])

  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    size: number
    color: string
    type: string
  }

  const getAudioConfig = (type: string) => {
    switch (type) {
      case "hover":
        return {
          color: "#64748b",
          particleCount: 3,
          waveHeight: 8,
          frequency: 0.3,
          speed: 0.1,
        }
      case "click":
        return {
          color: "#475569",
          particleCount: 5,
          waveHeight: 12,
          frequency: 0.4,
          speed: 0.15,
        }
      case "success":
        return {
          color: "#10b981",
          particleCount: 12,
          waveHeight: 20,
          frequency: 0.6,
          speed: 0.2,
        }
      case "navigation":
        return {
          color: "#3b82f6",
          particleCount: 8,
          waveHeight: 15,
          frequency: 0.5,
          speed: 0.18,
        }
      case "error":
        return {
          color: "#ef4444",
          particleCount: 6,
          waveHeight: 10,
          frequency: 0.35,
          speed: 0.12,
        }
      case "toggle":
        return {
          color: "#8b5cf6",
          particleCount: 4,
          waveHeight: 10,
          frequency: 0.45,
          speed: 0.16,
        }
      default:
        return {
          color: "#64748b",
          particleCount: 5,
          waveHeight: 12,
          frequency: 0.4,
          speed: 0.15,
        }
    }
  }

  const createParticles = (config: ReturnType<typeof getAudioConfig>) => {
    const newParticles: Particle[] = []
    const canvas = canvasRef.current
    if (!canvas) return newParticles

    for (let i = 0; i < config.particleCount; i++) {
      newParticles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 40,
        y: canvas.height / 2 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        size: 1 + Math.random() * 3,
        color: config.color,
        type: audioType,
      })
    }
    return newParticles
  }

  const drawWaveform = (ctx: CanvasRenderingContext2D, config: ReturnType<typeof getAudioConfig>, time: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const centerY = canvas.height / 2
    const amplitude = config.waveHeight
    const frequency = config.frequency
    const speed = config.speed

    ctx.strokeStyle = config.color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.6

    // Main waveform
    ctx.beginPath()
    for (let x = 0; x < canvas.width; x += 2) {
      const y = centerY + Math.sin(x * frequency + time * speed * 100) * amplitude
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Secondary waveform (phase shifted)
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    for (let x = 0; x < canvas.width; x += 2) {
      const y = centerY + Math.sin(x * frequency + time * speed * 100 + Math.PI / 2) * amplitude * 0.7
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  const drawParticles = (ctx: CanvasRenderingContext2D, particleList: Particle[]) => {
    particleList.forEach((particle) => {
      const alpha = 1 - particle.life / particle.maxLife
      ctx.globalAlpha = alpha

      // Create gradient for particle
      const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2)
      gradient.addColorStop(0, particle.color)
      gradient.addColorStop(1, particle.color + "00")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()

      // Update particle
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life++
      particle.size *= 0.99
      particle.vy += 0.02 // gravity
    })
  }

  const animate = (time: number) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (isPlaying) {
      const config = getAudioConfig(audioType)

      // Draw waveform
      drawWaveform(ctx, config, time)

      // Draw particles
      drawParticles(ctx, particles)

      // Remove dead particles
      setParticles((prev) => prev.filter((p) => p.life < p.maxLife))
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    if (isPlaying) {
      const config = getAudioConfig(audioType)
      const newParticles = createParticles(config)
      setParticles((prev) => [...prev, ...newParticles])
    }
  }, [isPlaying, audioType])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, particles])

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
