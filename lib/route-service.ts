import type { Place, TravelMode, Coordinates } from "./types"
import { calculateDistance, buildGoogleMapsUrl } from "./utils-ycv"

export interface RouteOptions {
  mode: TravelMode
  maxDistance?: number // Maximum total route distance in km
  preferScenicRoute?: boolean // Prefer routes through parks/walkways
  avoidBacktracking?: boolean // Minimize backtracking
}

export interface RouteResult {
  orderedPlaces: Place[]
  totalDistance: number
  estimatedTime: number // in minutes
  gmapsUrl: string
  routeQuality: "excellent" | "good" | "fair"
}

export class RouteService {
  generateOptimalRoute(places: Place[], options: RouteOptions = { mode: "walking" }): RouteResult {
    if (places.length === 0) {
      throw new Error("No places provided for route generation")
    }

    if (places.length === 1) {
      return this.createSinglePlaceRoute(places[0], options)
    }

    // Try different routing algorithms and pick the best one
    const algorithms = [
      () => this.nearestNeighborRoute(places, options),
      () => this.centroidBasedRoute(places, options),
      () => this.categoryOptimizedRoute(places, options),
    ]

    let bestRoute: RouteResult | null = null
    let bestScore = -1

    for (const algorithm of algorithms) {
      try {
        const route = algorithm()
        const score = this.calculateRouteScore(route, options)

        if (score > bestScore) {
          bestScore = score
          bestRoute = route
        }
      } catch (error) {
        console.warn("Route algorithm failed:", error)
      }
    }

    return bestRoute || this.fallbackRoute(places, options)
  }

  private nearestNeighborRoute(places: Place[], options: RouteOptions): RouteResult {
    const placesWithCoords = places.filter((p) => p.lat !== null && p.lng !== null)
    const placesWithoutCoords = places.filter((p) => p.lat === null || p.lng === null)

    if (placesWithCoords.length === 0) {
      return this.addressBasedRoute([...places], options)
    }

    // Start with the most central place or a strategic anchor
    const startPlace = this.findBestStartingPlace(placesWithCoords, options)
    const ordered = [startPlace]
    const remaining = placesWithCoords.filter((p) => p.id !== startPlace.id)

    let currentPlace = startPlace
    let totalDistance = 0

    while (remaining.length > 0) {
      let nearestIndex = 0
      let nearestDistance = Number.POSITIVE_INFINITY

      for (let i = 0; i < remaining.length; i++) {
        const distance = calculateDistance(currentPlace.lat!, currentPlace.lng!, remaining[i].lat!, remaining[i].lng!)

        // Apply preferences for scenic routes
        const adjustedDistance = this.adjustDistanceForPreferences(distance, remaining[i], options)

        if (adjustedDistance < nearestDistance) {
          nearestDistance = adjustedDistance
          nearestIndex = i
        }
      }

      currentPlace = remaining[nearestIndex]
      ordered.push(currentPlace)
      totalDistance += nearestDistance
      remaining.splice(nearestIndex, 1)
    }

    // Add places without coordinates at logical positions
    const finalOrdered = this.insertPlacesWithoutCoords(ordered, placesWithoutCoords)

    return this.createRouteResult(finalOrdered, totalDistance, options)
  }

  private centroidBasedRoute(places: Place[], options: RouteOptions): RouteResult {
    const placesWithCoords = places.filter((p) => p.lat !== null && p.lng !== null)

    if (placesWithCoords.length < 2) {
      return this.nearestNeighborRoute(places, options)
    }

    // Calculate centroid
    const centroid = this.calculateCentroid(placesWithCoords)

    // Sort by distance from centroid, then optimize locally
    const sortedByDistance = placesWithCoords
      .map((place) => ({
        place,
        distanceFromCentroid: calculateDistance(centroid.lat, centroid.lng, place.lat!, place.lng!),
      }))
      .sort((a, b) => a.distanceFromCentroid - b.distanceFromCentroid)

    // Create route starting from center and spiraling outward
    const ordered = this.createSpiralRoute(sortedByDistance.map((item) => item.place))
    const totalDistance = this.calculateTotalDistance(ordered)

    return this.createRouteResult(ordered, totalDistance, options)
  }

