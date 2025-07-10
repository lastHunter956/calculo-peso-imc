"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X, Play, ExternalLink, Heart, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { YouTubePlayer } from "./YouTubePlayer"
import { CollisionButton } from "./CollisionButton"
import { AdvancedWebGLParticleSystem } from "./AdvancedWebGLParticleSystem"
import { useAudioFeedback } from "@/hooks/useAudioFeedback"
import { getBMIColor, getIdealWeightRange, type BMIData, type BMIRange } from "@/utils/bmiCalculator"
import type { BMIThreshold } from "@/hooks/useBMIMonitor"

interface BMIAlertProps {
  threshold: BMIThreshold
  bmiData: BMIData
  bmiRange: BMIRange
  weight: number
  height: number
  unit: string
  isVisible: boolean
  autoPlayVideo?: boolean
  onDismiss: () => void
  onVideoPlay?: () => void
  onVideoEnd?: () => void
  className?: string
}

export function BMIAlert({
  threshold,
  bmiData,
  bmiRange,
  weight,
  height,
  unit,
  isVisible,
  autoPlayVideo = true,
  onDismiss,
  onVideoPlay,
  onVideoEnd,
  className = "",
}: BMIAlertProps) {
  const [showVideo, setShowVideo] = useState(autoPlayVideo && threshold.autoPlay)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const { playSound } = useAudioFeedback()

  useEffect(() => {
    if (isVisible) {
      setShowParticles(true)
      playSound(threshold.severity === "critical" ? "error" : "navigation")

      // Auto-start video if configured
      if (autoPlayVideo && threshold.autoPlay) {
        setShowVideo(true)
      }
    }
  }, [isVisible, playSound, threshold.severity, autoPlayVideo, threshold.autoPlay])

  const colors = getBMIColor(bmiData.category)
  const idealWeight = getIdealWeightRange(height)

  // Calculate BMI progress (0-50 scale for visualization)
  const bmiProgress = Math.min((bmiData.bmi / 50) * 100, 100)

  // Determine if weight should increase or decrease
  const weightDifference = bmiData.category.includes("underweight")
    ? idealWeight.min - weight
    : bmiData.category === "normal"
      ? 0
      : weight - idealWeight.max

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${className}`}
    >
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <AdvancedWebGLParticleSystem
          isActive={showParticles}
          audioType={threshold.severity === "critical" ? "error" : "navigation"}
          intensity={2.5}
          enableCollisions={true}
          enableMagnetism={true}
          className="opacity-30"
        />
      </div>

      <Card
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto ${colors.bg} ${colors.border} border-2 shadow-2xl animate-in fade-in zoom-in-95 duration-500`}
      >
        {/* Close Button */}
        <CollisionButton
          onClick={() => {
            onDismiss()
            playSound("navigation")
          }}
          variant="ghost"
          size="sm"
          audioType="click"
          intensity={0.8}
          className="absolute top-4 right-4 z-10 text-slate-500 hover:text-slate-700 hover:bg-white/50"
        >
          <X className="w-4 h-4" />
        </CollisionButton>

        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${colors.bg} border ${colors.border}`}>
              <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className={`text-xl font-bold ${colors.text}`}>Análisis de IMC</CardTitle>
                <Badge className={`${colors.badge} text-xs font-medium`}>{threshold.severity.toUpperCase()}</Badge>
              </div>

              <p className={`text-sm ${colors.text} opacity-90 mb-3`}>{threshold.message}</p>

              {/* BMI Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-white/70 rounded-lg">
                  <div className={`text-2xl font-bold ${colors.text}`}>{bmiData.bmi}</div>
                  <div className="text-xs text-slate-600 uppercase tracking-wide">IMC</div>
                </div>

                <div className="text-center p-2 bg-white/70 rounded-lg">
                  <div className={`text-sm font-semibold ${colors.text}`}>{bmiData.classification}</div>
                  <div className="text-xs text-slate-600 uppercase tracking-wide">Categoría</div>
                </div>

                <div className="text-center p-2 bg-white/70 rounded-lg">
                  <div className={`text-sm font-semibold ${colors.text} capitalize`}>
                    {bmiData.healthRisk === "low"
                      ? "Bajo"
                      : bmiData.healthRisk === "moderate"
                        ? "Moderado"
                        : bmiData.healthRisk === "high"
                          ? "Alto"
                          : bmiData.healthRisk === "very-high"
                            ? "Muy Alto"
                            : "Extremo"}
                  </div>
                  <div className="text-xs text-slate-600 uppercase tracking-wide">Riesgo</div>
                </div>

                <div className="text-center p-2 bg-white/70 rounded-lg">
                  <div className={`text-sm font-semibold ${colors.text}`}>
                    {weight} {unit}
                  </div>
                  <div className="text-xs text-slate-600 uppercase tracking-wide">Peso</div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* BMI Visualization */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
              <Activity className="w-5 h-5" />
              Análisis Detallado
            </h3>

            <div className="bg-white/70 p-4 rounded-lg space-y-4">
              {/* BMI Scale */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">IMC: {bmiData.bmi}</span>
                  <span className={`font-medium ${colors.text}`}>{bmiData.classification}</span>
                </div>
                <Progress value={bmiProgress} className="h-3" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>35</span>
                  <span>40+</span>
                </div>
              </div>

              {/* Weight Recommendation */}
              {weightDifference !== 0 && (
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
                  {weightDifference > 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {weightDifference > 0
                        ? `Se recomienda perder ${Math.abs(weightDifference).toFixed(1)} ${unit}`
                        : `Se recomienda ganar ${Math.abs(weightDifference).toFixed(1)} ${unit}`}
                    </p>
                    <p className="text-xs text-slate-600">
                      Peso ideal: {idealWeight.min.toFixed(1)} - {idealWeight.max.toFixed(1)} {unit}
                    </p>
                  </div>
                </div>
              )}

              {/* Health Description */}
              <div className="p-3 bg-white/80 rounded-lg">
                <p className="text-sm text-slate-700 mb-3">{bmiRange.description}</p>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-800">Recomendaciones:</h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {bmiRange.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Video Section - Always show if video trigger is enabled */}
          {bmiRange.videoTrigger && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
                  <Heart className="w-5 h-5" />
                  Video Educativo
                </h3>

                {!showVideo && (
                  <CollisionButton
                    onClick={() => {
                      setShowVideo(true)
                      playSound("success")
                    }}
                    audioType="success"
                    intensity={1.2}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Reproducir Video
                  </CollisionButton>
                )}
              </div>

              {showVideo && (
                <div className="relative">
                  <YouTubePlayer
                    videoId={threshold.videoId}
                    autoPlay={true} // Always autoplay
                    loop={true} // Always loop
                    muted={false} // Allow sound for educational content
                    onPlay={() => {
                      setIsVideoPlaying(true)
                      onVideoPlay?.()
                    }}
                    onPause={() => {
                      setIsVideoPlaying(false)
                    }}
                    onEnd={() => {
                      setIsVideoPlaying(false)
                      onVideoEnd?.()
                    }}
                    className="w-full h-64 md:h-80 rounded-lg overflow-hidden"
                    showControls={false} // No user controls
                    allowFullscreen={false} // No fullscreen
                  />

                  {/* Video info overlay */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Video en bucle automático
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/50">
            <CollisionButton
              onClick={() => {
                onDismiss()
                playSound("navigation")
              }}
              audioType="navigation"
              intensity={1.5}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
            >
              Entendido
            </CollisionButton>

            <CollisionButton
              onClick={() => {
                window.open(`https://www.youtube.com/watch?v=${threshold.videoId}`, "_blank")
                playSound("click")
              }}
              audioType="click"
              variant="outline"
              intensity={1}
              className="px-4 border-slate-300 hover:bg-white/70"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver en YouTube
            </CollisionButton>

            <CollisionButton
              onClick={() => {
                // Copy BMI info to clipboard
                const info = `IMC: ${bmiData.bmi} - ${bmiData.classification}\nPeso: ${weight}${unit}\nAltura: ${height}cm`
                navigator.clipboard.writeText(info)
                playSound("success")
              }}
              audioType="success"
              variant="outline"
              intensity={0.8}
              className="px-4 border-slate-300 hover:bg-white/70"
            >
              Compartir
            </CollisionButton>
          </div>
        </CardContent>

        {/* Particle Overlay */}
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
          <AdvancedWebGLParticleSystem
            isActive={isVideoPlaying}
            audioType="success"
            intensity={0.8}
            enableCollisions={true}
            enableMagnetism={false}
            className="opacity-20"
          />
        </div>
      </Card>
    </div>
  )
}
