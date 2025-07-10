"use client";

import { useEffect, useRef, useState } from "react";
import { X, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioSettings } from "../contexts/AudioSettingsContext";

// Hook para detectar dispositivos móviles
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Breakpoint md de Tailwind
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

interface YouTubePlayerProps {
  videoId: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  className?: string;
  showControls?: boolean;
  allowFullscreen?: boolean;
  loop?: boolean;
  muted?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({
  videoId,
  autoPlay = true, // Autoplay siempre habilitado
  onPlay,
  onPause,
  onEnd,
  className = "",
  showControls = true, // CAMBIO: Mostrar controles por defecto para permitir audio
  allowFullscreen = true, // Permitir pantalla completa para mejor experiencia móvil
  loop = true, // Loop habilitado por defecto
  muted = false, // CAMBIO: Por defecto con audio habilitado
}: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(muted); // Estado del audio
  const isMobile = useIsMobile(); // Detectar si es móvil

  // Configuración global de audio
  const { settings } = useAudioSettings();

  // Load YouTube API
  useEffect(() => {
    if (window.YT) {
      initializePlayer();
      return;
    }

    // Load YouTube API script
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Forzar reproducción cuando el player esté listo
  useEffect(() => {
    if (isReady && ytPlayerRef.current) {
      const forcePlay = () => {
        try {
          ytPlayerRef.current.playVideo();
        } catch (error) {
          console.warn("Error forzando reproducción:", error);
        }
      };

      // Múltiples intentos para asegurar reproducción
      forcePlay();
      setTimeout(forcePlay, 200);
      setTimeout(forcePlay, 1000);
    }
  }, [isReady]);

  const initializePlayer = () => {
    if (!playerRef.current || !window.YT) return;

    try {
      ytPlayerRef.current = new window.YT.Player(playerRef.current, {
        videoId: videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1, // SIEMPRE 1 para forzar autoplay
          controls: showControls ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          fs: allowFullscreen ? 1 : 0,
          cc_load_policy: 0, // Deshabilitar subtítulos
          iv_load_policy: 3, // Deshabilitar anotaciones
          autohide: 1,
          disablekb: showControls ? 0 : 1, // Permitir teclado solo si hay controles
          loop: loop ? 1 : 0,
          playlist: loop ? videoId : undefined, // Requerido para que funcione el loop
          mute: 0, // CAMBIO: Iniciar SIN silenciar (con audio)
          playsinline: 1, // Reproducir inline en móviles (crucial para iOS)
          start: 0,
          enablejsapi: 1,
          // Parámetros adicionales para mejor experiencia móvil
          origin: typeof window !== "undefined" ? window.location.origin : "",
          widget_referrer:
            typeof window !== "undefined" ? window.location.origin : "",
          // Optimizaciones específicas para móviles
          ...(isMobile && {
            vq: "hd720", // Calidad optimizada para móviles
          }),
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            setError(null);

            // Estrategia basada en configuración global de audio
            const initWithAudio = () => {
              try {
                // Verificar si el audio global está habilitado
                const shouldPlayWithAudio =
                  settings.isAudioEnabled && settings.videoAudioEnabled;

                if (shouldPlayWithAudio) {
                  // SIEMPRE configurar con audio habilitado si la configuración lo permite
                  event.target.unMute();
                  const volume = Math.round(settings.masterVolume * 0.8); // 80% del volumen maestro
                  event.target.setVolume(volume);
                  setIsMuted(false);
                  event.target.playVideo();
                  console.log(
                    `✅ Video iniciado con audio habilitado (volumen: ${volume}%)`
                  );
                } else {
                  // Respetar configuración global: iniciar silenciado
                  event.target.mute();
                  setIsMuted(true);
                  event.target.playVideo();
                  console.log(
                    "🔇 Video iniciado silenciado por configuración global"
                  );
                }
              } catch (error) {
                console.warn(
                  "⚠️ Error al iniciar con configuración de audio:",
                  error
                );
                // Solo si falla completamente, usar fallback silenciado
                try {
                  event.target.mute();
                  setIsMuted(true);
                  event.target.playVideo();
                  console.log(
                    "📢 Video iniciado silenciado - fallback de error"
                  );
                } catch (fallbackError) {
                  console.warn("❌ Error en fallback:", fallbackError);
                }
              }
            };

            // Ejecutar inmediatamente
            initWithAudio();

            // Reintentos para asegurar reproducción
            setTimeout(initWithAudio, 100);
            setTimeout(initWithAudio, 500);

            // Reintento adicional para móviles
            if (isMobile) {
              setTimeout(initWithAudio, 1000);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              onPlay?.();
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              onPause?.();
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              onEnd?.();

              // Manually restart video if loop is enabled and it somehow stops
              if (loop && ytPlayerRef.current) {
                setTimeout(() => {
                  ytPlayerRef.current.seekTo(0);
                  ytPlayerRef.current.playVideo();
                }, 100);
              }
            }
          },
          onError: (event: any) => {
            const errorCode = event.data;
            let errorMessage = "Error desconocido";

            switch (errorCode) {
              case 2:
                errorMessage = "ID de video inválido";
                break;
              case 5:
                errorMessage = "Error de reproductor HTML5";
                break;
              case 100:
                errorMessage = "Video no encontrado o privado";
                break;
              case 101:
              case 150:
                errorMessage = "Video no disponible para reproducción embebida";
                break;
            }

            setError(errorMessage);
            setIsReady(false);
          },
        },
      });
    } catch (err) {
      setError("Error al cargar el reproductor de YouTube");
      console.error("YouTube Player Error:", err);
    }
  };

  // Prevent right-click context menu on video
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const playerElement = playerRef.current;
    if (playerElement) {
      playerElement.addEventListener("contextmenu", handleContextMenu);
      return () => {
        playerElement.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, [isReady]);

  // Auto-restart video if it stops unexpectedly - MÁS AGRESIVO
  useEffect(() => {
    if (!isReady || !ytPlayerRef.current) return;

    const checkVideoStatus = setInterval(() => {
      if (ytPlayerRef.current) {
        const state = ytPlayerRef.current.getPlayerState();
        // Si el video no está reproduciéndose, forzar reproducción
        if (state !== window.YT.PlayerState.PLAYING) {
          try {
            ytPlayerRef.current.seekTo(0);
            ytPlayerRef.current.playVideo();
          } catch (error) {
            console.warn("Error reiniciando video:", error);
          }
        }
      }
    }, 1000); // Verificar cada segundo (más frecuente)

    return () => clearInterval(checkVideoStatus);
  }, [isReady]);

  // Monitorear estado del audio y configuración
  useEffect(() => {
    if (isReady && ytPlayerRef.current) {
      console.log("=== AUDIO DEBUG INFO ===");
      console.log("🎵 ESTRATEGIA: Respetar configuración global de audio");
      console.log("Estado isMuted actual:", isMuted);
      console.log("Audio global habilitado:", settings.isAudioEnabled);
      console.log("Audio de video habilitado:", settings.videoAudioEnabled);
      console.log("Volumen maestro:", settings.masterVolume);
      console.log("Show controls:", showControls);

      // Verificar estado real del player
      const checkAudioState = () => {
        try {
          const actuallyMuted = ytPlayerRef.current.isMuted();
          const volume = ytPlayerRef.current.getVolume();
          console.log("Video realmente silenciado:", actuallyMuted);
          console.log("Volumen actual:", volume);

          // Si hay discrepancia entre el estado esperado y real
          if (actuallyMuted !== isMuted) {
            console.log("¡Discrepancia detectada! Corrigiendo...");
            setIsMuted(actuallyMuted);
          }

          // Si el video está silenciado cuando debería tener audio
          if (actuallyMuted) {
            console.log("🔇 Video silenciado - mostrando botón de activación");
          } else {
            console.log("🔊 Audio funcionando correctamente");
          }
        } catch (error) {
          console.warn("Error verificando estado de audio:", error);
        }
      };

      checkAudioState();

      // Verificar cada 2 segundos
      const interval = setInterval(checkAudioState, 2000);
      return () => clearInterval(interval);
    }
  }, [isReady, isMuted, showControls, settings]);

  // Efecto para actualizar el audio cuando cambien las configuraciones globales
  useEffect(() => {
    if (isReady && ytPlayerRef.current) {
      const shouldPlayWithAudio =
        settings.isAudioEnabled && settings.videoAudioEnabled;

      if (shouldPlayWithAudio && isMuted) {
        // Si el audio global está habilitado pero el video está silenciado, activar audio
        ytPlayerRef.current.unMute();
        const volume = Math.round(settings.masterVolume * 0.8);
        ytPlayerRef.current.setVolume(volume);
        setIsMuted(false);
        console.log(
          `🔊 Audio activado por configuración global (volumen: ${volume}%)`
        );
      } else if (!shouldPlayWithAudio && !isMuted) {
        // Si el audio global está deshabilitado pero el video tiene audio, silenciar
        ytPlayerRef.current.mute();
        setIsMuted(true);
        console.log("🔇 Audio silenciado por configuración global");
      } else if (shouldPlayWithAudio && !isMuted) {
        // Solo actualizar volumen si el audio ya está activo
        const volume = Math.round(settings.masterVolume * 0.8);
        ytPlayerRef.current.setVolume(volume);
        console.log(`🔊 Volumen actualizado: ${volume}%`);
      }
    }
  }, [
    isReady,
    settings.isAudioEnabled,
    settings.videoAudioEnabled,
    settings.masterVolume,
  ]);

  if (error) {
    return (
      <div className={`relative w-full ${className}`}>
        <div className="relative w-full h-0 pb-[56.25%]">
          {" "}
          {/* Aspect ratio 16:9 responsive */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 rounded-lg p-4 sm:p-8">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
                  Error de Video
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-4 px-2">
                  {error}
                </p>
                <Button
                  onClick={() => {
                    setError(null);
                    initializePlayer();
                  }}
                  variant="outline"
                  size="sm"
                  className="hover:bg-slate-50 text-xs sm:text-sm"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden w-full ${className}`}
      data-video-autoplay="true"
    >
      {/* YouTube Player Container - Diseño 100% responsive */}
      <div className="relative w-full h-0 pb-[56.25%]">
        {" "}
        {/* Aspect ratio 16:9 responsive */}
        <div
          ref={playerRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-auto"
        />
      </div>

      {/* Loading Overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
          <div className="text-center text-white px-4">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Cargando video...</p>
          </div>
        </div>
      )}

      {/* Controles de audio personalizados cuando los controles de YouTube están ocultos */}
      {isReady && !showControls && (
        <div className="absolute bottom-2 right-2 z-20 flex gap-2">
          <button
            onClick={() => {
              if (ytPlayerRef.current) {
                if (isMuted) {
                  // Solo activar si la configuración global lo permite
                  if (settings.isAudioEnabled && settings.videoAudioEnabled) {
                    ytPlayerRef.current.unMute();
                    const volume = Math.round(settings.masterVolume * 0.8);
                    ytPlayerRef.current.setVolume(volume);
                    setIsMuted(false);
                    console.log("Audio activado por usuario");
                  } else {
                    console.log("Audio bloqueado por configuración global");
                  }
                } else {
                  ytPlayerRef.current.mute();
                  setIsMuted(true);
                  console.log("Audio silenciado por usuario");
                }
              }
            }}
            className="bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all"
            title={isMuted ? "Activar audio" : "Silenciar audio"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Botón prominente para activar audio cuando está silenciado */}
      {isReady &&
        isMuted &&
        settings.isAudioEnabled &&
        settings.videoAudioEnabled && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto">
            <div className="bg-black/90 backdrop-blur-sm rounded-lg p-6 text-center text-white max-w-sm mx-4 shadow-2xl">
              <Volume2 className="w-12 h-12 mx-auto mb-3 text-blue-400 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">🔊 Activar Audio</h3>
              <p className="text-sm mb-4 text-gray-300">
                El video está reproduciéndose. Haz clic para escuchar el audio.
              </p>
              <Button
                onClick={() => {
                  if (ytPlayerRef.current) {
                    ytPlayerRef.current.unMute();
                    const volume = Math.round(settings.masterVolume * 0.8);
                    ytPlayerRef.current.setVolume(volume);
                    setIsMuted(false);
                    console.log("Audio activado por interacción del usuario");
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2"
                size="lg"
              >
                <Volume2 className="w-5 h-5 mr-2" />
                Activar Audio
              </Button>
            </div>
          </div>
        )}

      {/* Mensaje cuando el audio está deshabilitado globalmente */}
      {isReady && (!settings.isAudioEnabled || !settings.videoAudioEnabled) && (
        <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-auto">
          <div className="bg-orange-500/90 backdrop-blur-sm rounded-lg p-3 text-center text-white text-sm shadow-lg">
            <VolumeX className="w-4 h-4 inline mr-2" />
            Audio deshabilitado en configuración global
          </div>
        </div>
      )}

      {/* Overlay to prevent user interaction cuando no hay controles */}
      {isReady && !showControls && (
        <div className="absolute inset-0 bg-transparent pointer-events-none z-5" />
      )}

      {/* Video status indicator */}
      {isReady && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isPlaying ? "bg-red-500 animate-pulse" : "bg-gray-400"
            }`}
            title={isPlaying ? "Reproduciendo" : "Pausado"}
          />
          {/* Indicador de audio */}
          <div
            className={`w-3 h-3 rounded-full ${
              isMuted ? "bg-gray-400" : "bg-green-500"
            }`}
            title={isMuted ? "Sin audio" : "Con audio"}
          />
        </div>
      )}

      {/* Indicador de estado para pantallas pequeñas */}
      {isReady && (
        <div className="absolute bottom-2 left-2 z-20 sm:hidden">
          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            {isPlaying ? "▶️ Reproduciendo" : "⏸️ Pausado"}
            {!isMuted && " 🔊"}
          </div>
        </div>
      )}
    </div>
  );
}
