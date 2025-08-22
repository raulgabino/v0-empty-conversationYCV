import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import type { UserInput, YCVResponse } from "./types"
import { DATASET } from "./dataset"
import { ORCHESTRATOR_SYSTEM_PROMPT, OUTPUT_GUARD_SYSTEM_PROMPT } from "./ai-prompts"
import { buildGoogleMapsUrl, orderPlacesByProximity } from "./utils-ycv"

// Zod schemas for validation
const CoordinatesSchema = z.object({
  lat: z.number().nullable(),
  lng: z.number().nullable(),
})

const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  vibes: z.array(z.enum(["chill-cafe", "arte-cultura"])),
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
    vibe_code: z.enum(["chill-cafe", "arte-cultura"]),
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
        // Step 1: Run the orchestrator
        const orchestratorResult = await this.runOrchestrator(input)
        // Step 2: Validate and fix with output guard
        const finalResult = await this.runOutputGuard(orchestratorResult)
        return finalResult
      } else {
        // Use mock implementation when no API key is available
        return this.generateMockResponse(input)
      }
    } catch (error) {
      console.error("Error generating city vibes:", error)
      console.log("[v0] Falling back to mock response due to API error")
      return this.generateMockResponse(input)
    }
  }

  private generateMockResponse(input: UserInput): YCVResponse {
    const cityData = DATASET.cities.find((city) => city.id === input.city_id)
    if (!cityData) {
      throw new Error(`City ${input.city_id} not found`)
    }

    // Simple vibe detection based on keywords
    const userTextLower = input.user_text.toLowerCase()
    const isChillCafe =
      userTextLower.includes("café") ||
      userTextLower.includes("coffee") ||
      userTextLower.includes("tranquil") ||
      userTextLower.includes("relax") ||
      userTextLower.includes("chill") ||
      userTextLower.includes("quiet")

    const detectedVibe = isChillCafe ? "chill-cafe" : "arte-cultura"

    // Filter places by detected vibe
    const matchingPlaces = cityData.places
      .filter((place) => place.vibes.includes(detectedVibe))
      .slice(0, input.max_stops || 4)

    // Order places optimally
    const orderedPlaces = orderPlacesByProximity(matchingPlaces)

    // Generate Google Maps URL
    const gmapsUrl = buildGoogleMapsUrl(orderedPlaces, input.mode || "walking")

    // Generate UI copy based on vibe
    const uiCopy =
      detectedVibe === "chill-cafe"
        ? {
            title: `Ruta Chill en ${cityData.name}`,
            subtitle: "Lugares perfectos para relajarte y disfrutar un buen café",
          }
        : {
            title: `Ruta Cultural en ${cityData.name}`,
            subtitle: "Descubre el arte y la cultura local en estos increíbles lugares",
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
        confidence: 0.85,
        keywords: detectedVibe === "chill-cafe" ? ["café", "tranquilo", "relajante"] : ["arte", "cultura", "historia"],
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

  private async runOrchestrator(input: UserInput): Promise<any> {
    const userMessage = JSON.stringify(input)
    const systemMessage = `${ORCHESTRATOR_SYSTEM_PROMPT}\n\nDATASET: ${JSON.stringify(DATASET)}`

    const result = await generateObject({
      model: this.model,
      system: systemMessage,
      prompt: userMessage,
      schema: YCVResponseSchema,
      temperature: 0.3,
    })

    return result.object
  }

  private async runOutputGuard(rawResult: any): Promise<YCVResponse> {
    const userMessage = JSON.stringify({ raw: rawResult })
    const systemMessage = `${OUTPUT_GUARD_SYSTEM_PROMPT}\n\nDATASET: ${JSON.stringify(DATASET)}`

    const result = await generateObject({
      model: this.model,
      system: systemMessage,
      prompt: userMessage,
      schema: YCVResponseSchema,
      temperature: 0.1,
    })

    return result.object as YCVResponse
  }
}

// Singleton instance
export const ycvAIService = new YCVAIService()
