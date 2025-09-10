import { z } from "zod"
import type { UserInput } from "./types"

// Input validation schemas
export const UserInputSchema = z.object({
  city_id: z.enum(["ciudad-victoria", "monterrey", "cdmx", "guadalajara"]),
  user_text: z.string().min(1, "El texto no puede estar vacío").max(500, "El texto es demasiado largo"),
  mode: z.enum(["walking", "driving"]).default("walking"),
  max_stops: z.number().int().min(1).max(5).default(4),
})

export const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  vibes: z.array(z.enum(["chill-cafe", "arte-cultura"])),
  address: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
})

// Validation functions
export function validateUserInput(input: any): { success: true; data: UserInput } | { success: false; error: string } {
  try {
    const validated = UserInputSchema.parse(input)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { success: false, error: firstError.message }
    }
    return { success: false, error: "Datos de entrada inválidos" }
  }
}

export function validateVibeText(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Por favor describe qué tipo de experiencia buscas" }
  }

  if (text.length > 500) {
    return { valid: false, error: "El texto es demasiado largo. Máximo 500 caracteres." }
  }

  if (text.length < 3) {
    return { valid: false, error: "Por favor proporciona más detalles sobre tu vibra" }
  }

  return { valid: true }
}

export function validateCity(cityId: string): { valid: boolean; error?: string } {
  const validCities = ["ciudad-victoria", "monterrey", "cdmx", "guadalajara"]

  if (!cityId) {
    return { valid: false, error: "Por favor selecciona una ciudad" }
  }

  if (!validCities.includes(cityId)) {
    return { valid: false, error: "Ciudad no válida" }
  }

  return { valid: true }
}

// Error message translations
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Error de conexión. Verifica tu internet e intenta de nuevo.",
  SERVER_ERROR: "Error del servidor. Intenta de nuevo en unos momentos.",
  VALIDATION_ERROR: "Los datos proporcionados no son válidos.",
  AI_ERROR: "No pudimos generar tu plan. Intenta con una descripción diferente.",
  ROUTE_ERROR: "Error al generar la ruta. Intenta de nuevo.",
  UNKNOWN_ERROR: "Algo salió mal. Intenta de nuevo.",
  TIMEOUT_ERROR: "La solicitud tardó demasiado. Intenta de nuevo.",
  RATE_LIMIT_ERROR: "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
} as const

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes("fetch")) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }
    if (error.message.includes("timeout")) {
      return ERROR_MESSAGES.TIMEOUT_ERROR
    }
    if (error.message.includes("rate limit")) {
      return ERROR_MESSAGES.RATE_LIMIT_ERROR
    }
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR
}
