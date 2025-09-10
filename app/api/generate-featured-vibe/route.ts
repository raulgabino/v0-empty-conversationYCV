import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export const maxDuration = 30

interface FeaturedVibeRequest {
  city_id: string
  timezone: string
}

interface FeaturedVibeResponse {
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

export async function POST(request: NextRequest) {
  try {
    const { city_id, timezone }: FeaturedVibeRequest = await request.json()

    const currentHour = new Date().getHours()
    let timeBasedVibe = ""

    if (currentHour >= 6 && currentHour < 12) {
      timeBasedVibe = "energético y matutino"
    } else if (currentHour >= 12 && currentHour < 17) {
      timeBasedVibe = "relajado y cultural"
    } else if (currentHour >= 17 && currentHour < 21) {
      timeBasedVibe = "social y gastronómico"
    } else {
      timeBasedVibe = "romántico y nocturno"
    }

    const cityNames = {
      "mexico-city": "Ciudad de México",
      guadalajara: "Guadalajara",
      monterrey: "Monterrey",
    }

    const cityName = cityNames[city_id as keyof typeof cityNames] || city_id

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Genera contenido para una vibra sugerida en ${cityName}, México.

Vibra base: ${timeBasedVibe}
Hora actual: ${currentHour}:00

Necesito:
1. Un título atractivo (máximo 8 palabras)
2. Un artículo promocional de 150-200 palabras que inspire a visitar
3. Descripción de 3 lugares específicos para generar imágenes
4. Una ruta sugerida con 3-4 lugares y duración estimada

Formato JSON:
{
  "vibe": "palabra clave del vibe",
  "title": "título atractivo",
  "article": "artículo promocional completo",
  "imageDescriptions": [
    "descripción detallada lugar 1",
    "descripción detallada lugar 2", 
    "descripción detallada lugar 3"
  ],
  "places": ["lugar1", "lugar2", "lugar3", "lugar4"],
  "duration": "X horas"
}

Haz las descripciones de imágenes muy específicas y realistas para ${cityName}.`,
    })

    const content = JSON.parse(text)

    const images = content.imageDescriptions.map((desc: string, index: number) => ({
      url: `/placeholder.svg?height=300&width=500&query=${encodeURIComponent(`${desc} in ${cityName} Mexico realistic photography`)}`,
      alt: `${content.places[index]} en ${cityName}`,
      caption: content.places[index],
    }))

    const response: FeaturedVibeResponse = {
      vibe: content.vibe,
      title: content.title,
      article: content.article,
      images,
      suggestedRoute: {
        places: content.places,
        duration: content.duration,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error generating featured vibe:", error)
    return NextResponse.json(
      { error: "Failed to generate featured vibe", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
