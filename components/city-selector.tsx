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
    image: "/monterrey-mexico-cityscape-with-cerro-de-la-silla-.jpg",
    gradient: "from-blue-500/40 to-purple-500/40",
  },
  {
    id: "cdmx" as CityId,
    name: "Ciudad de México",
    subtitle: "CDMX",
    description: "Arte, parques y vida cosmopolita",
    image: "/mexico-city-cdmx-skyline-with-colorful-buildings-a.jpg",
    gradient: "from-emerald-500/40 to-cyan-500/40",
  },
  {
    id: "ciudad-victoria" as CityId,
    name: "Ciudad Victoria",
    subtitle: "Tamaulipas",
    description: "Historia, naturaleza y tranquilidad",
    image: "/ciudad-victoria-tamaulipas-historic-center-with-co.jpg",
    gradient: "from-orange-500/40 to-pink-500/40",
  },
  {
    id: "guadalajara" as CityId,
    name: "Guadalajara",
    subtitle: "Jalisco",
    description: "Mariachi, tequila y tradición tapatía",
    image: "/guadalajara-jalisco-cathedral-plaza-de-armas-histo.jpg",
    gradient: "from-amber-500/40 to-red-500/40",
  },
]

export function CitySelector({ selectedCity, onCitySelect }: CitySelectorProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">¿Dónde quieres explorar?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Selecciona tu ciudad para descubrir lugares increíbles que conecten con tu vibe
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {CITIES.map((city, index) => (
          <Card
            key={city.id}
            className={`group cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl overflow-hidden ${
              selectedCity === city.id ? "ring-4 ring-primary shadow-2xl animate-pulse-glow" : "hover:shadow-xl"
            }`}
            onClick={() => onCitySelect(city.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={city.image || "/placeholder.svg"}
                alt={`Vista de ${city.name}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${city.gradient} group-hover:opacity-80 transition-opacity duration-300`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm">
                <div className="p-4">
                  <h3 className="font-bold text-xl text-white">{city.name}</h3>
                  <p className="text-sm text-white/90">{city.subtitle}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-3">
              <p className="text-card-foreground text-center font-medium">{city.description}</p>

              {selectedCity === city.id && (
                <div className="flex items-center justify-center space-x-2 text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Seleccionada</span>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <p className="text-muted-foreground italic">
          Cada ciudad tiene su propia personalidad. ¿Cuál resuena contigo hoy?
        </p>
      </div>
    </div>
  )
}
