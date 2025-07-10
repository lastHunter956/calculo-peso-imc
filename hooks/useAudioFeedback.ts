"use client"

import { useCallback, useRef, useState } from "react"

type AudioType = "hover" | "click" | "success" | "navigation" | "error" | "toggle"

interface AudioSettings {
  enabled: boolean
  volume: number
}

export function useAudioFeedback() {
  const [settings, setSettings] = useState<AudioSettings>({
    enabled: true,
    volume: 0.1,
  })

  const audioContextRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  const playSound = useCallback(
    (type: AudioType) => {
      if (!settings.enabled) return

      try {
        const audioContext = getAudioContext()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        let frequency = 800
        let duration = 0.1
        let waveType: OscillatorType = "sine"

        switch (type) {
          case "hover":
            frequency = 1000
            duration = 0.05
            waveType = "sine"
            break
          case "click":
            frequency = 800
            duration = 0.08
            waveType = "triangle"
            break
          case "success":
            // Pleasant ascending tone
            frequency = 600
            duration = 0.3
            waveType = "sine"
            break
          case "navigation":
            frequency = 700
            duration = 0.12
            waveType = "sine"
            break
          case "error":
            frequency = 400
            duration = 0.2
            waveType = "sawtooth"
            break
          case "toggle":
            frequency = 900
            duration = 0.06
            waveType = "square"
            break
        }

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = waveType

        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(settings.volume, audioContext.currentTime + 0.01)

        if (type === "success") {
          // Ascending tone for success
          oscillator.frequency.linearRampToValueAtTime(frequency * 1.5, audioContext.currentTime + duration * 0.7)
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
        } else if (type === "error") {
          // Descending tone for error
          oscillator.frequency.linearRampToValueAtTime(frequency * 0.7, audioContext.currentTime + duration * 0.8)
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
        } else {
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
        }

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
      } catch (error) {
        console.warn("Audio feedback failed:", error)
      }
    },
    [settings, getAudioContext],
  )

  const toggleAudio = useCallback(() => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
    playSound("toggle")
  }, [playSound])

  const setVolume = useCallback((volume: number) => {
    setSettings((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }))
  }, [])

  return {
    playSound,
    toggleAudio,
    setVolume,
    isEnabled: settings.enabled,
    volume: settings.volume,
  }
}
