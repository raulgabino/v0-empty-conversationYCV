import { z } from "zod"
import type { UserInput, YCVResponse } from "./types"
import { DATASET } from "./dataset"
import { buildGoogleMapsUrl, orderPlacesByProximity } from "./utils-ycv"

// Zod schemas for validation
const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  vibes: z.array(
    z.enum([
      "chill-cafe",
      "arte-cultura",
      "BELLAQUEO",
      "STREET_FOOD",
      "LIVE_MUSIC",
      "MIRADORES_FOTOS",
      "DEPORTES_JUEGO",
      "FAMILY_KIDS",
      "NIGHTLIFE",
      "SHOPPING",
      "FOOD_GOURMET",
      "LOCAL_AUTHENTIC",
      "CHILL_CAFE",
      "ARTE_CULTURA",
    ]),
  ),
  address: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
})

const YCVResponseSchema = z.object({
  input: z.object({
    city_id: z.enum(["ciudad-victoria", "monterrey", "cdmx"]),
    user_text: z.string(),
    mode: z.enum(["walking", "driving"]),
    max_stops: z.number().min(1).max(5),
  }),
  vibe: z.object({
    vibe_code: z.enum([
      "chill-cafe",
      "arte-cultura",
      "BELLAQUEO",
      "STREET_FOOD",
      "LIVE_MUSIC",
      "MIRADORES_FOTOS",
      "DEPORTES_JUEGO",
      "FAMILY_KIDS",
      "NIGHTLIFE",
      "SHOPPING",
      "FOOD_GOURMET",
      "LOCAL_AUTHENTIC",
      "CHILL_CAFE",
      "ARTE_CULTURA",
    ]),
    confidence: z.number().min(0).max(1),
    keywords: z.array(z.string()),
  }),
  selection: z.array(PlaceSchema).min(1).max(5),
  route: z.object({
    mode: z.enum(["walking", "driving"]),
    ordered: z.array(PlaceSchema),
    gmaps_url: z.string().url(),
  }),
  ui_copy: z.object({
    title: z.string(),
    subtitle: z.string(),
  }),
})

export class YCVAIService {
  async generateCityVibes(input: UserInput): Promise<YCVResponse> {
    try {
      return this.generateMockResponse(input)
    } catch (error) {
      console.error("Error en generateCityVibes:", error)
      throw error
    }
  }

