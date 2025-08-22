// Core types for Your City Vibes app
export type VibeCode =
  | "chill-cafe"
  | "arte-cultura"
  | "BELLAQUEO"
  | "STREET_FOOD"
  | "LIVE_MUSIC"
  | "MIRADORES_FOTOS"
  | "DEPORTES_JUEGO"
  | "FAMILY_KIDS"

export type CityId = "ciudad-victoria" | "monterrey" | "cdmx"
export type TravelMode = "walking" | "driving"

export interface Coordinates {
  lat: number
  lng: number
}

export interface Place {
  id: string
  name: string
  category: string
  vibes: VibeCode[]
  address: string
  lat: number | null
  lng: number | null
}

export interface City {
  id: CityId
  name: string
  center: Coordinates
  places: Place[]
}

export interface Dataset {
  cities: City[]
}

export interface UserInput {
  city_id: CityId
  user_text: string
  mode: TravelMode
  max_stops: number
}

export interface DetectedVibe {
  vibe_code: VibeCode
  confidence: number
  keywords: string[]
}

export interface RouteInfo {
  mode: TravelMode
  ordered: Place[]
  gmaps_url: string
}

export interface BellaqueoExtras {
  temas_sugeridos?: string[]
  plan_b?: string
  safety_tips?: string[]
}

export interface YCVResponse {
  input: UserInput
  vibe: DetectedVibe
  selection: Place[]
  route: RouteInfo
  ui_copy: {
    title: string
    subtitle: string
  }
  extras?: BellaqueoExtras
}

export interface UICard {
  title: string
  subtitle: string
  coords: string | null
  order: number
}

export interface UIPresentation {
  header: {
    title: string
    subtitle: string
    badge: VibeCode
  }
  cards: UICard[]
  cta: {
    url: string
    text: string
  }
}
