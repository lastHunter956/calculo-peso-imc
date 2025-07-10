"use client"

import { useState, useCallback } from "react"
import { useAudioFeedback } from "./useAudioFeedback"

export interface PDFData {
  bmi: number
  category: string
  classification: string
  weight: number
  height: number
  weightUnit: string
  heightUnit: string
  gender: string
  timestamp: Date
  recommendations: string[]
  idealWeightRange: { min: number; max: number }
  healthRisk: string
}

export function usePDFGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationSuccess, setGenerationSuccess] = useState(false)
  const { playSound } = useAudioFeedback()

  const generatePDFContent = useCallback((data: PDFData) => {
    const {
      bmi,
      classification,
      weight,
      height,
      weightUnit,
      heightUnit,
      gender,
      timestamp,
      recommendations,
      idealWeightRange,
      healthRisk,
    } = data

    // Create a comprehensive HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Análisis de IMC</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #1e293b;
            padding-bottom: 20px;
          }
          
          .header h1 {
            color: #1e293b;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          
          .header p {
            color: #64748b;
            font-size: 14px;
          }
          
          .main-result {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px solid #cbd5e1;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
          }
          
          .bmi-value {
            font-size: 48px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
          }
          
          .bmi-category {
            font-size: 20px;
            color: #475569;
            margin-bottom: 20px;
            font-weight: 600;
          }
          
          .health-status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
          }
          
          .status-normal { background: #dcfce7; color: #166534; }
          .status-warning { background: #fef3c7; color: #92400e; }
          .status-alert { background: #fee2e2; color: #991b1b; }
          
          .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .detail-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
          }
          
          .detail-card h3 {
            color: #1e293b;
            font-size: 16px;
            margin-bottom: 15px;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .detail-label {
            color: #64748b;
            font-weight: 500;
          }
          
          .detail-value {
            color: #1e293b;
            font-weight: 600;
          }
          
          .recommendations {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
          }
          
          .recommendations h3 {
            color: #0c4a6e;
            font-size: 18px;
            margin-bottom: 15px;
            font-weight: 600;
          }
          
          .recommendations ul {
            list-style: none;
            padding: 0;
          }
          
          .recommendations li {
            background: #fff;
            border: 1px solid #e0f2fe;
            border-radius: 6px;
            padding: 12px 15px;
            margin-bottom: 8px;
            font-size: 14px;
            color: #0f172a;
            position: relative;
            padding-left: 35px;
          }
          
          .recommendations li:before {
            content: "✓";
            position: absolute;
            left: 12px;
            color: #0891b2;
            font-weight: bold;
          }
          
          .bmi-scale {
            margin: 20px 0;
          }
          
          .scale-bar {
            height: 20px;
            background: linear-gradient(to right, 
              #3b82f6 0%, #3b82f6 18.5%, 
              #10b981 18.5%, #10b981 25%, 
              #f59e0b 25%, #f59e0b 30%, 
              #ef4444 30%, #ef4444 100%);
            border-radius: 10px;
            position: relative;
            margin: 10px 0;
          }
          
          .scale-labels {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
          }
          
          .bmi-indicator {
            position: absolute;
            top: -5px;
            width: 4px;
            height: 30px;
            background: #1e293b;
            border-radius: 2px;
            transform: translateX(-2px);
          }
          
          .footer {
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          
          .disclaimer {
            background: #fef7cd;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #92400e;
          }
          
          .disclaimer strong {
            color: #78350f;
          }
          
          @media print {
            body { padding: 20px; }
            .header h1 { font-size: 24px; }
            .bmi-value { font-size: 36px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Reporte de Análisis de IMC</h1>
          <p>Generado el ${timestamp.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</p>
        </div>

        <div class="main-result">
          <div class="bmi-value">${bmi}</div>
          <div class="bmi-category">${classification}</div>
          <div class="health-status ${
            data.category === "normal"
              ? "status-normal"
              : data.category.includes("underweight") || data.category === "overweight"
                ? "status-warning"
                : "status-alert"
          }">
            ${
              data.category === "normal"
                ? "✅ Peso Saludable"
                : data.category.includes("underweight")
                  ? "⚠️ Bajo Peso"
                  : data.category === "overweight"
                    ? "⚠️ Sobrepeso"
                    : "🚨 Obesidad"
            }
          </div>
          
          <div class="bmi-scale">
            <div class="scale-bar">
              <div class="bmi-indicator" style="left: ${Math.min((bmi / 40) * 100, 100)}%;"></div>
            </div>
            <div class="scale-labels">
              <span>Bajo Peso (&lt;18.5)</span>
              <span>Normal (18.5-24.9)</span>
              <span>Sobrepeso (25-29.9)</span>
              <span>Obesidad (≥30)</span>
            </div>
          </div>
        </div>

        <div class="details-grid">
          <div class="detail-card">
            <h3>📋 Información Personal</h3>
            <div class="detail-row">
              <span class="detail-label">Peso:</span>
              <span class="detail-value">${weight} ${weightUnit}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Altura:</span>
              <span class="detail-value">${height} ${heightUnit}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Género:</span>
              <span class="detail-value">${gender === "female" ? "Femenino" : "Masculino"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">IMC:</span>
              <span class="detail-value">${bmi}</span>
            </div>
          </div>

          <div class="detail-card">
            <h3>🎯 Rango Ideal</h3>
            <div class="detail-row">
              <span class="detail-label">Peso Mínimo:</span>
              <span class="detail-value">${idealWeightRange.min.toFixed(1)} ${weightUnit}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Peso Máximo:</span>
              <span class="detail-value">${idealWeightRange.max.toFixed(1)} ${weightUnit}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Riesgo de Salud:</span>
              <span class="detail-value">${
                healthRisk === "low"
                  ? "Bajo"
                  : healthRisk === "moderate"
                    ? "Moderado"
                    : healthRisk === "high"
                      ? "Alto"
                      : healthRisk === "very-high"
                        ? "Muy Alto"
                        : "Extremo"
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Categoría OMS:</span>
              <span class="detail-value">${classification}</span>
            </div>
          </div>
        </div>

        <div class="recommendations">
          <h3>💡 Recomendaciones Personalizadas</h3>
          <ul>
            ${recommendations.map((rec) => `<li>${rec}</li>`).join("")}
          </ul>
        </div>

        <div class="disclaimer">
          <strong>⚠️ Importante:</strong> Este reporte es solo para fines informativos y educativos. 
          El IMC es una herramienta de evaluación general y no reemplaza el consejo médico profesional. 
          Consulte siempre con un profesional de la salud para obtener una evaluación completa de su estado de salud.
        </div>

        <div class="footer">
          <p>📱 Generado por la Aplicación de Evaluación de IMC</p>
          <p>Basado en los estándares de la Organización Mundial de la Salud (OMS)</p>
          <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
        </div>
      </body>
      </html>
    `

    return htmlContent
  }, [])

  const downloadPDF = useCallback(
    async (data: PDFData) => {
      setIsGenerating(true)

      try {
        // Generate HTML content
        const htmlContent = generatePDFContent(data)

        // Create a new window for printing
        const printWindow = window.open("", "_blank")
        if (!printWindow) {
          throw new Error("No se pudo abrir la ventana de impresión")
        }

        // Write content to the new window
        printWindow.document.write(htmlContent)
        printWindow.document.close()

        // Wait for content to load
        await new Promise((resolve) => {
          printWindow.onload = resolve
          setTimeout(resolve, 1000) // Fallback timeout
        })

        // Focus and print
        printWindow.focus()
        printWindow.print()

        // Close the window after printing (optional)
        setTimeout(() => {
          printWindow.close()
        }, 1000)

        setGenerationSuccess(true)
        playSound("success")

        setTimeout(() => setGenerationSuccess(false), 3000)
        return true
      } catch (error) {
        console.error("Error generating PDF:", error)
        playSound("error")
        return false
      } finally {
        setIsGenerating(false)
      }
    },
    [generatePDFContent, playSound],
  )

  const downloadHTML = useCallback(
    (data: PDFData) => {
      try {
        const htmlContent = generatePDFContent(data)
        const timestamp = new Date().toISOString().split("T")[0]
        const filename = `reporte-imc-${data.bmi}-${timestamp}.html`

        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" })
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = filename
        link.style.display = "none"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)

        setGenerationSuccess(true)
        playSound("success")
        setTimeout(() => setGenerationSuccess(false), 3000)
        return true
      } catch (error) {
        console.error("Error downloading HTML:", error)
        playSound("error")
        return false
      }
    },
    [generatePDFContent, playSound],
  )

  const previewPDF = useCallback(
    (data: PDFData) => {
      try {
        const htmlContent = generatePDFContent(data)

        // Open preview in new tab
        const previewWindow = window.open("", "_blank")
        if (!previewWindow) {
          throw new Error("No se pudo abrir la ventana de vista previa")
        }

        previewWindow.document.write(htmlContent)
        previewWindow.document.close()

        playSound("navigation")
        return true
      } catch (error) {
        console.error("Error previewing PDF:", error)
        playSound("error")
        return false
      }
    },
    [generatePDFContent, playSound],
  )

  return {
    isGenerating,
    generationSuccess,
    downloadPDF,
    downloadHTML,
    previewPDF,
    generatePDFContent,
  }
}