  private categoryOptimizedRoute(places: Place[], options: RouteOptions): RouteResult {
    // Group places by category priority for the travel mode
    const categoryPriority =
      options.mode === "walking"
        ? ["park", "walkway", "cafe", "cafe-bakery", "museum", "landmark", "district", "zoo"]
        : ["museum", "landmark", "district", "park", "zoo", "cafe", "cafe-bakery", "walkway"]

    const categorizedPlaces = new Map<string, Place[]>()

    places.forEach((place) => {
      if (!categorizedPlaces.has(place.category)) {
        categorizedPlaces.set(place.category, [])
      }
      categorizedPlaces.get(place.category)!.push(place)
    })

    // Build route following category priority and geographic optimization
    const ordered: Place[] = []
    let totalDistance = 0

    for (const category of categoryPriority) {
      const categoryPlaces = categorizedPlaces.get(category) || []
      if (categoryPlaces.length === 0) continue

      if (ordered.length === 0) {
        // First place: pick the most central or strategic
        ordered.push(this.findBestStartingPlace(categoryPlaces, options))
      } else {
        // Add remaining places from this category in optimal order
        const remaining = categoryPlaces.filter((p) => !ordered.includes(p))
        for (const place of remaining) {
          const insertPosition = this.findBestInsertPosition(ordered, place)
          ordered.splice(insertPosition, 0, place)
        }
      }
    }

    totalDistance = this.calculateTotalDistance(ordered)
    return this.createRouteResult(ordered, totalDistance, options)
  }

  private findBestStartingPlace(places: Place[], options: RouteOptions): Place {
    if (options.preferScenicRoute) {
      // Prefer parks or walkways as starting points
      const scenicPlaces = places.filter((p) => p.category === "park" || p.category === "walkway")
      if (scenicPlaces.length > 0) {
        return scenicPlaces[0]
      }
    }

    // Default to most central place
    const centroid = this.calculateCentroid(places)
    return places.reduce((closest, place) => {
      const distanceToCenter = calculateDistance(centroid.lat, centroid.lng, place.lat!, place.lng!)
      const closestDistance = calculateDistance(centroid.lat, centroid.lng, closest.lat!, closest.lng!)
      return distanceToCenter < closestDistance ? place : closest
    })
  }

  private adjustDistanceForPreferences(distance: number, place: Place, options: RouteOptions): number {
    let adjustedDistance = distance

    if (options.preferScenicRoute) {
      // Reduce effective distance for scenic places
      if (place.category === "park" || place.category === "walkway") {
        adjustedDistance *= 0.8
      }
    }

    return adjustedDistance
  }

  private calculateCentroid(places: Place[]): Coordinates {
    const validPlaces = places.filter((p) => p.lat !== null && p.lng !== null)

    if (validPlaces.length === 0) {
      return { lat: 0, lng: 0 }
    }

    const sum = validPlaces.reduce(
      (acc, place) => ({
        lat: acc.lat + place.lat!,
        lng: acc.lng + place.lng!,
      }),
      { lat: 0, lng: 0 },
    )

    return {
      lat: sum.lat / validPlaces.length,
      lng: sum.lng / validPlaces.length,
    }
  }

  private createSpiralRoute(places: Place[]): Place[] {
    if (places.length <= 2) return places

    const ordered = [places[0]] // Start with most central
    const remaining = places.slice(1)

    while (remaining.length > 0) {
      const lastPlace = ordered[ordered.length - 1]

      // Find next place that creates the best continuation
      let bestIndex = 0
      let bestScore = -1

      for (let i = 0; i < remaining.length; i++) {
        const distance = calculateDistance(lastPlace.lat!, lastPlace.lng!, remaining[i].lat!, remaining[i].lng!)

        // Score based on distance and position variety
        const score = 1 / (distance + 0.1) // Avoid division by zero

        if (score > bestScore) {
          bestScore = score
          bestIndex = i
        }
      }

      ordered.push(remaining[bestIndex])
      remaining.splice(bestIndex, 1)
    }

    return ordered
  }

  private findBestInsertPosition(ordered: Place[], newPlace: Place): number {
    if (ordered.length === 0) return 0
    if (newPlace.lat === null || newPlace.lng === null) return ordered.length

    let bestPosition = ordered.length
    let bestIncrease = Number.POSITIVE_INFINITY

    for (let i = 0; i <= ordered.length; i++) {
      const increase = this.calculateInsertionCost(ordered, newPlace, i)
      if (increase < bestIncrease) {
        bestIncrease = increase
        bestPosition = i
      }
    }

    return bestPosition
  }

  private calculateInsertionCost(ordered: Place[], newPlace: Place, position: number): number {
    if (newPlace.lat === null || newPlace.lng === null) return 0

    const before = position > 0 ? ordered[position - 1] : null
    const after = position < ordered.length ? ordered[position] : null

    let cost = 0

    if (before && before.lat !== null && before.lng !== null) {
      cost += calculateDistance(before.lat, before.lng, newPlace.lat!, newPlace.lng!)
    }

    if (after && after.lat !== null && after.lng !== null) {
      cost += calculateDistance(newPlace.lat!, newPlace.lng!, after.lat, after.lng)
    }

    // Subtract the original distance between before and after
    if (before && after && before.lat !== null && before.lng !== null && after.lat !== null && after.lng !== null) {
      cost -= calculateDistance(before.lat, before.lng, after.lat, after.lng)
    }

    return cost
  }

