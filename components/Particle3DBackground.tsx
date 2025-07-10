"use client"

import { useEffect, useRef, useState } from "react"
import { WebGLParticleSystem } from "./WebGLParticleSystem"

interface Particle3DBackgroundProps {
  isActive: boolean
  scenario: "female-high" | "male-high" | "default"
  className?: string
}

export function Particle3DBackground({ isActive, scenario, className = "" }: Particle3DBackgroundProps) {
  const [particleWaves, setParticleWaves] = useState<Array<{ type: string; delay: number }>>([])
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  const getScenarioConfig = (scenario: string) => {
    switch (scenario) {
      case "female-high":
        return {
          audioType: "success" as const,
          waves: [
            { type: "success", delay: 0 },
            { type: "navigation", delay: 500 },
            { type: "toggle", delay: 1000 },
          ],
        }
      case "male-high":
        return {
          audioType: "navigation" as const,
          waves: [
            { type: "navigation", delay: 0 },
            { type: "click", delay: 400 },
            { type: "success", delay: 800 },
          ],
        }
      case "default":
        return {
          audioType: "hover" as const,
          waves: [
            { type: "hover", delay: 0 },
            { type: "toggle", delay: 600 },
          ],
        }
      default:
        return {
          audioType: "hover" as const,
          waves: [{ type: "hover", delay: 0 }],
        }
    }
  }

  useEffect(() => {
    // Clear existing timeouts
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout))
    timeoutRefs.current = []

    if (isActive) {
      const config = getScenarioConfig(scenario)

      config.waves.forEach((wave, index) => {
        const timeout = setTimeout(() => {
          setParticleWaves((prev) => [...prev, { type: wave.type, delay: Date.now() }])
        }, wave.delay)

        timeoutRefs.current.push(timeout)
      })

      // Clear particles after animation
      const clearTimeout = setTimeout(() => {
        setParticleWaves([])
      }, 3000)

      timeoutRefs.current.push(clearTimeout)
    } else {
      setParticleWaves([])
    }

    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [isActive, scenario])

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {particleWaves.map((wave, index) => (
        <div key={`${wave.type}-${wave.delay}`} className="absolute inset-0">
          <WebGLParticleSystem isActive={true} audioType={wave.type as any} intensity={1.2} className="opacity-60" />
        </div>
      ))}
    </div>
  )
}
