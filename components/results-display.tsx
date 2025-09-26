"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ExternalLink } from "lucide-react"
import type { UIPresentation } from "@/lib/types"
import { getPlaceImageUrl } from "@/lib/image-utils"

interface ResultsDisplayProps {
  results: UIPresentation | null
  isLoading?: boolean
  onNewSearch: () => void
}

function SkeletonLoader() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="animate-pulse">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-8 w-32 bg-muted rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 w-3/4 mx-auto bg-muted rounded-md"></div>
            <div className="h-6 w-1/2 mx-auto bg-muted rounded-md"></div>
          </div>
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 w-3/5 bg-muted rounded-md mb-3"></div>
              <div className="h-4 w-4/5 bg-muted rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ResultsDisplay({ results, isLoading, onNewSearch }: ResultsDisplayProps) {
  if (isLoading) {
    return <SkeletonLoader />
  }

  if (!results) {
    return null
  }

  const handleOpenRoute = () => {
    window.open(results.cta.url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              {results.header.badge.replace(/_/g, " ").replace(/-/g, " ")}
            </Badge>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-card-foreground">{results.header.title}</CardTitle>
            <p className="text-muted-foreground text-lg">{results.header.subtitle}</p>
          </div>
        </CardHeader>
      </Card>

      {/* Places Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {results.cards.map((card, index) => {
          const cityName = results.header.title.split(" en ")[1]?.split(",")[0] || "México"
          const imageUrl = getPlaceImageUrl(card, cityName)

          console.log("[v0] Card:", card.title)
          console.log("[v0] City:", cityName)
          console.log("[v0] Generated URL:", imageUrl)

          return (
            <Card
              key={index}
              className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="relative">
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={card.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log("[v0] Image failed to load:", imageUrl)
                      e.currentTarget.src = "/abstract-place.png"
                    }}
                    onLoad={() => {
                      console.log("[v0] Image loaded successfully:", imageUrl)
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                    {card.order}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-card-foreground leading-tight">{card.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{card.subtitle}</p>
                    </div>

                    {card.coords && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Coordenadas: {card.coords}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleOpenRoute} size="lg" className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          {results.cta.text}
        </Button>
        <Button onClick={onNewSearch} variant="outline" size="lg">
          Nueva búsqueda
        </Button>
      </div>
    </div>
  )
}
