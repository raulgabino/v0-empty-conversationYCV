import { type NextRequest, NextResponse } from "next/server"
import { routeService } from "@/lib/route-service"
import type { TravelMode } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { places, options } = await request.json()

    if (!places || !Array.isArray(places) || places.length === 0) {
      return NextResponse.json({ error: "Places array is required and cannot be empty" }, { status: 400 })
    }

    // Validate places structure
    const validPlaces = places.filter((place: any) => place.id && place.name && place.address)

    if (validPlaces.length === 0) {
      return NextResponse.json({ error: "No valid places provided" }, { status: 400 })
    }

    // Generate optimal route
    const routeOptions = {
      mode: (options?.mode as TravelMode) || "walking",
      maxDistance: options?.maxDistance || undefined,
      preferScenicRoute: options?.preferScenicRoute || false,
      avoidBacktracking: options?.avoidBacktracking || true,
    }

    const result = routeService.generateOptimalRoute(validPlaces, routeOptions)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Route optimization error:", error)

    return NextResponse.json(
      {
        error: "Failed to optimize route",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
