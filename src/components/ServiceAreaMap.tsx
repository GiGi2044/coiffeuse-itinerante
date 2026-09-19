'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// Patricia's actual coverage area — not a radius, a specific set of towns she
// travels to (everything east of Fribourg is explicitly excluded, and Payerne
// is too far west). Ordered to trace a simple ring around the area (sorted by
// angle from the centroid): Lentigny (W) → Gibloux (SW) → Rossens (SW) →
// La Roche (S) → Le Mouret (S/SE) → Fribourg (E boundary) → Courtepin (N) →
// Grolley (NW) → back to Lentigny. All geocoded via Nominatim.
const AREA: [number, number][] = [
  [46.7595292, 7.0037236], // Lentigny
  [46.6841642, 7.0402724], // Gibloux
  [46.7204051, 7.103161], // Rossens (FR)
  [46.6966582, 7.1393476], // La Roche
  [46.7487136, 7.1718165], // Le Mouret
  [46.8055656, 7.1612669], // Fribourg
  [46.8660381, 7.1228659], // Courtepin
  [46.8355689, 7.0672555], // Grolley
]

// Rounds the polygon's sharp corners into a smoother, more organic outline.
// Each pass replaces every edge with two points 1/4 and 3/4 along it — every
// output point is a weighted average of two adjacent input points, so the
// result can only stay inside the original shape's hull, never bulge past it
// (mathematically guaranteed, not just visually likely) — it can round the
// area out to towns not explicitly listed, but never extend meaningfully
// beyond the outermost towns actually given.
function chaikinSmooth(points: [number, number][], iterations: number): [number, number][] {
  let pts = points
  for (let iter = 0; iter < iterations; iter++) {
    const next: [number, number][] = []
    const n = pts.length
    for (let i = 0; i < n; i++) {
      const [lat0, lon0] = pts[i]
      const [lat1, lon1] = pts[(i + 1) % n]
      next.push([lat0 * 0.75 + lat1 * 0.25, lon0 * 0.75 + lon1 * 0.25])
      next.push([lat0 * 0.25 + lat1 * 0.75, lon0 * 0.25 + lon1 * 0.75])
    }
    pts = next
  }
  return pts
}

const SMOOTHED_AREA = chaikinSmooth(AREA, 3)

// Client-only: Leaflet reaches for `window`/`document` at import time, so it
// can never run during server render — the map is built in a useEffect
// against a ref, after mount, not during the initial render pass. No marker
// pin (Leaflet's default marker icon path breaks under bundlers unless
// reconfigured) — the circle alone communicates the coverage area.
export function ServiceAreaMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    void import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      const area = L.polygon(SMOOTHED_AREA, {
        color: '#a8617a',
        weight: 2,
        opacity: 0.6,
        fillColor: '#a8617a',
        fillOpacity: 0.15,
      }).addTo(map)

      // Frame the shape with generous breathing room, rather than a fixed
      // center/zoom — adapts automatically if the town list ever changes.
      map.fitBounds(area.getBounds(), { padding: [32, 32] })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-lg border border-border sm:h-96"
      role="img"
      aria-label="Carte de la zone de déplacement de Patricia : Fribourg, Le Mouret, La Roche, Rossens, Gibloux, Lentigny, Grolley et Courtepin"
    />
  )
}
