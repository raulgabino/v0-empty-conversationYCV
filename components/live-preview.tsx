"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock } from "lucide-react"
import type { Place } from "@/lib/types"

interface LivePreviewProps {
  places: Place[]
  isLoading: boolean
  vibeText: string
}

export function LivePreview({ places, isLoading, vibeText }: LivePreviewProps) {
  if (!vibeText.trim()) return null

  const topPlaces = places.slice(0, 3)

  return (
    <Card className="w-full max-w-sm bg-muted/30 border-muted">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Preview</h3>
          {isLoading ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 animate-spin" />
              Buscando...
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{places.length} lugares encontrados</span>
          )}
        </div>

        {!isLoading && topPlaces.length > 0 && (
          <div className="space-y-2">
            {topPlaces.map((place, index) => (
              <div key={place.id} className="flex items-start gap-2 p-2 rounded-md bg-background/50">
                <MapPin className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{place.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{place.category.replace("-", " ")}</p>
                </div>
              </div>
            ))}
            {places.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{places.length - 3} lugares más</p>
            )}
          </div>
        )}

        {!isLoading && places.length === 0 && vibeText.trim() && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No se encontraron lugares para "{vibeText.slice(0, 20)}..."
          </p>
        )}
      </CardContent>
    </Card>
  )
}
