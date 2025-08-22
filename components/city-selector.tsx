"use client"
import { Card, CardContent } from "@/components/ui/card"
import type { CityId } from "@/lib/types"

interface CitySelectorProps {
  selectedCity: CityId | null
  onCitySelect: (city: CityId) => void
}

const CITIES = [
  {
    id: "monterrey" as CityId,
    name: "Monterrey",
    subtitle: "Nuevo León",
    description: "Montañas, museos y cultura regia",
  },
  {
    id: "cdmx" as CityId,
    name: "Ciudad de México",
    subtitle: "CDMX",
    description: "Arte, parques y vida cosmopolita",
  },
  {
    id: "ciudad-victoria" as CityId,
    name: "Ciudad Victoria",
    subtitle: "Tamaulipas",
    description: "Historia, naturaleza y tranquilidad",
  },
]

export function CitySelector({ selectedCity, onCitySelect }: CitySelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">¿Dónde quieres explorar?</h2>
        <p className="text-muted-foreground">Selecciona tu ciudad para descubrir lugares increíbles</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {CITIES.map((city) => (
          <Card
            key={city.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedCity === city.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
            onClick={() => onCitySelect(city.id)}
          >
            <CardContent className="p-6 text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-primary rounded-full" />
              </div>
              <h3 className="font-semibold text-lg text-card-foreground">{city.name}</h3>
              <p className="text-sm text-primary font-medium">{city.subtitle}</p>
              <p className="text-sm text-muted-foreground">{city.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
