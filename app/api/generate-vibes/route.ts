import { type NextRequest, NextResponse } from "next/server"
import { ycvAIService } from "@/lib/ai-service"
import { validateUserInput } from "@/lib/validation"

export const maxDuration = 30 // Vercel timeout

export async function POST(request: NextRequest) {
  try {
    const rawInput = await request.json()

    const validation = validateUserInput(rawInput)
    if (!validation.success) {
      return NextResponse.json({ error: "Validation Error", message: validation.error }, { status: 400 })
    }

    const result = await ycvAIService.generateCityVibes(validation.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error("API Error en generate-vibes:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Internal Server Error", message: errorMessage }, { status: 500 })
  }
}
