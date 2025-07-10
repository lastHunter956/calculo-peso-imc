"use client"

export interface BMIData {
  bmi: number
  category: BMICategory
  classification: BMIClassification
  healthRisk: HealthRisk
}

export type BMICategory =
  | "underweight-severe"
  | "underweight-moderate"
  | "underweight-mild"
  | "normal"
  | "overweight"
  | "obese-class-1"
  | "obese-class-2"
  | "obese-class-3"

export type BMIClassification =
  | "Bajo peso severo"
  | "Bajo peso moderado"
  | "Bajo peso leve"
  | "Peso normal"
  | "Sobrepeso"
  | "Obesidad Clase I"
  | "Obesidad Clase II"
  | "Obesidad Clase III"

export type HealthRisk = "low" | "moderate" | "high" | "very-high" | "extremely-high"

export interface BMIRange {
  min: number
  max: number
  category: BMICategory
  classification: BMIClassification
  healthRisk: HealthRisk
  description: string
  recommendations: string[]
  videoTrigger: boolean
  severity: "info" | "warning" | "alert" | "critical"
}

// WHO BMI Categories with health risk assessment
export const BMI_RANGES: BMIRange[] = [
  {
    min: 0,
    max: 16,
    category: "underweight-severe",
    classification: "Bajo peso severo",
    healthRisk: "extremely-high",
    description: "Peso extremadamente bajo que requiere atención médica inmediata.",
    recommendations: [
      "Consulta médica urgente requerida",
      "Evaluación nutricional profesional",
      "Posible hospitalización necesaria",
      "Seguimiento médico continuo",
    ],
    videoTrigger: true,
    severity: "critical",
  },
  {
    min: 16,
    max: 17,
    category: "underweight-moderate",
    classification: "Bajo peso moderado",
    healthRisk: "very-high",
    description: "Peso significativamente bajo que requiere intervención médica.",
    recommendations: [
      "Consulta médica inmediata",
      "Plan nutricional supervisado",
      "Evaluación de causas subyacentes",
      "Monitoreo regular de salud",
    ],
    videoTrigger: true,
    severity: "alert",
  },
  {
    min: 17,
    max: 18.5,
    category: "underweight-mild",
    classification: "Bajo peso leve",
    healthRisk: "moderate",
    description: "Peso por debajo del rango saludable, se recomienda ganar peso.",
    recommendations: [
      "Consulta con nutricionista",
      "Dieta rica en nutrientes",
      "Ejercicio de fortalecimiento",
      "Monitoreo regular del peso",
    ],
    videoTrigger: false,
    severity: "warning",
  },
  {
    min: 18.5,
    max: 25,
    category: "normal",
    classification: "Peso normal",
    healthRisk: "low",
    description: "Peso saludable. Mantén tu estilo de vida actual.",
    recommendations: [
      "Mantener dieta equilibrada",
      "Ejercicio regular",
      "Chequeos médicos anuales",
      "Estilo de vida saludable",
    ],
    videoTrigger: false,
    severity: "info",
  },
  {
    min: 25,
    max: 30,
    category: "overweight",
    classification: "Sobrepeso",
    healthRisk: "moderate",
    description: "Peso por encima del rango saludable. Se recomienda perder peso.",
    recommendations: [
      "Reducir ingesta calórica",
      "Aumentar actividad física",
      "Consulta nutricional",
      "Establecer metas realistas",
    ],
    videoTrigger: true,
    severity: "warning",
  },
  {
    min: 30,
    max: 35,
    category: "obese-class-1",
    classification: "Obesidad Clase I",
    healthRisk: "high",
    description: "Obesidad moderada con riesgo aumentado de problemas de salud.",
    recommendations: [
      "Consulta médica especializada",
      "Plan de pérdida de peso supervisado",
      "Evaluación de comorbilidades",
      "Cambios significativos en estilo de vida",
    ],
    videoTrigger: true,
    severity: "alert",
  },
  {
    min: 35,
    max: 40,
    category: "obese-class-2",
    classification: "Obesidad Clase II",
    healthRisk: "very-high",
    description: "Obesidad severa con alto riesgo de complicaciones de salud.",
    recommendations: [
      "Atención médica especializada urgente",
      "Evaluación para cirugía bariátrica",
      "Manejo multidisciplinario",
      "Monitoreo intensivo de salud",
    ],
    videoTrigger: true,
    severity: "critical",
  },
  {
    min: 40,
    max: 100,
    category: "obese-class-3",
    classification: "Obesidad Clase III",
    healthRisk: "extremely-high",
    description: "Obesidad mórbida con riesgo extremo para la salud.",
    recommendations: [
      "Atención médica inmediata y especializada",
      "Evaluación urgente para cirugía bariátrica",
      "Manejo hospitalario si es necesario",
      "Intervención multidisciplinaria intensiva",
    ],
    videoTrigger: true,
    severity: "critical",
  },
]

export function calculateBMI(weightKg: number, heightCm: number): BMIData {
  if (weightKg <= 0 || heightCm <= 0) {
    throw new Error("Weight and height must be positive numbers")
  }

  const heightM = heightCm / 100
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1))

  const range = BMI_RANGES.find((range) => bmi >= range.min && bmi < range.max)

  if (!range) {
    // Fallback for extreme values
    const lastRange = BMI_RANGES[BMI_RANGES.length - 1]
    return {
      bmi,
      category: lastRange.category,
      classification: lastRange.classification,
      healthRisk: lastRange.healthRisk,
    }
  }

  return {
    bmi,
    category: range.category,
    classification: range.classification,
    healthRisk: range.healthRisk,
  }
}

export function getBMIRange(bmi: number): BMIRange {
  const range = BMI_RANGES.find((range) => bmi >= range.min && bmi < range.max)
  return range || BMI_RANGES[BMI_RANGES.length - 1]
}

export function getIdealWeightRange(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100
  const minBMI = 18.5
  const maxBMI = 24.9

  return {
    min: Number((minBMI * heightM * heightM).toFixed(1)),
    max: Number((maxBMI * heightM * heightM).toFixed(1)),
  }
}

export function getBMIColor(category: BMICategory): {
  bg: string
  border: string
  text: string
  badge: string
  icon: string
} {
  switch (category) {
    case "underweight-severe":
    case "underweight-moderate":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        badge: "bg-blue-100 text-blue-800",
        icon: "text-blue-600",
      }
    case "underweight-mild":
      return {
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        text: "text-cyan-800",
        badge: "bg-cyan-100 text-cyan-800",
        icon: "text-cyan-600",
      }
    case "normal":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-800",
        badge: "bg-emerald-100 text-emerald-800",
        icon: "text-emerald-600",
      }
    case "overweight":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        badge: "bg-amber-100 text-amber-800",
        icon: "text-amber-600",
      }
    case "obese-class-1":
      return {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
        badge: "bg-orange-100 text-orange-800",
        icon: "text-orange-600",
      }
    case "obese-class-2":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        badge: "bg-red-100 text-red-800",
        icon: "text-red-600",
      }
    case "obese-class-3":
      return {
        bg: "bg-red-50",
        border: "border-red-300",
        text: "text-red-900",
        badge: "bg-red-200 text-red-900",
        icon: "text-red-700",
      }
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-800",
        badge: "bg-slate-100 text-slate-800",
        icon: "text-slate-600",
      }
  }
}
