import { DATASET } from "./dataset"

interface SmartSuggestion {
  text: string
  category: string
  vibes: string[]
}

export class SuggestionService {
  private static getPlacesByCity(cityId: string) {
    const city = DATASET.cities.find((c) => c.id === cityId)
    return city?.places || []
  }

  private static getCategoryName(category: string): string {
    const categoryMap: Record<string, string> = {
      cafe: "cafés",
      museum: "museos",
      park: "parques",
      plaza: "plazas",
      landmark: "lugares icónicos",
      district: "barrios",
      walkway: "paseos",
      zoo: "zoológicos",
      "edificio histórico": "arquitectura histórica",
      estadio: "estadios",
      arena: "arenas",
      mirador: "miradores",
      "área natural": "naturaleza",
      "centro cultural/teatro": "cultura y teatro",
      monumento: "monumentos",
      "auditorio/mixto": "eventos y música",
      "parque natural": "parques naturales",
      "museo/teatro": "museos y teatro",
      "sitio arqueológico/museo": "sitios arqueológicos",
      "zona de bares/antros": "vida nocturna",
      "food hall": "mercados gastronómicos",
      "paseo en trajinera": "paseos acuáticos",
    }
    return categoryMap[category] || category
  }

  static generateSmartSuggestions(cityId: string): SmartSuggestion[] {
    const places = this.getPlacesByCity(cityId)
    const suggestions: SmartSuggestion[] = []

    // Group places by category and vibes
    const categoryGroups = new Map<string, typeof places>()
    const vibeGroups = new Map<string, typeof places>()

    places.forEach((place) => {
      // Group by category
      if (!categoryGroups.has(place.category)) {
        categoryGroups.set(place.category, [])
      }
      categoryGroups.get(place.category)!.push(place)

      // Group by vibes
      place.vibes.forEach((vibe) => {
        if (!vibeGroups.has(vibe)) {
          vibeGroups.set(vibe, [])
        }
        vibeGroups.get(vibe)!.push(place)
      })
    })

    // Generate category-based suggestions
    categoryGroups.forEach((places, category) => {
      if (places.length >= 2) {
        const categoryName = this.getCategoryName(category)
        suggestions.push({
          text: `explorar ${categoryName}`,
          category: "category",
          vibes: [...new Set(places.flatMap((p) => p.vibes))],
        })
      }
    })

    // Generate vibe-based suggestions
    const vibeTexts: Record<string, string> = {
      "chill-cafe": "plan tranqui con café",
      "arte-cultura": "arte y cultura",
      BELLAQUEO: "noche de fiesta urbana",
      STREET_FOOD: "comida callejera auténtica",
      LIVE_MUSIC: "música en vivo",
      MIRADORES_FOTOS: "lugares para fotos épicas",
      DEPORTES_JUEGO: "actividades deportivas",
      FAMILY_KIDS: "plan familiar con niños",
      nightlife: "vida nocturna",
      shopping: "ir de compras",
      "nature-outdoor": "naturaleza y aire libre",
      "food-gourmet": "experiencia gastronómica",
      "historic-architecture": "arquitectura e historia",
      "local-authentic": "experiencias locales auténticas",
    }

    vibeGroups.forEach((places, vibe) => {
      if (places.length >= 2 && vibeTexts[vibe]) {
        suggestions.push({
          text: vibeTexts[vibe],
          category: "vibe",
          vibes: [vibe],
        })
      }
    })

    // Generate combination suggestions
    if (vibeGroups.has("chill-cafe") && vibeGroups.has("MIRADORES_FOTOS")) {
      suggestions.push({
        text: "café y lugares para fotos",
        category: "combo",
        vibes: ["chill-cafe", "MIRADORES_FOTOS"],
      })
    }

    if (vibeGroups.has("arte-cultura") && vibeGroups.has("FAMILY_KIDS")) {
      suggestions.push({
        text: "cultura familiar",
        category: "combo",
        vibes: ["arte-cultura", "FAMILY_KIDS"],
      })
    }

    if (vibeGroups.has("LIVE_MUSIC") && vibeGroups.has("BELLAQUEO")) {
      suggestions.push({
        text: "música y fiesta",
        category: "combo",
        vibes: ["LIVE_MUSIC", "BELLAQUEO"],
      })
    }

    // Limit and prioritize suggestions
    return suggestions
      .sort((a, b) => {
        // Prioritize vibe suggestions, then combos, then categories
        const priority = { vibe: 3, combo: 2, category: 1 }
        return priority[b.category as keyof typeof priority] - priority[a.category as keyof typeof priority]
      })
      .slice(0, 8) // Limit to 8 suggestions
  }

  static filterSuggestionsByInput(suggestions: SmartSuggestion[], input: string): SmartSuggestion[] {
    if (!input.trim()) return suggestions

    const searchTerms = input.toLowerCase().split(" ")

    return suggestions.filter((suggestion) => {
      const suggestionText = suggestion.text.toLowerCase()
      return searchTerms.some(
        (term) => suggestionText.includes(term) || suggestion.vibes.some((vibe) => vibe.toLowerCase().includes(term)),
      )
    })
  }
}
