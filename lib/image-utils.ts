import type { UICard } from "./types"

/**
 * Genera una query inteligente para placeholder de imagen basada en los datos del lugar
 */
export function generateImageQuery(card: UICard, cityName: string): string {
  const title = card.title.toLowerCase()
  const subtitle = card.subtitle.toLowerCase()

  // Extraer palabras clave del título y subtítulo
  const keywords = [
    title,
    subtitle.split(" • ")[0], // Tomar la categoría antes del •
    cityName.toLowerCase(),
  ].join(" ")

  // Limpiar y optimizar la query
  return keywords
    .replace(/[^\w\s]/g, "") // Remover caracteres especiales
    .replace(/\s+/g, " ") // Normalizar espacios
    .trim()
}

/**
 * Genera la URL completa del placeholder con query inteligente
 */
export function getPlaceImageUrl(card: UICard, cityName: string): string {
  const query = generateImageQuery(card, cityName)
  return `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(query)}`
}
