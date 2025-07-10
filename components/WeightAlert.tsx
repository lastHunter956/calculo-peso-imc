"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, Play, ExternalLink, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { YouTubePlayer } from "./YouTubePlayer";
import { CollisionButton } from "./CollisionButton";
import { AdvancedWebGLParticleSystem } from "./AdvancedWebGLParticleSystem";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";
import type { WeightThreshold } from "@/hooks/useWeightMonitor";

interface WeightAlertProps {
  threshold: WeightThreshold;
  weight: number;
  gender: string;
  unit: string;
  isVisible: boolean;
  autoPlayVideo?: boolean;
  onDismiss: () => void;
  onVideoPlay?: () => void;
  onVideoEnd?: () => void;
  className?: string;
}

export function WeightAlert({
  threshold,
  weight,
  gender,
  unit,
  isVisible,
  autoPlayVideo = true,
  onDismiss,
  onVideoPlay,
  onVideoEnd,
  className = "",
}: WeightAlertProps) {
  const [showVideo, setShowVideo] = useState(autoPlayVideo);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const { playSound } = useAudioFeedback();

  useEffect(() => {
    if (isVisible) {
      setShowParticles(true);
      playSound("error");
    }
  }, [isVisible, playSound]);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "warning":
        return {
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-800",
          badgeColor: "bg-amber-100 text-amber-800",
          iconColor: "text-amber-600",
          particleType: "error" as const,
        };
      case "alert":
        return {
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-800",
          badgeColor: "bg-orange-100 text-orange-800",
          iconColor: "text-orange-600",
          particleType: "error" as const,
        };
      case "critical":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          badgeColor: "bg-red-100 text-red-800",
          iconColor: "text-red-600",
          particleType: "error" as const,
        };
      default:
        return {
          bgColor: "bg-slate-50",
          borderColor: "border-slate-200",
          textColor: "text-slate-800",
          badgeColor: "bg-slate-100 text-slate-800",
          iconColor: "text-slate-600",
          particleType: "hover" as const,
        };
    }
  };

  const config = getSeverityConfig(threshold.severity);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${className}`}
    >
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <AdvancedWebGLParticleSystem
          isActive={showParticles}
          audioType={config.particleType}
          intensity={2}
          enableCollisions={true}
          enableMagnetism={true}
          className="opacity-30"
        />
      </div>

      <Card
        className={`relative w-full max-w-2xl ${config.bgColor} ${config.borderColor} border-2 shadow-2xl animate-in fade-in zoom-in-95 duration-500`}
      >
        {/* Close Button */}
        <CollisionButton
          onClick={() => {
            onDismiss();
            playSound("navigation");
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
            <div
              className={`p-3 rounded-full ${config.bgColor} border ${config.borderColor}`}
            >
              <AlertTriangle className={`w-6 h-6 ${config.iconColor}`} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className={`text-xl font-bold ${config.textColor}`}>
                  Alerta de Peso
                </CardTitle>
                <Badge className={`${config.badgeColor} text-xs font-medium`}>
                  {threshold.severity.toUpperCase()}
                </Badge>
              </div>

              <p className={`text-sm ${config.textColor} opacity-90`}>
                {threshold.message}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Weight Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <div className={`text-2xl font-bold ${config.textColor}`}>
                {weight} {unit}
              </div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">
                Peso Actual
              </div>
            </div>

            <div className="text-center p-3 bg-white/70 rounded-lg">
              <div
                className={`text-lg font-semibold ${config.textColor} capitalize`}
              >
                {gender === "female" ? "Femenino" : "Masculino"}
              </div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">
                Género
              </div>
            </div>

            <div className="text-center p-3 bg-white/70 rounded-lg">
              <div className={`text-lg font-semibold ${config.textColor}`}>
                {threshold.name}
              </div>
              <div className="text-xs text-slate-600 uppercase tracking-wide">
                Categoría
              </div>
            </div>
          </div>

          {/* Video Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3
                className={`text-lg font-semibold ${config.textColor} flex items-center gap-2`}
              >
                <Heart className="w-5 h-5" />
                Video Informativo
              </h3>

              {!showVideo && (
                <CollisionButton
                  onClick={() => {
                    setShowVideo(true);
                    playSound("success");
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
                  autoPlay={autoPlayVideo}
                  // Audio habilitado por defecto - ya no se necesita muted={false}
                  onPlay={() => {
                    setIsVideoPlaying(true);
                    onVideoPlay?.();
                  }}
                  onPause={() => {
                    setIsVideoPlaying(false);
                  }}
                  onEnd={() => {
                    setIsVideoPlaying(false);
                    onVideoEnd?.();
                  }}
                  className="w-full h-64 rounded-lg overflow-hidden"
                  showControls={true}
                  allowFullscreen={true}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/50">
            <CollisionButton
              onClick={() => {
                onDismiss();
                playSound("navigation");
              }}
              audioType="navigation"
              intensity={1.5}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
            >
              Entendido
            </CollisionButton>

            <CollisionButton
              onClick={() => {
                window.open(
                  `https://www.youtube.com/watch?v=${threshold.videoId}`,
                  "_blank"
                );
                playSound("click");
              }}
              audioType="click"
              variant="outline"
              intensity={1}
              className="px-4 border-slate-300 hover:bg-white/70"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver en YouTube
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
  );
}