  private insertPlacesWithoutCoords(ordered: Place[], placesWithoutCoords: Place[]): Place[] {
    if (placesWithoutCoords.length === 0) return ordered

    // Insert places without coordinates based on address similarity or category
    const result = [...ordered]

    for (const place of placesWithoutCoords) {
      // Try to find a good position based on address or category
      const insertPosition = this.findLogicalInsertPosition(result, place)
      result.splice(insertPosition, 0, place)
    }

    return result
  }

  private findLogicalInsertPosition(ordered: Place[], place: Place): number {
    // Look for places with similar addresses or categories
    for (let i = 0; i < ordered.length; i++) {
      if (this.areAddressesSimilar(ordered[i].address, place.address) || ordered[i].category === place.category) {
        return i + 1
      }
    }

    // Default to end
    return ordered.length
  }

  private areAddressesSimilar(addr1: string, addr2: string): boolean {
    const normalize = (addr: string) => addr.toLowerCase().replace(/[^a-z0-9]/g, "")
    const norm1 = normalize(addr1)
    const norm2 = normalize(addr2)

    // Check for common words or neighborhoods
    const words1 = norm1.split(/\s+/)
    const words2 = norm2.split(/\s+/)

    return words1.some((word) => words2.includes(word) && word.length > 3)
  }

  private calculateTotalDistance(places: Place[]): number {
    let total = 0

    for (let i = 0; i < places.length - 1; i++) {
      const current = places[i]
      const next = places[i + 1]

      if (current.lat !== null && current.lng !== null && next.lat !== null && next.lng !== null) {
        total += calculateDistance(current.lat, current.lng, next.lat, next.lng)
      }
    }

    return total
  }

  private calculateRouteScore(route: RouteResult, options: RouteOptions): number {
    let score = 100 // Base score

    // Penalize long routes
    if (options.maxDistance && route.totalDistance > options.maxDistance) {
      score -= (route.totalDistance - options.maxDistance) * 10
    }

    // Reward compact routes
    score -= route.totalDistance * 2

    // Reward good time estimates
    if (route.estimatedTime < 180) {
      // Less than 3 hours
      score += 20
    }

    // Bonus for scenic routes if preferred
    if (options.preferScenicRoute) {
      const scenicPlaces = route.orderedPlaces.filter((p) => p.category === "park" || p.category === "walkway").length
      score += scenicPlaces * 10
    }

    return Math.max(0, score)
  }

  private createRouteResult(places: Place[], totalDistance: number, options: RouteOptions): RouteResult {
    const estimatedTime = this.estimateRouteTime(totalDistance, places.length, options.mode)
    const gmapsUrl = buildGoogleMapsUrl(places, options.mode)
    const routeQuality = this.assessRouteQuality(totalDistance, places.length, options.mode)

    return {
      orderedPlaces: places,
      totalDistance,
      estimatedTime,
      gmapsUrl,
      routeQuality,
    }
  }

  private estimateRouteTime(distance: number, placeCount: number, mode: TravelMode): number {
    const baseSpeed = mode === "walking" ? 4 : 30 // km/h
    const travelTime = (distance / baseSpeed) * 60 // minutes
    const stopTime = placeCount * (mode === "walking" ? 20 : 15) // minutes per stop

    return Math.round(travelTime + stopTime)
  }

  private assessRouteQuality(distance: number, placeCount: number, mode: TravelMode): "excellent" | "good" | "fair" {
    const avgDistancePerPlace = distance / Math.max(1, placeCount - 1)

    if (mode === "walking") {
      if (avgDistancePerPlace < 0.5 && distance < 3) return "excellent"
      if (avgDistancePerPlace < 1 && distance < 5) return "good"
      return "fair"
    } else {
      if (avgDistancePerPlace < 2 && distance < 15) return "excellent"
      if (avgDistancePerPlace < 5 && distance < 25) return "good"
      return "fair"
    }
  }

  private createSinglePlaceRoute(place: Place, options: RouteOptions): RouteResult {
    return {
      orderedPlaces: [place],
      totalDistance: 0,
      estimatedTime: 30, // 30 minutes at the place
      gmapsUrl: buildGoogleMapsUrl([place], options.mode),
      routeQuality: "excellent",
    }
  }

  private addressBasedRoute(places: Place[], options: RouteOptions): RouteResult {
    // For places without coordinates, use simple ordering
    const totalDistance = 0 // Can't calculate without coordinates
    const estimatedTime = places.length * 45 // 45 minutes per place
    const gmapsUrl = buildGoogleMapsUrl(places, options.mode)

    return {
      orderedPlaces: places,
      totalDistance,
      estimatedTime,
      gmapsUrl,
      routeQuality: "fair",
    }
  }

  private fallbackRoute(places: Place[], options: RouteOptions): RouteResult {
    // Simple fallback: use places as-is
    return this.createRouteResult(places, 0, options)
  }
}

export const routeService = new RouteService()
