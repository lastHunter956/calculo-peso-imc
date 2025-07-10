"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, Settings } from "lucide-react"
import { useState } from "react"
import { useAudioFeedback } from "@/hooks/useAudioFeedback"

export function AudioControls() {
  const { isEnabled, volume, toggleAudio, setVolume, playSound } = useAudioFeedback()
  const [showControls, setShowControls] = useState(false)

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex flex-col items-end gap-2">
        {/* Settings Button */}
        <Button
          onClick={() => {
            setShowControls(!showControls)
            playSound("click")
          }}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-slate-200 hover:bg-white hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Settings className="w-4 h-4" />
        </Button>

        {/* Audio Controls Panel */}
        {showControls && (
          <Card className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <CardContent className="p-4 space-y-4 min-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Audio</span>
                <Button
                  onClick={toggleAudio}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 hover:bg-slate-100 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {isEnabled ? (
                    <Volume2 className="w-4 h-4 text-slate-700" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                </Button>
              </div>

              {isEnabled && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-600">Volumen</label>
                  <Slider
                    value={[volume * 100]}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex gap-1">
                <Button
                  onClick={() => playSound("hover")}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7 hover:bg-slate-50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Hover
                </Button>
                <Button
                  onClick={() => playSound("click")}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7 hover:bg-slate-50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Click
                </Button>
                <Button
                  onClick={() => playSound("success")}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7 hover:bg-slate-50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Success
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
