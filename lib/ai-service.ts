import { generateObject, streamObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import type { UserInput, YCVResponse } from "./types"
import { DATASET } from "./dataset"
import { ORCHESTRATOR_SYSTEM_PROMPT } from "./ai-prompts"
import { buildGoogleMapsUrl, orderPlacesByProximity } from "./utils-ycv"
import { createStreamableValue } from "ai/rsc"

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
  private model = openai("gpt-4o-mini")
  private useOpenAI = !!process.env.OPENAI_API_KEY

  async generateCityVibes(input: UserInput): Promise<YCVResponse> {
    try {
      if (this.useOpenAI) {
        // Proceso de IA unificado en un solo paso
        return await this.runAIGeneration(input)
      } else {
        // Mantener el mock inteligente como fallback principal
        return this.generateMockResponse(input)
      }
    } catch (error) {
      console.error("Error en generateCityVibes, usando fallback:", error)
      return this.generateMockResponse(input)
    }
  }

  // Lógica de IA unificada y optimizada
  private async runAIGeneration(input: UserInput): Promise<YCVResponse> {
    // 1. Filtrar el dataset ANTES de enviarlo a la IA
    const cityData = DATASET.cities.find((c) => c.id === input.city_id)
    if (!cityData) {
      throw new Error(`Ciudad no encontrada en el dataset: ${input.city_id}`)
    }
    const cityContext = {
      id: cityData.id,
      name: cityData.name,
      places: cityData.places,
    }

    const systemMessage = `${ORCHESTRATOR_SYSTEM_PROMPT}\n\nDATASET_CONTEXTO_CIUDAD: ${JSON.stringify(cityContext)}`
    const userMessage = JSON.stringify(input)

    // 2. Realizar una ÚNICA llamada a la IA
    const result = await generateObject({
      model: this.model,
      system: systemMessage,
      prompt: userMessage,
      schema: YCVResponseSchema,
      temperature: 0.4, // Un poco más de creatividad controlada
    })

    return result.object as YCVResponse
  }

  // El sistema de mock no cambia, sigue siendo nuestro excelente plan B
  private generateMockResponse(input: UserInput): YCVResponse {
    const cityData = DATASET.cities.find((city) => city.id === input.city_id)
    if (!cityData) {
      throw new Error(`City ${input.city_id} not found`)
    }

    // Simple vibe detection based on keywords
    const userTextLower = input.user_text.toLowerCase()
    let detectedVibe: any = "arte-cultura" // Default vibe

    const vibeKeywords: { [key: string]: string[] } = {
      "chill-cafe": ["café", "coffee", "tranquilo", "relax", "chill", "quieto"],
      "arte-cultura": ["arte", "cultura", "museo", "historia", "galería"],
      BELLAQUEO: ["fiesta", "noche", "antro", "bar", "reggaeton"],
      STREET_FOOD: ["tacos", "calle", "comida", "garnacha", "mercado"],
      LIVE_MUSIC: ["música en vivo", "concierto", "banda", "show"],
      MIRADORES_FOTOS: ["vista", "fotos", "mirador", "paisaje", "panorámica"],
      DEPORTES_JUEGO: ["deporte", "juego", "estadio", "partido", "ejercicio"],
      FAMILY_KIDS: ["familia", "niños", "parque", "divertido", "familiar"],
    }

    for (const vibe in vibeKeywords) {
      if (vibeKeywords[vibe].some((keyword) => userTextLower.includes(keyword))) {
        detectedVibe = vibe
        break
      }
    }

    // Filter places by detected vibe
    const matchingPlaces = cityData.places
      .filter((place) => place.vibes.includes(detectedVibe))
      .slice(0, input.max_stops || 4)

    // Order places optimally
    const orderedPlaces = orderPlacesByProximity(matchingPlaces)

    // Generate Google Maps URL
    const gmapsUrl = buildGoogleMapsUrl(orderedPlaces, input.mode || "walking")

    // Generate UI copy based on vibe
    const uiCopy = {
      title: `Ruta Sugerida en ${cityData.name}`,
      subtitle: "Un plan genial basado en tu vibra",
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
        confidence: 0.85, // Mock confidence
        keywords: vibeKeywords[detectedVibe] || [],
      },
      selection: matchingPlaces,
      route: {
        mode: input.mode || "walking",
        ordered: orderedPlaces,
        gmaps_url: gmapsUrl,
      },
      ui_copy: uiCopy,
    }
  }

  async streamCityVibes(input: UserInput) {
    // Si no hay API key, devolvemos el mock de forma "streameada"
    if (!this.useOpenAI) {
      const mockResponse = this.generateMockResponse(input)
      const streamable = createStreamableValue(mockResponse)
      return streamable.value
    }

    const cityData = DATASET.cities.find((c) => c.id === input.city_id)
    if (!cityData) throw new Error(`Ciudad no encontrada: ${input.city_id}`)

    const cityContext = { id: cityData.id, name: cityData.name, places: cityData.places }
    const systemMessage = `${ORCHESTRATOR_SYSTEM_PROMPT}\n\nDATASET_CONTEXTO_CIUDAD: ${JSON.stringify(cityContext)}`
    const userMessage = JSON.stringify(input)

    // Usamos streamObject en lugar de generateObject
    const result = await streamObject({
      model: this.model,
      system: systemMessage,
      prompt: userMessage,
      schema: YCVResponseSchema,
      temperature: 0.4,
    })

    // Devolvemos el stream parcial del objeto
    return result.partialObjectStream
  }
}

// Singleton instance
export const ycvAIService = new YCVAIService()
