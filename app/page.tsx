"use client"

import { useState } from "react"
import { CitySelector } from "@/components/city-selector"
import { VibeInput } from "@/components/vibe-input"
import { ResultsDisplay } from "@/components/results-display"
import { ErrorDisplay } from "@/components/error-display"
import { ErrorBoundary } from "@/components/error-boundary"
import { presentForUI } from "@/lib/ui-presenter"
import { validateCity, validateVibeText, getErrorMessage } from "@/lib/validation"
import { useToast } from "@/hooks/use-toast"
import type { CityId, YCVResponse, UIPresentation } from "@/lib/types"

type AppState = "city-selection" | "vibe-input" | "results" | "error"

export default function HomePage() {
  const [state, setState] = useState<AppState>("city-selection")
  const [selectedCity, setSelectedCity] = useState<CityId | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<UIPresentation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCitySelect = (city: CityId) => {
    const validation = validateCity(city)
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
    setState("vibe-input")
  }

  const handleVibeSubmit = async (vibeText: string) => {
    if (!selectedCity) {
      toast({
        title: "Error",
        description: "Por favor selecciona una ciudad primero",
        variant: "destructive",
      })
      return
    }

    const validation = validateVibeText(vibeText)
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch("/api/generate-vibes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city_id: selectedCity,
          user_text: vibeText,
          mode: "walking",
          max_stops: 4,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Demasiadas solicitudes. Espera un momento e intenta de nuevo.")
        }
        if (response.status >= 500) {
          throw new Error("Error del servidor. Intenta de nuevo en unos momentos.")
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al generar el plan")
      }

      const data: YCVResponse = await response.json()

      if (!data || !data.selection || data.selection.length === 0) {
        throw new Error("No se encontraron lugares para tu búsqueda. Intenta con una descripción diferente.")
      }

      const uiData = presentForUI(data)
      setResults(uiData)
      setState("results")

      toast({
        title: "¡Plan creado!",
        description: `Encontramos ${data.selection.length} lugares perfectos para ti`,
      })
    } catch (error) {
      console.error("Error generating vibes:", error)

      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      setState("error")

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSearch = () => {
    setState("city-selection")
    setSelectedCity(null)
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
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">Your City Vibes</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubre los lugares perfectos para tu estado de ánimo en las ciudades más vibrantes de México
            </p>
          </div>

          {/* Content */}
          <div className="flex justify-center">
            {state === "city-selection" && (
              <div className="w-full max-w-4xl">
                <CitySelector selectedCity={selectedCity} onCitySelect={handleCitySelect} />
              </div>
            )}

            {state === "vibe-input" && <VibeInput onSubmit={handleVibeSubmit} isLoading={isLoading} />}

            {state === "results" && results && <ResultsDisplay results={results} onNewSearch={handleNewSearch} />}

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
