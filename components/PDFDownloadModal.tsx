"use client"

import { useState } from "react"
import { X, Download, Eye, FileText, Printer, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CollisionButton } from "./CollisionButton"
import { usePDFGenerator, type PDFData } from "@/hooks/usePDFGenerator"
import { useAudioFeedback } from "@/hooks/useAudioFeedback"
import { AdvancedWebGLParticleSystem } from "./AdvancedWebGLParticleSystem"

interface PDFDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  pdfData: PDFData
  className?: string
}

export function PDFDownloadModal({ isOpen, onClose, pdfData, className = "" }: PDFDownloadModalProps) {
  const [showParticles, setShowParticles] = useState(false)
  const { playSound } = useAudioFeedback()
  const { isGenerating, generationSuccess, downloadPDF, downloadHTML, previewPDF } = usePDFGenerator()

  if (!isOpen) return null

  const handleAction = async (action: string, callback: () => Promise<boolean> | boolean) => {
    setShowParticles(true)
    playSound("click")

    const success = await callback()
    if (success) {
      playSound("success")
    }

    setTimeout(() => setShowParticles(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <AdvancedWebGLParticleSystem
          isActive={showParticles}
          audioType="success"
          intensity={1.5}
          enableCollisions={true}
          enableMagnetism={true}
          className="opacity-30"
        />
      </div>

      <Card
        className={`relative w-full max-w-lg bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-500 ${className}`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Descargar Reporte
            </CardTitle>
            <CollisionButton
              onClick={() => {
                onClose()
                playSound("navigation")
              }}
              variant="ghost"
              size="sm"
              audioType="click"
              intensity={0.8}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </CollisionButton>
          </div>
          <p className="text-sm text-slate-600">Genera un reporte completo de tu análisis de IMC</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Report Preview Info */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">📋 Contenido del Reporte</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">Resultado de IMC</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">Datos personales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">Escala visual de IMC</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">Recomendaciones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">Rango de peso ideal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">Información médica</span>
              </div>
            </div>
          </div>

          {/* Current Data Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-3">📊 Resumen de tu Análisis</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-600 font-medium">IMC:</span>
                <span className="ml-2 text-blue-800 font-bold">{pdfData.bmi}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Categoría:</span>
                <span className="ml-2 text-blue-800">{pdfData.classification}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Peso:</span>
                <span className="ml-2 text-blue-800">
                  {pdfData.weight} {pdfData.weightUnit}
                </span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Altura:</span>
                <span className="ml-2 text-blue-800">
                  {pdfData.height} {pdfData.heightUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">🎯 Opciones de Descarga</h3>

            <div className="grid gap-3">
              {/* Preview Button */}
              <CollisionButton
                onClick={() => handleAction("preview", () => previewPDF(pdfData))}
                disabled={isGenerating}
                audioType="navigation"
                intensity={1.2}
                variant="outline"
                className="w-full flex items-center gap-3 p-4 h-auto hover:bg-slate-50 transition-all duration-200"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-slate-800">Vista Previa</div>
                  <div className="text-xs text-slate-600">Ver el reporte antes de descargar</div>
                </div>
              </CollisionButton>

              {/* PDF Download Button */}
              <CollisionButton
                onClick={() => handleAction("pdf", () => downloadPDF(pdfData))}
                disabled={isGenerating}
                audioType="success"
                intensity={1.5}
                className="w-full flex items-center gap-3 p-4 h-auto bg-slate-900 hover:bg-slate-800 text-white"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Imprimir / Guardar como PDF</div>
                  <div className="text-xs text-white/80">
                    {isGenerating ? "Generando reporte..." : "Abre el diálogo de impresión"}
                  </div>
                </div>
                {isGenerating && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
              </CollisionButton>

              {/* HTML Download Button */}
              <CollisionButton
                onClick={() => handleAction("html", () => downloadHTML(pdfData))}
                disabled={isGenerating}
                audioType="click"
                intensity={1}
                variant="outline"
                className="w-full flex items-center gap-3 p-4 h-auto hover:bg-green-50 hover:border-green-200 transition-all duration-200"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-slate-800">Descargar HTML</div>
                  <div className="text-xs text-slate-600">Archivo web que puedes abrir en cualquier navegador</div>
                </div>
              </CollisionButton>
            </div>
          </div>

          {/* Success Message */}
          {generationSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">¡Reporte generado exitosamente!</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="text-xs text-amber-800">
                <strong>Consejo:</strong> Para guardar como PDF, selecciona "Guardar como PDF" en el diálogo de
                impresión. El reporte incluye toda tu información de IMC y recomendaciones personalizadas.
              </div>
            </div>
          </div>
        </CardContent>

        {/* Particle Overlay */}
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
          <AdvancedWebGLParticleSystem
            isActive={showParticles}
            audioType="success"
            intensity={0.6}
            enableCollisions={true}
            enableMagnetism={false}
            className="opacity-20"
          />
        </div>
      </Card>
    </div>
  )
}
