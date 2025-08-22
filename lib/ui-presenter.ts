import type { YCVResponse, UIPresentation } from "./types"
import { getCategoryDisplayText, getVibeDisplayText } from "./utils-ycv"

export function presentForUI(response: YCVResponse): UIPresentation {
  const cityName =
    response.input.city_id === "ciudad-victoria"
      ? "Ciudad Victoria"
      : response.input.city_id === "monterrey"
        ? "Monterrey"
        : "Ciudad de México"

  const title = response.ui_copy.title || `Plan ${getVibeDisplayText(response.vibe.vibe_code)} en ${cityName}`
  const subtitle =
    response.ui_copy.subtitle || `${response.selection.length} lugares seleccionados para tu experiencia perfecta`

  const cards = response.route.ordered.map((place, index) => ({
    title: place.name,
    subtitle: `${getCategoryDisplayText(place.category)} • ${getLocationHint(place.category)}`,
    coords: place.lat !== null && place.lng !== null ? `${place.lat},${place.lng}` : null,
    order: index + 1,
  }))

  return {
    header: {
      title,
      subtitle,
      badge: response.vibe.vibe_code,
    },
    cards,
    cta: {
      url: response.route.gmaps_url,
      text: response.route.mode === "walking" ? "Abrir ruta caminando" : "Abrir ruta en auto",
    },
  }
}

function getLocationHint(category: string): string {
  const hints: Record<string, string> = {
    park: "perfecto para fotos",
    cafe: "ambiente relajado",
    "cafe-bakery": "café y pan artesanal",
    museum: "arte y cultura",
    landmark: "icónico de la ciudad",
    walkway: "paseo escénico",
    district: "barrio con historia",
    zoo: "diversión familiar",
  }

  return hints[category] || "lugar especial"
}