  // El sistema de mock no cambia, sigue siendo nuestro excelente plan B
  private generateMockResponse(input: UserInput): YCVResponse {
    const cityData = DATASET.cities.find((city) => city.id === input.city_id)
    if (!cityData) {
      throw new Error(`City ${input.city_id} not found`)
    }

    // Enhanced vibe detection with all available vibes
    const userTextLower = input.user_text.toLowerCase()
    let detectedVibe: any = "arte-cultura" // Default vibe

    const vibeKeywords: { [key: string]: string[] } = {
      "chill-cafe": ["café", "coffee", "tranquilo", "relax", "chill", "quieto", "trabajo", "wifi"],
      CHILL_CAFE: ["café", "coffee", "tranquilo", "relax", "chill", "quieto", "trabajo", "wifi"],
      "arte-cultura": ["arte", "cultura", "museo", "historia", "galería", "cultural"],
      ARTE_CULTURA: ["arte", "cultura", "museo", "historia", "galería", "cultural"],
      BELLAQUEO: ["fiesta", "noche", "antro", "bar", "reggaeton", "perreo", "baile", "party"],
      STREET_FOOD: ["tacos", "calle", "comida", "garnacha", "mercado", "street food", "antojitos"],
      LIVE_MUSIC: ["música en vivo", "concierto", "banda", "show", "música", "live", "cantante"],
      MIRADORES_FOTOS: ["vista", "fotos", "mirador", "paisaje", "panorámica", "selfie", "instagram"],
      DEPORTES_JUEGO: ["deporte", "juego", "estadio", "partido", "ejercicio", "futbol", "basketball"],
      FAMILY_KIDS: ["familia", "niños", "parque", "divertido", "familiar", "kids", "children"],
      NIGHTLIFE: ["noche", "vida nocturna", "bares", "clubs", "drinks", "cocktails", "copas"],
      SHOPPING: ["compras", "shopping", "tiendas", "mall", "centro comercial", "boutique"],
      FOOD_GOURMET: ["restaurante", "gourmet", "fine dining", "chef", "gastronomía", "comida fina"],
      LOCAL_AUTHENTIC: ["auténtico", "local", "tradicional", "típico", "regional", "genuino"],
    }

    // Find best matching vibe
    let bestMatch = { vibe: "arte-cultura", score: 0 }

    for (const vibe in vibeKeywords) {
      const matches = vibeKeywords[vibe].filter((keyword) => userTextLower.includes(keyword)).length
      if (matches > bestMatch.score) {
        bestMatch = { vibe, score: matches }
      }
    }

    detectedVibe = bestMatch.vibe

    // Filter places by detected vibe with fallback to similar vibes
    let matchingPlaces = cityData.places.filter((place) =>
      place.vibes.some(
        (vibe) =>
          vibe.toLowerCase() === detectedVibe.toLowerCase() ||
          vibe.replace("_", "-").toLowerCase() === detectedVibe.replace("_", "-").toLowerCase(),
      ),
    )

    // If no matches, try broader categories
    if (matchingPlaces.length === 0) {
      matchingPlaces = cityData.places.filter(
        (place) => place.vibes.includes("arte-cultura") || place.vibes.includes("ARTE_CULTURA"),
      )
    }

    // Randomize selection to ensure variety
    const shuffled = [...matchingPlaces].sort(() => Math.random() - 0.5)
    const selectedPlaces = shuffled.slice(0, input.max_stops || 4)

    // Order places optimally
    const orderedPlaces = orderPlacesByProximity(selectedPlaces)

    // Generate Google Maps URL
    const gmapsUrl = buildGoogleMapsUrl(orderedPlaces, input.mode || "walking")

    // Generate UI copy based on vibe
    const vibeNames: { [key: string]: string } = {
      "chill-cafe": "Cafés y Relax",
      CHILL_CAFE: "Cafés y Relax",
      "arte-cultura": "Arte y Cultura",
      ARTE_CULTURA: "Arte y Cultura",
      BELLAQUEO: "Vida Nocturna Urbana",
      STREET_FOOD: "Comida Callejera",
      LIVE_MUSIC: "Música en Vivo",
      MIRADORES_FOTOS: "Spots para Fotos",
      DEPORTES_JUEGO: "Deportes y Juegos",
      FAMILY_KIDS: "Familiar con Niños",
      NIGHTLIFE: "Vida Nocturna",
      SHOPPING: "Compras",
      FOOD_GOURMET: "Gastronomía Gourmet",
      LOCAL_AUTHENTIC: "Auténtico Local",
    }

    const uiCopy = {
      title: `${vibeNames[detectedVibe] || "Ruta Sugerida"} en ${cityData.name}`,
      subtitle: `${selectedPlaces.length} lugares perfectos para tu vibe`,
    }

    return {
      input: {
        city_id: input.city_id,
        user_text: input.user_text,
        mode: input.mode || "walking",
        max_stops: input.max_stops || 4,
      },
      vibe: {
        vibe_code: detectedVibe,
        confidence: bestMatch.score > 0 ? 0.9 : 0.7,
        keywords: vibeKeywords[detectedVibe] || [],
      },
      selection: selectedPlaces,
      route: {
        mode: input.mode || "walking",
        ordered: orderedPlaces,
        gmaps_url: gmapsUrl,
      },
      ui_copy: uiCopy,
    }
  }
}

// Singleton instance
export const ycvAIService = new YCVAIService()
