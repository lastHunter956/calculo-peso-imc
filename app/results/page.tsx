"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Volume2, VolumeX, ArrowLeft, Activity, RotateCcw, FileText, Download, Heart, CheckCircle } from "lucide-react"

import { AudioControls } from "@/components/AudioControls"
import { useAudioFeedback } from "@/hooks/useAudioFeedback"
import { CollisionButton } from "@/components/CollisionButton"
import { AdvancedWebGLParticleSystem } from "@/components/AdvancedWebGLParticleSystem"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBMIMonitor } from "@/hooks/useBMIMonitor"
import { getBMIColor, getIdealWeightRange, type BMICategory } from "@/utils/bmiCalculator"
import { PDFDownloadModal } from "@/components/PDFDownloadModal"
import type { PDFData } from "@/hooks/usePDFGenerator"

type Scenario = "underweight" | "normal" | "overweight" | "obese"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { playSound } = useAudioFeedback()

  /* ------------------------------------------------------------------ */
  /* Query params ----------------------------------------------------- */
  const weight = Number.parseFloat(searchParams.get("weight") || "0") // kg
  const height = Number.parseFloat(searchParams.get("height") || "0") // cm
  const gender = searchParams.get("gender")
  const originalWeight = searchParams.get("originalWeight")
  const originalHeight = searchParams.get("originalHeight")
  const weightUnit = (searchParams.get("weightUnit") || "kg") as "kg" | "lbs"
  const heightUnit = (searchParams.get("heightUnit") || "cm") as "cm" | "ft"
  const bmi = Number.parseFloat(searchParams.get("bmi") || "0")
  const bmiCategory = searchParams.get("bmiCategory") as BMICategory
  /* ------------------------------------------------------------------ */

  const {
    checkBMI,
    triggeredThreshold,
    showAlert,
    dismissAlert,
    currentBMIData,
    currentBMIRange,
    config: monitorConfig,
  } = useBMIMonitor()

  const [scenario, setScenario] = useState<Scenario>("normal")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [show3DBackground, setShow3DBackground] = useState(false)
  const [showPDFModal, setShowPDFModal] = useState(false)

  /* ------------------------------------------------------------------ */
  /* Helper tone ------------------------------------------------------ */
  const playScenarioTone = (sc: Scenario) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    const settings: Record<Scenario, { freq: number; dur: number }> = {
      underweight: { freq: 400, dur: 1.5 },
      normal: { freq: 523, dur: 2 },
      overweight: { freq: 349, dur: 1.8 },
      obese: { freq: 300, dur: 2.2 },
    }

    const { freq, dur } = settings[sc]

    osc.frequency.value = freq
    osc.type = "sine"

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur)

    osc.start()
    osc.stop(ctx.currentTime + dur)

    setIsPlaying(true)
    setTimeout(() => {
      setIsPlaying(false)
      setShow3DBackground(false)
    }, dur * 1000)
  }
  /* ------------------------------------------------------------------ */

  /* Validate & prepare ---------------------------------------------- */
  useEffect(() => {
    if (!weight || !height || !gender || !bmi) {
      router.push("/")
      return
    }

    // Check BMI again (in case user refreshed results page)
    checkBMI(weight, height)

    // Determine scenario
    let sc: Scenario = "normal"
    if (bmiCategory?.includes("underweight")) sc = "underweight"
    else if (bmiCategory === "overweight") sc = "overweight"
    else if (bmiCategory?.includes("obese")) sc = "obese"
    setScenario(sc)

    // Fake load animation
    setTimeout(() => {
      setIsLoaded(true)
      setTimeout(() => {
        playScenarioTone(sc)
        setShow3DBackground(true)
      }, 400)
    }, 700)
  }, [weight, height, gender, bmi, bmiCategory, router, checkBMI])
  /* ------------------------------------------------------------------ */

  /*  UI configs ------------------------------------------------------ */
  const colors = bmiCategory ? getBMIColor(bmiCategory) : getBMIColor("normal")
  const idealWeight = height ? getIdealWeightRange(height) : { min: 0, max: 0 }
  const bmiProgress = Math.min((bmi / 50) * 100, 100)

  // Check if weight is healthy (normal BMI category)
  const isHealthyWeight = bmiCategory === "normal"

  const content = {
    underweight: {
      title: "Bajo Peso",
      subtitle: "Se recomienda ganar peso",
      description:
        "Tu IMC indica que estás por debajo del peso saludable. Es importante consultar con un profesional de la salud.",
      image: "/placeholder.svg?height=300&width=400",
      particleTone: "navigation" as const,
    },
    normal: {
      title: "Peso Saludable",
      subtitle: "¡Excelente! Mantén tu estilo de vida",
      description: "Tu IMC está en el rango saludable. Continúa con tus hábitos actuales de alimentación y ejercicio.",
      image: "/images/healthy-habits.jpg", // Use the healthy habits image
      particleTone: "success" as const,
    },
    overweight: {
      title: "Sobrepeso",
      subtitle: "Se recomienda perder peso",
      description: "Tu IMC indica sobrepeso. Considera adoptar hábitos más saludables de alimentación y ejercicio.",
      image: "/placeholder.svg?height=300&width=400",
      particleTone: "error" as const,
    },
    obese: {
      title: "Obesidad",
      subtitle: "Consulta médica recomendada",
      description:
        "Tu IMC indica obesidad. Es importante buscar orientación médica profesional para un plan de salud personalizado.",
      image: "/placeholder.svg?height=300&width=400",
      particleTone: "error" as const,
    },
  }[scenario]

  // Prepare PDF data
  const getRecommendationsByCategory = (category: string): string[] => {
    switch (category) {
      case "underweight-severe":
      case "underweight-moderate":
        return [
          "Consulta médica urgente requerida",
          "Evaluación nutricional profesional",
          "Plan de aumento de peso supervisado",
          "Monitoreo médico continuo",
        ]
      case "underweight-mild":
        return [
          "Consulta con nutricionista",
          "Dieta rica en nutrientes y calorías",
          "Ejercicio de fortalecimiento muscular",
          "Monitoreo regular del peso",
        ]
      case "normal":
        return [
          "Mantener dieta equilibrada",
          "Ejercicio regular (150 min/semana)",
          "Chequeos médicos anuales",
          "Mantener estilo de vida saludable",
        ]
      case "overweight":
        return [
          "Reducir ingesta calórica gradualmente",
          "Aumentar actividad física",
          "Consulta nutricional",
          "Establecer metas realistas de pérdida de peso",
        ]
      case "obese-class-1":
      case "obese-class-2":
      case "obese-class-3":
        return [
          "Consulta médica especializada urgente",
          "Plan de pérdida de peso supervisado",
          "Evaluación de comorbilidades",
          "Considerar tratamiento multidisciplinario",
        ]
      default:
        return [
          "Mantener hábitos saludables",
          "Consulta médica regular",
          "Ejercicio moderado",
          "Alimentación balanceada",
        ]
    }
  }

  const pdfData: PDFData = {
    bmi,
    category: bmiCategory || "normal",
    classification: currentBMIData?.classification || bmiCategory?.replaceAll("-", " ") || "Normal",
    weight: Number.parseFloat(originalWeight || "0"),
    height: Number.parseFloat(originalHeight || "0"),
    weightUnit,
    heightUnit,
    gender: gender || "unknown",
    timestamp: new Date(),
    recommendations: getRecommendationsByCategory(bmiCategory || "normal"),
    idealWeightRange: idealWeight,
    healthRisk: currentBMIData?.healthRisk || "low",
  }
  /* ------------------------------------------------------------------ */

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-sm text-slate-600 animate-pulse">Analizando tu IMC…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen p-4 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <AudioControls />

      {/* Background particles */}
      <AdvancedWebGLParticleSystem
        isActive={show3DBackground}
        audioType={content.particleTone}
        intensity={1.4}
        enableCollisions
        enableMagnetism
        className="absolute inset-0 opacity-25 pointer-events-none"
      />

      <div className="relative z-10 mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
          <CollisionButton
            audioType="navigation"
            variant="ghost"
            size="sm"
            intensity={1.2}
            enableCollisions
            enableMagnetism
            onClick={() => router.push("/")}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </CollisionButton>

          <div className="flex items-center gap-2">
            {isPlaying ? (
              <Volume2 className="w-4 h-4 text-slate-600 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-xs text-slate-500">{isPlaying ? "Reproduciendo" : "Audio reproducido"}</span>
          </div>
        </div>

        {/* Results card */}
        <Card
          className={`${colors.bg} ${colors.border} border-2 shadow-lg hover:scale-[1.01] hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 relative overflow-hidden`}
        >
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <Badge
                className={`${colors.badge} text-xs font-medium px-2 py-1`}
                onMouseEnter={() => playSound("hover")}
              >
                Resultado IMC
              </Badge>

              <div className="flex items-center gap-2">
                {isHealthyWeight && (
                  <Badge className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Saludable
                  </Badge>
                )}

                <CollisionButton
                  audioType="click"
                  variant="ghost"
                  size="sm"
                  intensity={1}
                  enableCollisions
                  enableMagnetism={false}
                  onClick={() => {
                    playScenarioTone(scenario)
                    setShow3DBackground(true)
                  }}
                  className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:shadow-sm hover:bg-white/70"
                >
                  <Volume2
                    className={`w-3 h-3 mr-1 ${
                      isPlaying ? "animate-pulse" : "group-hover:scale-110 transition-transform duration-200"
                    }`}
                  />
                  <span className="text-xs">Reproducir</span>
                </CollisionButton>
              </div>
            </div>

            <CardTitle className={`mb-1 text-xl font-bold ${colors.text} flex items-center gap-2`}>
              {content.title}
              {isHealthyWeight && <Heart className="w-5 h-5 text-red-500" />}
            </CardTitle>
            <p className="text-sm font-medium text-slate-600">{content.subtitle}</p>
          </CardHeader>

          <CardContent className="space-y-6 relative z-10">
            {/* Illustration */}
            <div className="relative overflow-hidden rounded-lg group">
              <Image
                src={content.image || "/placeholder.svg"}
                alt={content.title}
                width={400}
                height={300}
                className="object-cover w-full h-48 transition-transform duration-500 group-hover:scale-105"
                priority={isHealthyWeight} // Prioritize loading for healthy weight image
                onError={(e) => {
                  // Fallback to placeholder if healthy habits image fails to load
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=300&width=400"
                }}
              />
              <div className="absolute inset-0 transition-opacity duration-300 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100" />

              {/* Healthy weight overlay */}
              {isHealthyWeight && (
                <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                  <CheckCircle className="w-3 h-3" />
                  Peso Ideal
                </div>
              )}
            </div>

            {/* BMI details */}
            <div className="bg-white/70 p-4 rounded-lg space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-800">Detalles de IMC</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-800">{bmi}</p>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">IMC</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{pdfData.classification}</p>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Categoría</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {originalWeight} {weightUnit}
                  </p>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Peso</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {originalHeight} {heightUnit}
                  </p>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">Altura</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded bg-slate-200 overflow-hidden mt-4">
                <div
                  className={`h-full transition-all duration-500 ${isHealthyWeight ? "bg-green-500" : "bg-slate-900"}`}
                  style={{ width: `${bmiProgress}%` }}
                ></div>
              </div>

              {/* Ideal range */}
              <p className="text-xs text-slate-500 mt-2">
                Peso ideal (IMC 18.5–24.9): {idealWeight.min.toFixed(1)} –{idealWeight.max.toFixed(1)} {weightUnit}
              </p>

              {/* Healthy weight message */}
              {isHealthyWeight && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">¡Felicitaciones! Tu peso está en el rango saludable.</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Mantén tus hábitos actuales de alimentación y ejercicio.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <CollisionButton
                audioType="navigation"
                intensity={1.6}
                enableCollisions
                enableMagnetism
                onClick={() => router.push("/")}
                className="flex-1 h-10 text-sm text-white bg-slate-900 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/25"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                Nueva Evaluación
              </CollisionButton>

              <CollisionButton
                audioType="success"
                variant="outline"
                size="sm"
                intensity={1.2}
                enableCollisions
                enableMagnetism
                onClick={() => {
                  setShowPDFModal(true)
                  playSound("success")
                }}
                className="h-10 px-4 bg-transparent border-slate-200 hover:bg-slate-50 hover:shadow-sm flex items-center gap-2"
              >
                <FileText className="w-3 h-3" />
                <span className="text-sm">Reporte PDF</span>
              </CollisionButton>

              <CollisionButton
                audioType="click"
                variant="outline"
                size="sm"
                intensity={0.9}
                enableCollisions
                enableMagnetism={false}
                onClick={() => {
                  // Quick download text file
                  const quickText = `📊 Mi Análisis de IMC\n\nIMC: ${bmi}\nCategoría: ${pdfData.classification}\nPeso: ${originalWeight} ${weightUnit}\nAltura: ${originalHeight} ${heightUnit}\nFecha: ${new Date().toLocaleDateString("es-ES")}\n\n¡Calcula tu IMC en: ${window.location.origin}`
                  const blob = new Blob([quickText], { type: "text/plain" })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement("a")
                  link.href = url
                  link.download = `imc-${bmi}-${new Date().toISOString().split("T")[0]}.txt`
                  link.click()
                  URL.revokeObjectURL(url)
                  playSound("success")
                }}
                className="h-10 px-3 bg-transparent border-slate-200 hover:bg-slate-50 hover:shadow-sm"
              >
                <Download className="w-3 h-3" />
              </CollisionButton>
            </div>
          </CardContent>

          {/* Decorative particles */}
          <div className="absolute inset-0 pointer-events-none">
            <AdvancedWebGLParticleSystem
              isActive={isPlaying}
              audioType={content.particleTone}
              intensity={0.6}
              enableCollisions
              enableMagnetism={false}
              className="opacity-15"
            />
          </div>
        </Card>
      </div>

      {/* PDF Download Modal */}
      <PDFDownloadModal isOpen={showPDFModal} onClose={() => setShowPDFModal(false)} pdfData={pdfData} />

      {/* If any BMI alert (rare, as it was handled before) */}
      {showAlert && triggeredThreshold && currentBMIData && currentBMIRange && (
        /* Lazy-import BMIAlert to avoid circular refs – just re-navigate if user hit this state */
        <div></div>
      )}
    </div>
  )
}
