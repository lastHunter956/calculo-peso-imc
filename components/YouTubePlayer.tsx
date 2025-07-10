"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface YouTubePlayerProps {
  videoId: string
  autoPlay?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnd?: () => void
  className?: string
  showControls?: boolean
  allowFullscreen?: boolean
  loop?: boolean
  muted?: boolean
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function YouTubePlayer({
  videoId,
  autoPlay = false,
  onPlay,
  onPause,
  onEnd,
  className = "",
  showControls = false, // Changed default to false
  allowFullscreen = false, // Changed default to false
  loop = true, // Added loop option, default true
  muted = true, // Added muted option, default true
}: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const ytPlayerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load YouTube API
  useEffect(() => {
    if (window.YT) {
      initializePlayer()
      return
    }

    // Load YouTube API script
    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    document.body.appendChild(script)

    window.onYouTubeIframeAPIReady = () => {
      initializePlayer()
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const initializePlayer = () => {
    if (!playerRef.current || !window.YT) return

    try {
      ytPlayerRef.current = new window.YT.Player(playerRef.current, {
        videoId: videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          controls: showControls ? 1 : 0, // Remove controls
          modestbranding: 1,
          rel: 0,
          fs: allowFullscreen ? 1 : 0, // Disable fullscreen
          cc_load_policy: 0, // Disable captions
          iv_load_policy: 3, // Disable annotations
          autohide: 1,
          disablekb: 1, // Disable keyboard controls
          loop: loop ? 1 : 0, // Enable loop
          playlist: loop ? videoId : undefined, // Required for loop to work
          mute: muted ? 1 : 0, // Mute by default
          playsinline: 1, // Play inline on mobile
          start: 0, // Start from beginning
          enablejsapi: 1, // Enable JS API
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true)
            setError(null)

            // Set volume to 0 if muted
            if (muted) {
              event.target.mute()
            }

            if (autoPlay) {
              event.target.playVideo()
            }
          },
          onStateChange: (event: any) => {
            const state = event.data
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              onPlay?.()
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              onPause?.()
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              onEnd?.()

              // Manually restart video if loop is enabled and it somehow stops
              if (loop && ytPlayerRef.current) {
                setTimeout(() => {
                  ytPlayerRef.current.seekTo(0)
                  ytPlayerRef.current.playVideo()
                }, 100)
              }
            }
          },
          onError: (event: any) => {
            const errorCode = event.data
            let errorMessage = "Error desconocido"

            switch (errorCode) {
              case 2:
                errorMessage = "ID de video inválido"
                break
              case 5:
                errorMessage = "Error de reproductor HTML5"
                break
              case 100:
                errorMessage = "Video no encontrado o privado"
                break
              case 101:
              case 150:
                errorMessage = "Video no disponible para reproducción embebida"
                break
            }

            setError(errorMessage)
            setIsReady(false)
          },
        },
      })
    } catch (err) {
      setError("Error al cargar el reproductor de YouTube")
      console.error("YouTube Player Error:", err)
    }
  }

  // Prevent right-click context menu on video
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const playerElement = playerRef.current
    if (playerElement) {
      playerElement.addEventListener("contextmenu", handleContextMenu)
      return () => {
        playerElement.removeEventListener("contextmenu", handleContextMenu)
      }
    }
  }, [isReady])

  // Auto-restart video if it stops unexpectedly
  useEffect(() => {
    if (!loop || !isReady || !ytPlayerRef.current) return

    const checkVideoStatus = setInterval(() => {
      if (ytPlayerRef.current) {
        const state = ytPlayerRef.current.getPlayerState()
        // If video is paused or ended, restart it
        if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
          ytPlayerRef.current.seekTo(0)
          ytPlayerRef.current.playVideo()
        }
      }
    }, 2000) // Check every 2 seconds

    return () => clearInterval(checkVideoStatus)
  }, [isReady, loop])

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 rounded-lg p-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Error de Video</h3>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <Button
              onClick={() => {
                setError(null)
                initializePlayer()
              }}
              variant="outline"
              size="sm"
              className="hover:bg-slate-50"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* YouTube Player Container */}
      <div
        ref={playerRef}
        className="w-full h-full min-h-[200px] pointer-events-none"
        style={{ aspectRatio: "16/9" }}
      />

      {/* Loading Overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Cargando video...</p>
          </div>
        </div>
      )}

      {/* Overlay to prevent user interaction */}
      {isReady && !showControls && <div className="absolute inset-0 bg-transparent pointer-events-auto" />}

      {/* Video status indicator (optional) */}
      {isReady && (
        <div className="absolute top-2 right-2 z-10">
          <div className={`w-3 h-3 rounded-full ${isPlaying ? "bg-red-500 animate-pulse" : "bg-gray-400"}`} />
        </div>
      )}
    </div>
  )
}
