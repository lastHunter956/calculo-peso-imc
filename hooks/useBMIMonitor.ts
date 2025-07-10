"use client"

import { useState, useCallback } from "react"
import { calculateBMI, getBMIRange, type BMIData, type BMIRange } from "@/utils/bmiCalculator"

export interface BMIThreshold {
  id: string
  name: string
  condition: (bmiData: BMIData) => boolean
  videoId: string
  message: string
  severity: "info" | "warning" | "alert" | "critical"
  autoPlay: boolean
}

export interface BMIMonitorConfig {
  thresholds: BMIThreshold[]
  autoPlay: boolean
  showVisualFeedback: boolean
  includeUnderweight: boolean
}

const DEFAULT_BMI_THRESHOLDS: BMIThreshold[] = [
  {
    id: "underweight-severe",
    name: "Bajo Peso Severo",
    condition: (bmiData) => bmiData.category === "underweight-severe",
    videoId: "m2wpyNBWRLw", // Updated video ID
    message: "Tu IMC indica bajo peso severo. Es crucial buscar atención médica inmediata.",
    severity: "critical",
    autoPlay: true,
  },
  {
    id: "underweight-moderate",
    name: "Bajo Peso Moderado",
    condition: (bmiData) => bmiData.category === "underweight-moderate",
    videoId: "m2wpyNBWRLw", // Updated video ID
    message: "Tu IMC indica bajo peso moderado. Se recomienda consulta médica urgente.",
    severity: "alert",
    autoPlay: true,
  },
  {
    id: "overweight",
    name: "Sobrepeso",
    condition: (bmiData) => bmiData.category === "overweight",
    videoId: "m2wpyNBWRLw", // Updated video ID
    message: "Tu IMC indica sobrepeso. Te recomendamos adoptar hábitos más saludables.",
    severity: "warning",
    autoPlay: false,
  },
  {
    id: "obese-class-1",
    name: "Obesidad Clase I",
    condition: (bmiData) => bmiData.category === "obese-class-1",
    videoId: "m2wpyNBWRLw", // Updated video ID
    message: "Tu IMC indica obesidad moderada. Es importante consultar con un profesional de la salud.",
    severity: "alert",
    autoPlay: true,
  },
  {
    id: "obese-class-2",
    name: "Obesidad Clase II",
    condition: (bmiData) => bmiData.category === "obese-class-2",
    videoId: "m2wpyNBWRLw", // Updated video ID
    message: "Tu IMC indica obesidad severa. Se requiere atención médica especializada urgente.",
    severity: "critical",
    autoPlay: true,
  },
  {
    id: "obese-class-3",
    name: "Obesidad Clase III",
    condition: (bmiData) => bmiData.category === "obese-class-3",
    videoId: "m2wpyNBWRLw", // Updated video ID
    message: "Tu IMC indica obesidad mórbida. Es crucial buscar atención médica inmediata y especializada.",
    severity: "critical",
    autoPlay: true,
  },
]

export interface BMIMonitorEntry {
  timestamp: Date
  weight: number
  height: number
  bmiData: BMIData
  bmiRange: BMIRange
  threshold: BMIThreshold | null
}

export function useBMIMonitor(config?: Partial<BMIMonitorConfig>) {
  const [triggeredThreshold, setTriggeredThreshold] = useState<BMIThreshold | null>(null)
  const [currentBMIData, setCurrentBMIData] = useState<BMIData | null>(null)
  const [currentBMIRange, setCurrentBMIRange] = useState<BMIRange | null>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [monitoringHistory, setMonitoringHistory] = useState<BMIMonitorEntry[]>([])

  const finalConfig: BMIMonitorConfig = {
    thresholds: DEFAULT_BMI_THRESHOLDS,
    autoPlay: true,
    showVisualFeedback: true,
    includeUnderweight: true,
    ...config,
  }

  const checkBMI = useCallback(
    (weightKg: number, heightCm: number) => {
      try {
        // Calculate BMI
        const bmiData = calculateBMI(weightKg, heightCm)
        const bmiRange = getBMIRange(bmiData.bmi)

        setCurrentBMIData(bmiData)
        setCurrentBMIRange(bmiRange)

        // Find matching threshold
        const matchingThresholds = finalConfig.thresholds.filter((threshold) => threshold.condition(bmiData))

        // Get the most severe threshold
        const severityOrder = { info: 1, warning: 2, alert: 3, critical: 4 }
        const mostSevereThreshold =
          matchingThresholds.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])[0] || null

        // Add to monitoring history
        const entry: BMIMonitorEntry = {
          timestamp: new Date(),
          weight: weightKg,
          height: heightCm,
          bmiData,
          bmiRange,
          threshold: mostSevereThreshold,
        }

        setMonitoringHistory((prev) => [...prev, entry].slice(-100)) // Keep last 100 entries

        // Trigger alert if threshold met
        if (mostSevereThreshold) {
          setTriggeredThreshold(mostSevereThreshold)
          setShowAlert(true)

          if (finalConfig.autoPlay && mostSevereThreshold.autoPlay) {
            setIsVideoPlaying(true)
          }

          return {
            bmiData,
            bmiRange,
            threshold: mostSevereThreshold,
            shouldTriggerVideo: bmiRange.videoTrigger,
          }
        }

        return {
          bmiData,
          bmiRange,
          threshold: null,
          shouldTriggerVideo: false,
        }
      } catch (error) {
        console.error("BMI calculation error:", error)
        return null
      }
    },
    [], // Removed finalConfig from dependencies
  )

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

  const updateThresholds = useCallback((newThresholds: BMIThreshold[]) => {
    setMonitoringHistory((prev) => prev.map((entry) => ({ ...entry, threshold: null })))
    setTriggeredThreshold(null)
    setShowAlert(false)
    setIsVideoPlaying(false)
  }, [])

  const getBMIStats = useCallback(() => {
    if (monitoringHistory.length === 0) return null

    const recent = monitoringHistory.slice(-10) // Last 10 entries
    const avgBMI = recent.reduce((sum, entry) => sum + entry.bmiData.bmi, 0) / recent.length

    const categories = recent.reduce(
      (acc, entry) => {
        acc[entry.bmiData.category] = (acc[entry.bmiData.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const mostCommonCategory = Object.entries(categories).sort(([, a], [, b]) => b - a)[0]?.[0]

    return {
      averageBMI: Number(avgBMI.toFixed(1)),
      totalEntries: monitoringHistory.length,
      recentEntries: recent.length,
      mostCommonCategory,
      trend: recent.length > 1 ? recent[recent.length - 1].bmiData.bmi - recent[0].bmiData.bmi : 0,
    }
  }, [monitoringHistory])

  return {
    checkBMI,
    currentBMIData,
    currentBMIRange,
    triggeredThreshold,
    isVideoPlaying,
    showAlert,
    monitoringHistory,
    dismissAlert,
    playVideo,
    stopVideo,
    updateThresholds,
    getBMIStats,
    config: finalConfig,
  }
}
