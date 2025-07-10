"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Scale, Sparkles, Ruler } from "lucide-react"
import { useAudioFeedback } from "@/hooks/useAudioFeedback"
import { AudioControls } from "@/components/AudioControls"
import { AudioSettingsButton } from "@/components/AudioSettingsButton"
import { CollisionButton } from "@/components/CollisionButton"
import { AdvancedWebGLParticleSystem } from "@/components/AdvancedWebGLParticleSystem"
import { useBMIMonitor } from "@/hooks/useBMIMonitor"
import { BMIAlert } from "@/components/BMIAlert"

type Gender = "male" | "female" | ""
type WeightUnit = "kg" | "lbs"
type HeightUnit = "cm" | "ft"

export default function HomePage() {
  const [weight, setWeight] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [gender, setGender] = useState<Gender>("")
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg")
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHeaderParticles, setShowHeaderParticles] = useState(false)
  const [showFormParticles, setShowFormParticles] = useState(false)
  const { playSound } = useAudioFeedback()
  const router = useRouter()

  const {
    checkBMI,
    currentBMIData,
    currentBMIRange,
    triggeredThreshold,
    showAlert,
    dismissAlert,
    config: monitorConfig,
  } = useBMIMonitor({
    autoPlay: true,
    showVisualFeedback: true,
    includeUnderweight: true,
  })

  const convertHeight = (heightValue: string, fromUnit: HeightUnit): number => {
    const value = Number.parseFloat(heightValue)
    if (fromUnit === "ft") {
      return value * 30.48 // feet to cm
    }
    return value // already in cm
  }

  const convertWeight = (weightValue: string, fromUnit: WeightUnit): number => {
    const value = Number.parseFloat(weightValue)
    if (fromUnit === "lbs") {
      return value * 0.453592 // lbs to kg
    }
    return value // already in kg
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!weight || !height || !gender) {
      playSound("error")
      return
    }

    setIsSubmitting(true)
    setShowFormParticles(true)
    playSound("success")

    // Convert to metric units
    const weightKg = convertWeight(weight, weightUnit)
    const heightCm = convertHeight(height, heightUnit)

    // Check BMI and trigger alerts if needed
    const result = checkBMI(weightKg, heightCm)

    if (result?.threshold) {
      // If threshold triggered, show alert instead of navigating
      setIsSubmitting(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 600))

    const params = new URLSearchParams({
      weight: weightKg.toString(),
      height: heightCm.toString(),
      gender: gender,
      originalWeight: weight,
      originalHeight: height,
      weightUnit: weightUnit,
      heightUnit: heightUnit,
      bmi: result?.bmiData.bmi.toString() || "",
      bmiCategory: result?.bmiData.category || "",
    })

    playSound("navigation")
    router.push(`/results?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4 relative overflow-hidden">
      

      {/* Background Collision Particles */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <AdvancedWebGLParticleSystem
          isActive={showFormParticles}
          audioType="success"
          intensity={0.8}
          enableCollisions={true}
          enableMagnetism={true}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-3 duration-700">
          <div
            className="relative inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-full mb-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
            onMouseEnter={() => {
              setShowHeaderParticles(true)
              playSound("hover")
            }}
            onMouseLeave={() => setShowHeaderParticles(false)}
            onClick={() => playSound("click")}
            style={{
              transform: showHeaderParticles ? "scale(1.1) rotateY(10deg)" : "scale(1) rotateY(0deg)",
              transformStyle: "preserve-3d",
            }}
          >
            <Scale className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300 relative z-10" />

            {/* Advanced Collision Particle System for Header */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <AdvancedWebGLParticleSystem
                isActive={showHeaderParticles}
                audioType="hover"
                intensity={1.2}
                enableCollisions={true}
                enableMagnetism={true}
                className="opacity-80"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Evaluación de IMC</h1>
          <p className="text-slate-600 text-sm">
            Ingresa tu información para obtener un análisis completo de tu índice de masa corporal
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-lg bg-white animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-800 text-center">Información Personal</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Weight Input with Unit Selection */}
              <div className="space-y-3">
                <Label htmlFor="weight" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Peso
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="weight"
                      type="number"
                      placeholder={weightUnit === "kg" ? "Ej: 70" : "Ej: 154"}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      onFocus={() => playSound("hover")}
                      min="1"
                      step="0.1"
                      required
                      className="h-11 border-slate-200 focus:border-slate-400 transition-all duration-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
                    />
                  </div>
                  <div className="relative">
                    <Select
                      value={weightUnit}
                      onValueChange={(value: WeightUnit) => {
                        setWeightUnit(value)
                        playSound("toggle")
                      }}
                    >
                      <SelectTrigger
                        className="w-20 h-11 border-slate-200 focus:border-slate-400 hover:border-slate-300 transition-all duration-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1 overflow-hidden"
                        onMouseEnter={() => playSound("hover")}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="kg"
                          className="hover:bg-slate-50 focus:bg-slate-100 transition-colors duration-150"
                          onMouseEnter={() => playSound("hover")}
                          onClick={() => playSound("click")}
                        >
                          kg
                        </SelectItem>
                        <SelectItem
                          value="lbs"
                          className="hover:bg-slate-50 focus:bg-slate-100 transition-colors duration-150"
                          onMouseEnter={() => playSound("hover")}
                          onClick={() => playSound("click")}
                        >
                          lbs
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{weightUnit === "kg" ? "Kilogramos" : "Libras"}</p>
              </div>

              {/* Height Input with Unit Selection */}
              <div className="space-y-3">
                <Label htmlFor="height" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Altura
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="height"
                      type="number"
                      placeholder={heightUnit === "cm" ? "Ej: 170" : "Ej: 5.7"}
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      onFocus={() => playSound("hover")}
                      min="1"
                      step={heightUnit === "cm" ? "1" : "0.1"}
                      required
                      className="h-11 border-slate-200 focus:border-slate-400 transition-all duration-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
                    />
                  </div>
                  <div className="relative">
                    <Select
                      value={heightUnit}
                      onValueChange={(value: HeightUnit) => {
                        setHeightUnit(value)
                        playSound("toggle")
                      }}
                    >
                      <SelectTrigger
                        className="w-20 h-11 border-slate-200 focus:border-slate-400 hover:border-slate-300 transition-all duration-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1 overflow-hidden"
                        onMouseEnter={() => playSound("hover")}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="cm"
                          className="hover:bg-slate-50 focus:bg-slate-100 transition-colors duration-150"
                          onMouseEnter={() => playSound("hover")}
                          onClick={() => playSound("click")}
                        >
                          cm
                        </SelectItem>
                        <SelectItem
                          value="ft"
                          className="hover:bg-slate-50 focus:bg-slate-100 transition-colors duration-150"
                          onMouseEnter={() => playSound("hover")}
                          onClick={() => playSound("click")}
                        >
                          ft
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{heightUnit === "cm" ? "Centímetros" : "Pies (decimal)"}</p>
              </div>

              {/* Gender Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Género</Label>
                <RadioGroup
                  value={gender}
                  onValueChange={(value: Gender) => {
                    setGender(value)
                    playSound("toggle")
                  }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="relative group">
                    <RadioGroupItem value="female" id="female" className="peer sr-only" />
                    <Label
                      htmlFor="female"
                      className="flex items-center justify-center h-11 px-4 border border-slate-200 rounded-md cursor-pointer transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white peer-checked:shadow-md focus-within:ring-2 focus-within:ring-slate-200 focus-within:ring-offset-1 overflow-hidden"
                      onMouseEnter={() => playSound("hover")}
                      onClick={() => playSound("click")}
                    >
                      <span className="text-sm font-medium transition-all duration-200 relative z-10">Femenino</span>

                      {/* Collision Particles for selected state */}
                      {gender === "female" && (
                        <div className="absolute inset-0">
                          <AdvancedWebGLParticleSystem
                            isActive={true}
                            audioType="toggle"
                            intensity={0.4}
                            enableCollisions={true}
                            enableMagnetism={false}
                            className="opacity-50"
                          />
                        </div>
                      )}
                    </Label>
                  </div>
                  <div className="relative group">
                    <RadioGroupItem value="male" id="male" className="peer sr-only" />
                    <Label
                      htmlFor="male"
                      className="flex items-center justify-center h-11 px-4 border border-slate-200 rounded-md cursor-pointer transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white peer-checked:shadow-md focus-within:ring-2 focus-within:ring-slate-200 focus-within:ring-offset-1 overflow-hidden"
                      onMouseEnter={() => playSound("hover")}
                      onClick={() => playSound("click")}
                    >
                      <span className="text-sm font-medium transition-all duration-200 relative z-10">Masculino</span>

                      {/* Collision Particles for selected state */}
                      {gender === "male" && (
                        <div className="absolute inset-0">
                          <AdvancedWebGLParticleSystem
                            isActive={true}
                            audioType="navigation"
                            intensity={0.4}
                            enableCollisions={true}
                            enableMagnetism={false}
                            className="opacity-50"
                          />
                        </div>
                      )}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <div className="relative">
                <CollisionButton
                  type="submit"
                  disabled={isSubmitting || !weight || !height || !gender}
                  audioType="success"
                  intensity={2.5}
                  enableCollisions={true}
                  enableMagnetism={true}
                  className={`
                    w-full h-11 bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200 
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900
                    hover:shadow-lg hover:shadow-slate-900/25
                    focus:ring-2 focus:ring-slate-300 focus:ring-offset-2
                    ${isSubmitting ? "cursor-wait" : ""}
                  `}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="animate-pulse">Calculando IMC...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                      <span>Analizar IMC</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </CollisionButton>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="text-center mt-6 animate-in fade-in duration-700 delay-500">
          <p className="text-xs text-slate-500 hover:text-slate-700 transition-colors duration-200 cursor-default">
            Análisis de IMC basado en estándares de la OMS • Resultados personalizados
          </p>
        </div>
      </div>

      {/* BMI Alert Modal */}
      {showAlert && triggeredThreshold && currentBMIData && currentBMIRange && (
        <BMIAlert
          threshold={triggeredThreshold}
          bmiData={currentBMIData}
          bmiRange={currentBMIRange}
          weight={convertWeight(weight, weightUnit)}
          height={convertHeight(height, heightUnit)}
          unit={weightUnit}
          isVisible={showAlert}
          autoPlayVideo={monitorConfig.autoPlay}
          onDismiss={() => {
            dismissAlert()
            setIsSubmitting(false)
          }}
          onVideoPlay={() => {
            playSound("success")
          }}
          onVideoEnd={() => {
            playSound("navigation")
          }}
        />
      )}

      {/* Botón de configuración de audio global */}
      <AudioSettingsButton />
    </div>
  )
}
