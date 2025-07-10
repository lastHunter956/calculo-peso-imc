"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AudioSettings {
  isAudioEnabled: boolean;
  masterVolume: number;
  soundEffectsEnabled: boolean;
  videoAudioEnabled: boolean;
}

interface AudioSettingsContextType {
  settings: AudioSettings;
  updateSettings: (newSettings: Partial<AudioSettings>) => void;
  toggleAudio: () => void;
  toggleSoundEffects: () => void;
  toggleVideoAudio: () => void;
  setMasterVolume: (volume: number) => void;
}

const defaultSettings: AudioSettings = {
  isAudioEnabled: true,
  masterVolume: 50,
  soundEffectsEnabled: true,
  videoAudioEnabled: true,
};

const AudioSettingsContext = createContext<
  AudioSettingsContextType | undefined
>(undefined);

interface AudioSettingsProviderProps {
  children: ReactNode;
}

export function AudioSettingsProvider({
  children,
}: AudioSettingsProviderProps) {
  const [settings, setSettings] = useState<AudioSettings>(defaultSettings);

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("audioSettings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (error) {
          console.warn("Error al cargar configuración de audio:", error);
        }
      }
    }
  }, []);

  // Guardar configuración cuando cambie
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("audioSettings", JSON.stringify(settings));
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AudioSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const toggleAudio = () => {
    updateSettings({ isAudioEnabled: !settings.isAudioEnabled });
  };

  const toggleSoundEffects = () => {
    updateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled });
  };

  const toggleVideoAudio = () => {
    updateSettings({ videoAudioEnabled: !settings.videoAudioEnabled });
  };

  const setMasterVolume = (volume: number) => {
    updateSettings({ masterVolume: Math.max(0, Math.min(100, volume)) });
  };

  const contextValue: AudioSettingsContextType = {
    settings,
    updateSettings,
    toggleAudio,
    toggleSoundEffects,
    toggleVideoAudio,
    setMasterVolume,
  };

  return (
    <AudioSettingsContext.Provider value={contextValue}>
      {children}
    </AudioSettingsContext.Provider>
  );
}

export function useAudioSettings() {
  const context = useContext(AudioSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useAudioSettings debe usarse dentro de AudioSettingsProvider"
    );
  }
  return context;
}

// Hook para verificar si un tipo específico de audio está habilitado
export function useAudioEnabled(
  type: "soundEffects" | "videoAudio" = "soundEffects"
) {
  const { settings } = useAudioSettings();

  if (!settings.isAudioEnabled) return false;

  switch (type) {
    case "soundEffects":
      return settings.soundEffectsEnabled;
    case "videoAudio":
      return settings.videoAudioEnabled;
    default:
      return false;
  }
}
