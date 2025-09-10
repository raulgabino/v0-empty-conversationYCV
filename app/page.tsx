"use client"

import { useState } from "react"
import { CitySelector } from "@/components/city-selector"
import { VibeInput } from "@/components/vibe-input"
import { TransportSelector } from "@/components/transport-selector"
import { ResultsDisplay } from "@/components/results-display"
import { ErrorDisplay } from "@/components/error-display"
import { ErrorBoundary } from "@/components/error-boundary"
import { presentForUI } from "@/lib/ui-presenter"
import { validateCity, validateVibeText, getErrorMessage } from "@/lib/validation"
import { useToast } from "@/hooks/use-toast"
import type { CityId, TravelMode, YCVResponse, UIPresentation } from "@/lib/types"

type AppState = "city-selection" | "transport-selection" | "vibe-input" | "results" | "error"

export default function HomePage() {
  const [state, setState] = useState<AppState>("city-selection")
  const [selectedCity, setSelectedCity] = useState<CityId | null>(null)
  const [selectedMode, setSelectedMode] = useState<TravelMode>("walking")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<UIPresentation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCitySelect = (city: CityId) => {
    console.log("[v0] City selected:", city) // debug log para verificar selección
    const validation = validateCity(city)
    console.log("[v0] Validation result:", validation) // debug log para verificar validación
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    setSelectedCity(city)
    setError(null)
    setState("transport-selection")
  }

  const handleModeSelect = (mode: TravelMode) => {
    setSelectedMode(mode)
    setState("vibe-input")
  }

  const handleVibeSubmit = async (vibeText: string) => {
    if (!selectedCity) return

    const validation = validateVibeText(vibeText)
    if (!validation.valid) {
      toast({ title: "Error", description: validation.error, variant: "destructive" })
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)
    setState("results")

    try {
      const response = await fetch("/api/generate-vibes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city_id: selectedCity,
          user_text: vibeText,
          mode: selectedMode,
          max_stops: 4,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al generar el plan")
      }

      const data: YCVResponse = await response.json()
      setResults(presentForUI(data))

      toast({
        title: "¡Plan creado!",
        description: `Encontramos ${data.selection.length} lugares perfectos para ti`,
      })
    } catch (error) {
      console.error("Error generating vibes:", error)
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      setState("error")
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSearch = () => {
    setState("city-selection")
    setSelectedCity(null)
    setSelectedMode("walking")
    setResults(null)
    setError(null)
  }

  const handleRetry = () => {
    if (selectedCity) {
      setState("vibe-input")
      setError(null)
    } else {
      handleNewSearch()
    }
  }

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-16 space-y-6">
            <div className="animate-float">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6">
                Your City Vibes
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
              Descubre los lugares perfectos para tu estado de ánimo en las ciudades más vibrantes de México
            </p>
            <div className="flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full" />
            </div>
          </div>

          <div className="flex justify-center">
            {state === "city-selection" && (
              <div className="w-full max-w-6xl">
                <CitySelector selectedCity={selectedCity} onCitySelect={handleCitySelect} />
              </div>
            )}

            {state === "transport-selection" && (
              <TransportSelector selectedMode={selectedMode} onModeSelect={handleModeSelect} />
            )}

            {state === "vibe-input" && (
              <VibeInput onSubmit={handleVibeSubmit} isLoading={isLoading} selectedCity={selectedCity} />
            )}

            {state === "results" && (
              <ResultsDisplay results={results} isLoading={isLoading && !results} onNewSearch={handleNewSearch} />
            )}

            {state === "error" && error && (
              <ErrorDisplay
                title="No pudimos crear tu plan"
                message={error}
                onRetry={handleRetry}
                onGoHome={handleNewSearch}
              />
            )}
          </div>
        </div>
      </main>
    </ErrorBoundary>
  )
}
