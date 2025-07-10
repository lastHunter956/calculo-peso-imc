"use client";

import React from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import {
  Volume2,
  VolumeX,
  Settings,
  Music,
  Video,
  SpeakerIcon,
} from "lucide-react";
import { useAudioSettings } from "../contexts/AudioSettingsContext";

interface AudioSettingsPanelProps {
  className?: string;
}

export function AudioSettingsPanel({ className }: AudioSettingsPanelProps) {
  const {
    settings,
    toggleAudio,
    toggleSoundEffects,
    toggleVideoAudio,
    setMasterVolume,
  } = useAudioSettings();

  const handleVolumeChange = (value: number[]) => {
    setMasterVolume(value[0]);
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Audio
        </CardTitle>
        <CardDescription>
          Controla la configuración de audio para toda la página
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Control maestro de audio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="global-audio"
              className="flex items-center gap-2 text-sm font-medium"
            >
              {settings.isAudioEnabled ? (
                <Volume2 className="h-4 w-4 text-green-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-red-500" />
              )}
              Audio Global
            </Label>
            <Switch
              id="global-audio"
              checked={settings.isAudioEnabled}
              onCheckedChange={toggleAudio}
            />
          </div>
          <p className="text-xs text-gray-500">
            {settings.isAudioEnabled
              ? "El audio está habilitado en toda la página"
              : "Todo el audio está silenciado"}
          </p>
        </div>

        {/* Controles específicos (solo visibles si el audio global está habilitado) */}
        {settings.isAudioEnabled && (
          <>
            {/* Control de volumen maestro */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Volumen Maestro: {Math.round(settings.masterVolume)}%
              </Label>
              <Slider
                value={[settings.masterVolume]}
                onValueChange={handleVolumeChange}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* Control de efectos de sonido */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="effects-audio"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <SpeakerIcon className="h-4 w-4" />
                  Efectos de Sonido
                </Label>
                <Switch
                  id="effects-audio"
                  checked={settings.soundEffectsEnabled}
                  onCheckedChange={toggleSoundEffects}
                />
              </div>
              <p className="text-xs text-gray-500">
                Sonidos de botones, notificaciones y efectos
              </p>
            </div>

            {/* Control de audio de video */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="video-audio"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Video className="h-4 w-4" />
                  Audio de Videos
                </Label>
                <Switch
                  id="video-audio"
                  checked={settings.videoAudioEnabled}
                  onCheckedChange={toggleVideoAudio}
                />
              </div>
              <p className="text-xs text-gray-500">
                Audio de videos de YouTube y contenido multimedia
              </p>
            </div>
          </>
        )}

        {/* Botón de reset */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toggleAudio();
              if (!settings.isAudioEnabled) toggleAudio(); // Asegura que esté habilitado
              if (!settings.soundEffectsEnabled) toggleSoundEffects();
              if (!settings.videoAudioEnabled) toggleVideoAudio();
              setMasterVolume(80);
            }}
            className="w-full"
          >
            Restaurar Configuración por Defecto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
