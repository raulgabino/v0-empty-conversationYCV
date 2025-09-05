"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Car, PersonStanding } from "lucide-react"
import type { TravelMode } from "@/lib/types"

interface TransportSelectorProps {
  selectedMode: TravelMode
  onModeSelect: (mode: TravelMode) => void
}

export function TransportSelector({ selectedMode, onModeSelect }: TransportSelectorProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-center mb-4 text-foreground">¿Cómo te vas a mover?</h3>

      <div className="grid grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all hover:scale-105 ${
            selectedMode === "walking" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
          }`}
          onClick={() => onModeSelect("walking")}
        >
          <CardContent className="p-6 text-center">
            <PersonStanding className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h4 className="font-semibold text-foreground mb-1">Caminando</h4>
            <p className="text-sm text-muted-foreground">Perfecto para explorar a pie</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:scale-105 ${
            selectedMode === "driving" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
          }`}
          onClick={() => onModeSelect("driving")}
        >
          <CardContent className="p-6 text-center">
            <Car className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h4 className="font-semibold text-foreground mb-1">En Coche</h4>
            <p className="text-sm text-muted-foreground">Cubre más distancia fácilmente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
