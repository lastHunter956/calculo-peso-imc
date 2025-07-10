"use client"

import { useState, useCallback } from "react"

export interface WeightThreshold {
  id: string
  name: string
  condition: (weight: number, gender: string) => boolean
  videoId: string
  message: string
  severity: "warning" | "alert" | "critical"
}

export interface WeightMonitorConfig {
  thresholds: WeightThreshold[]
  autoPlay: boolean
  showVisualFeedback: boolean
}

const DEFAULT_THRESHOLDS: WeightThreshold[] = [
  {
    id: "female-overweight",
    name: "Sobrepeso Femenino",
    condition: (weight: number, gender: string) => gender === "female" && weight > 75,
    videoId: "dQw4w9WgXcQ", // Rick Roll as fallback - always available
    message: "Tu peso indica una categoría de sobrepeso. Te recomendamos consultar con un profesional de la salud.",
    severity: "warning",
  },
  {
    id: "male-overweight",
    name: "Sobrepeso Masculino",
    condition: (weight: number, gender: string) => gender === "male" && weight > 100,
    videoId: "dQw4w9WgXcQ",
    message: "Tu peso indica una categoría de sobrepeso. Te recomendamos consultar con un profesional de la salud.",
    severity: "warning",
  },
  {
    id: "female-obese",
    name: "Obesidad Femenina",
    condition: (weight: number, gender: string) => gender === "female" && weight > 90,
    videoId: "dQw4w9WgXcQ",
    message: "Tu peso indica obesidad. Es importante buscar orientación médica profesional.",
    severity: "alert",
  },
  {
    id: "male-obese",
    name: "Obesidad Masculina",
    condition: (weight: number, gender: string) => gender === "male" && weight > 120,
    videoId: "dQw4w9WgXcQ",
    message: "Tu peso indica obesidad. Es importante buscar orientación médica profesional.",
    severity: "alert",
  },
  {
    id: "critical-weight",
    name: "Peso Crítico",
    condition: (weight: number, gender: string) =>
      (gender === "female" && weight > 110) || (gender === "male" && weight > 150),
    videoId: "dQw4w9WgXcQ",
    message: "Tu peso requiere atención médica inmediata. Por favor, consulta con un especialista.",
    severity: "critical",
  },
]

export function useWeightMonitor(config?: Partial<WeightMonitorConfig>) {
  const [triggeredThreshold, setTriggeredThreshold] = useState<WeightThreshold | null>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [monitoringHistory, setMonitoringHistory] = useState<
    Array<{
      timestamp: Date
      weight: number
      gender: string
      threshold: WeightThreshold | null
    }>
  >([])

  const finalConfig: WeightMonitorConfig = {
    thresholds: DEFAULT_THRESHOLDS,
    autoPlay: true,
    showVisualFeedback: true,
    ...config,
  }

  const checkWeight = useCallback(
    (weight: number, gender: string) => {
      // Find the most severe threshold that matches
      const matchingThresholds = finalConfig.thresholds
        .filter((threshold) => threshold.condition(weight, gender))
        .sort((a, b) => {
          const severityOrder = { warning: 1, alert: 2, critical: 3 }
          return severityOrder[b.severity] - severityOrder[a.severity]
        })

      const mostSevereThreshold = matchingThresholds[0] || null

      // Add to monitoring history
      setMonitoringHistory((prev) =>
        [
          ...prev,
          {
            timestamp: new Date(),
            weight,
            gender,
            threshold: mostSevereThreshold,
          },
        ].slice(-50),
      ) // Keep last 50 entries

      if (mostSevereThreshold) {
        setTriggeredThreshold(mostSevereThreshold)
        setShowAlert(true)

        if (finalConfig.autoPlay) {
          setIsVideoPlaying(true)
        }

        return mostSevereThreshold
      }

      return null
    },
    [config],
  ) // Use config as dependency instead of finalConfig

  const dismissAlert = useCallback(() => {
    setShowAlert(false)
    setIsVideoPlaying(false)
  }, [])

  const playVideo = useCallback(() => {
    setIsVideoPlaying(true)
  }, [])

  const stopVideo = useCallback(() => {
    setIsVideoPlaying(false)
  }, [])

  const updateThresholds = useCallback((newThresholds: WeightThreshold[]) => {
    setMonitoringHistory((prev) => prev.map((entry) => ({ ...entry, threshold: null }))) // Reset thresholds in history
    setTriggeredThreshold(null) // Reset triggered threshold
    setShowAlert(false) // Hide alert
    setIsVideoPlaying(false) // Stop video
  }, [])

  return {
    checkWeight,
    triggeredThreshold,
    isVideoPlaying,
    showAlert,
    monitoringHistory,
    dismissAlert,
    playVideo,
    stopVideo,
    updateThresholds,
    config: finalConfig,
  }
}
