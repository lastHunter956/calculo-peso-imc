"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Volume2, VolumeX } from "lucide-react";
import { useAudioSettings } from "../contexts/AudioSettingsContext";
import { AudioSettingsPanel } from "./AudioSettingsPanel";

export function AudioSettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, toggleAudio } = useAudioSettings();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex flex-col gap-2">
          {/* Botón de toggle rápido */}
          <Button
            onClick={toggleAudio}
            size="icon"
            variant={settings.isAudioEnabled ? "default" : "destructive"}
            className="rounded-full shadow-lg hover:scale-105 transition-transform"
            title={
              settings.isAudioEnabled
                ? "Silenciar todo el audio"
                : "Activar audio"
            }
          >
            {settings.isAudioEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>

          {/* Botón para abrir configuración avanzada */}
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-2 py-1 shadow-lg bg-white/90 backdrop-blur-sm"
            >
              Configurar
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-md">
          <AudioSettingsPanel />
        </DialogContent>
      </Dialog>
    </div>
  );
}
