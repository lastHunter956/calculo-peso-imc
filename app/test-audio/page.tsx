"use client";

import { YouTubePlayer } from "@/components/YouTubePlayer";

export default function AudioTestPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🔊 Test de Audio - YouTubePlayer
        </h1>

        <div className="grid gap-8">
          {/* Test 1: Audio habilitado por defecto */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              ✅ Test 1: Con Audio Habilitado (muted=false)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Este video debería mostrar un botón para activar audio si el
              navegador lo bloquea.
            </p>
            <YouTubePlayer
              videoId="dQw4w9WgXcQ" // Rick Roll para test :)
              muted={false}
              showControls={true}
              autoPlay={true}
              loop={true}
              className="w-full max-w-2xl mx-auto"
            />
          </div>

          {/* Test 2: Audio silenciado */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              🔇 Test 2: Sin Audio (muted=true)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Este video debería reproducirse silenciado sin mostrar botón de
              audio.
            </p>
            <YouTubePlayer
              videoId="dQw4w9WgXcQ"
              muted={true}
              showControls={true}
              autoPlay={true}
              loop={true}
              className="w-full max-w-2xl mx-auto"
            />
          </div>

          {/* Test 3: Sin controles pero con audio disponible */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              🎛️ Test 3: Sin Controles + Audio Disponible
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Sin controles de YouTube, pero con botón de audio personalizado.
            </p>
            <YouTubePlayer
              videoId="dQw4w9WgXcQ"
              muted={false}
              showControls={false}
              autoPlay={true}
              loop={true}
              className="w-full max-w-2xl mx-auto"
            />
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            📋 Instrucciones de Prueba
          </h3>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li>
              • <strong>Test 1:</strong> Debería mostrar un botón azul "Activar
              Audio" si el navegador bloquea el audio
            </li>
            <li>
              • <strong>Test 2:</strong> Debería reproducirse silenciado sin
              botón de audio
            </li>
            <li>
              • <strong>Test 3:</strong> Debería mostrar botón flotante en la
              esquina para audio
            </li>
            <li>
              • <strong>Consola:</strong> Abre DevTools (F12) para ver los logs
              de debug del audio
            </li>
            <li>
              • <strong>Indicadores:</strong> Puntos de colores en las esquinas
              muestran estado (🔴 reproduciendo, 🟢 con audio)
            </li>
          </ul>
        </div>

        {/* Enlaces útiles */}
        <div className="text-center space-y-2 text-sm text-gray-600">
          <p>
            <a href="/" className="text-blue-600 hover:underline">
              ← Volver a la aplicación principal
            </a>
          </p>
          <p>Video de prueba: Rick Roll (nunca te va a decepcionar 😄)</p>
        </div>
      </div>
    </div>
  );
}
