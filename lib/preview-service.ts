import { DATASET } from "./dataset"
import type { CityId, Place } from "./types"

export class PreviewService {
  static filterPlacesByVibe(cityId: CityId, vibeText: string): Place[] {
    const city = DATASET.find((c) => c.id === cityId)
    if (!city || !vibeText.trim()) return []

    const searchTerms = vibeText.toLowerCase().split(/\s+/)
    const filteredPlaces: Place[] = []

    // Simple keyword matching against place names, categories, and descriptions
    for (const place of city.places) {
      const searchableText = [place.name, place.category, place.address, place.description || ""]
        .join(" ")
        .toLowerCase()

      const matchScore = searchTerms.reduce((score, term) => {
        if (searchableText.includes(term)) {
          return score + 1
        }
        return score
      }, 0)

      if (matchScore > 0) {
        filteredPlaces.push({ ...place, matchScore })
      }
    }

    // Sort by match score and return top results
    return filteredPlaces.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 20) // Limit to 20 results for performance
  }

  static getTopPreviewPlaces(places: Place[], count = 3): Place[] {
    return places.slice(0, count)
  }
}
