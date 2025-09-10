"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, MapPin, Clock, ArrowRight } from "lucide-react"
import type { CityId } from "@/lib/types"

interface FeaturedVibeData {
  vibe: string
  title: string
  article: string
  images: Array<{
    url: string
    alt: string
    caption: string
  }>
  suggestedRoute: {
    places: string[]
    duration: string
  }
}

interface FeaturedVibeHeroProps {
  selectedCity: CityId
  onExploreRoute: (vibe: string, places: string[]) => void
}

export function FeaturedVibeHero({ selectedCity, onExploreRoute }: FeaturedVibeHeroProps) {
  const [featuredVibe, setFeaturedVibe] = useState<FeaturedVibeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateFeaturedVibe = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/generate-featured-vibe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city_id: selectedCity,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        })

        if (!response.ok) {
          throw new Error("Error al generar vibra sugerida")
        }

        const data = await response.json()
        setFeaturedVibe(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    generateFeaturedVibe()
  }, [selectedCity])

  const handleExploreRoute = () => {
    if (featuredVibe) {
      onExploreRoute(featuredVibe.vibe, featuredVibe.suggestedRoute.places)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-12">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Generando tu vibra del día...</p>
        </Card>
      </div>
    )
  }

  if (error || !featuredVibe) {
    return null
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">
      <Card className="overflow-hidden bg-gradient-to-br from-card via-card/95 to-muted/20 border-2 border-primary/10">
        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Clock className="h-4 w-4" />
              Vibra del momento
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-balance mb-2">{featuredVibe.title}</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{featuredVibe.suggestedRoute.duration}</span>
              <span>•</span>
              <span>{featuredVibe.suggestedRoute.places.length} lugares</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {featuredVibe.images.map((image, index) => (
              <div key={index} className="relative group overflow-hidden rounded-lg">
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={image.alt}
                  className="w-full h-48 md:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-sm font-medium text-pretty">{image.caption}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="prose prose-sm md:prose-base max-w-none mb-6">
            <p className="text-muted-foreground leading-relaxed text-pretty">{featuredVibe.article}</p>
          </div>

          <div className="text-center">
            <Button
              onClick={handleExploreRoute}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Explorar esta ruta
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
