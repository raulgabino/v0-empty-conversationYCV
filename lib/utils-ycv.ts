import type { CityId, TravelMode, UserInput, Place, VibeCode } from "./types"
import { DATASET, CITY_ALIASES } from "./dataset"

// Normalize user input and apply defaults
export function normalizeInput(rawInput: any): UserInput {
  const cityText = (rawInput.city_id || rawInput.city || "").toLowerCase().trim()
  const normalizedCity = CITY_ALIASES[cityText] || "monterrey"

  const modeText = (rawInput.mode || "").toLowerCase()
  let mode: TravelMode = "walking"
  if (modeText.includes("carro") || modeText.includes("auto") || modeText === "driving") {
    mode = "driving"
  }

  return {
    city_id: normalizedCity as CityId,
    user_text: rawInput.user_text || rawInput.text || "plan chill",
    mode,
    max_stops: Math.min(Math.max(Number.parseInt(rawInput.max_stops) || 4, 3), 5),
  }
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Get places for a specific city and vibe
export function getPlacesForCityAndVibe(cityId: CityId, vibe: VibeCode): Place[] {
  const city = DATASET.cities.find((c) => c.id === cityId)
  if (!city) return []

  return city.places.filter((place) => place.vibes.includes(vibe))
}

// Order places by proximity using nearest neighbor heuristic
export function orderPlacesByProximity(places: Place[]): Place[] {
  if (places.length <= 1) return places

  const placesWithCoords = places.filter((p) => p.lat !== null && p.lng !== null)
  const placesWithoutCoords = places.filter((p) => p.lat === null || p.lng === null)

  if (placesWithCoords.length === 0) {
    // If no coordinates, return as-is (could implement address-based ordering later)
    return places
  }

  // Start with the most central place or anchor category
  let current = placesWithCoords[0]
  const ordered = [current]
  const remaining = placesWithCoords.slice(1)

  while (remaining.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < remaining.length; i++) {
      const distance = calculateDistance(current.lat!, current.lng!, remaining[i].lat!, remaining[i].lng!)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }

    current = remaining[nearestIndex]
    ordered.push(current)
    remaining.splice(nearestIndex, 1)
  }

  // Add places without coordinates at the end
  return [...ordered, ...placesWithoutCoords]
}

// Build Google Maps URL
export function buildGoogleMapsUrl(places: Place[], mode: TravelMode): string {
  if (places.length === 0) return ""

  const baseUrl = "https://www.google.com/maps/dir/?api=1"
  const travelMode = `travelmode=${mode}`

  if (places.length === 1) {
    const place = places[0]
    const location =
      place.lat !== null && place.lng !== null ? `${place.lat},${place.lng}` : encodeURIComponent(place.address)
    return `${baseUrl}&origin=${location}&destination=${location}&${travelMode}`
  }

  const origin = places[0]
  const destination = places[places.length - 1]
  const waypoints = places.slice(1, -1)

  const originParam =
    origin.lat !== null && origin.lng !== null ? `${origin.lat},${origin.lng}` : encodeURIComponent(origin.address)

  const destinationParam =
    destination.lat !== null && destination.lng !== null
      ? `${destination.lat},${destination.lng}`
      : encodeURIComponent(destination.address)

  let url = `${baseUrl}&origin=${originParam}&destination=${destinationParam}`

  if (waypoints.length > 0) {
    const waypointParams = waypoints
      .map((place) =>
        place.lat !== null && place.lng !== null ? `${place.lat},${place.lng}` : encodeURIComponent(place.address),
      )
      .join("|")
    url += `&waypoints=${waypointParams}`
  }

  url += `&${travelMode}`
  return url
}

// Get category display text
export function getCategoryDisplayText(category: string): string {
  const categoryMap: Record<string, string> = {
    park: "Parque",
    cafe: "Café",
    "cafe-bakery": "Panadería",
    museum: "Museo",
    landmark: "Monumento",
    walkway: "Paseo",
    district: "Barrio",
    zoo: "Zoológico",
  }

  return categoryMap[category] || category
}

// Get vibe display text
export function getVibeDisplayText(vibe: VibeCode): string {
  return vibe === "chill-cafe" ? "Chill & Café" : "Arte & Cultura"
}
