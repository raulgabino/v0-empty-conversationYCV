import { type NextRequest, NextResponse } from "next/server"
import { ycvAIService } from "@/lib/ai-service"
import { validateUserInput, getErrorMessage } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const rawInput = await request.json()

    const validation = validateUserInput(rawInput)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: validation.error,
        },
        { status: 400 },
      )
    }

    const userIP = request.headers.get("x-forwarded-for") || "unknown"
    // In production, implement proper rate limiting with Redis or similar

    // Generate city vibes plan using AI
    const result = await ycvAIService.generateCityVibes(validation.data)

    if (!result || !result.selection || result.selection.length === 0) {
      return NextResponse.json(
        {
          error: "AI Generation Error",
          message: "No se pudieron generar sugerencias para tu búsqueda. Intenta con una descripción diferente.",
        },
        { status: 422 },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("API Error:", error)

    const errorMessage = getErrorMessage(error)

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          {
            error: "Rate Limit Error",
            message: "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
          },
          { status: 429 },
        )
      }

      if (error.message.includes("timeout")) {
        return NextResponse.json(
          {
            error: "Timeout Error",
            message: "La solicitud tardó demasiado. Intenta de nuevo.",
          },
          { status: 408 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: errorMessage,
      },
      { status: 500 },
    )
  }
}
