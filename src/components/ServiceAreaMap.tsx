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

// A real circle reads more cleanly than the rounded polygon did — centered on
// the centroid of the 8 towns above (not Corminboeuf specifically), with a
// radius wide enough to fully contain the farthest of them (Courtepin, the
// outermost at ~11.4km from that centroid), rounded up slightly for margin.
const CIRCLE_CENTER: [number, number] = [46.7646, 7.1012]
const CIRCLE_RADIUS_METERS = 12_000

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

      // Circle/polygon layers need the map to already have a view (center +
      // zoom) before they can project themselves — getBounds() on a layer
      // added to a view-less map throws, since it has nothing to project
      // against yet. Give it a sensible starting view immediately; fitBounds
      // below then refines it once the circle exists.
      const map = L.map(containerRef.current, {
        center: CIRCLE_CENTER,
        zoom: 11,
        scrollWheelZoom: false,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      const area = L.circle(CIRCLE_CENTER, {
        radius: CIRCLE_RADIUS_METERS,
        color: '#a8617a',
        weight: 2,
        opacity: 0.6,
        fillColor: '#a8617a',
        fillOpacity: 0.15,
      }).addTo(map)

      // Frame the circle with breathing room, then zoom in one extra level so
      // it starts a bit larger/closer than a bare fitBounds would leave it.
      map.fitBounds(area.getBounds(), { padding: [32, 32] })
      map.zoomIn(1)
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
