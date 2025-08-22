"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ExternalLink } from "lucide-react"
import type { UIPresentation } from "@/lib/types"

interface ResultsDisplayProps {
  results: UIPresentation
  onNewSearch: () => void
}

export function ResultsDisplay({ results, onNewSearch }: ResultsDisplayProps) {
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
              {results.header.badge === "chill-cafe" ? "Chill & Café" : "Arte & Cultura"}
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
        {results.cards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-card-foreground mb-2">{card.title}</h3>
                  <p className="text-muted-foreground text-sm">{card.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <span className="text-2xl font-bold">{card.order}</span>
                </div>
              </div>

              {card.coords && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>Coordenadas: {card.coords}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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
