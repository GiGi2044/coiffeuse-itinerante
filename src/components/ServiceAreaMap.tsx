'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// Patricia's base (Corminboeuf, FR) — geocoded via Nominatim.
const CENTER: [number, number] = [46.8116318, 7.1052486]
const RADIUS_METERS = 12_000
const ZOOM = 10

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
        center: CENTER,
        zoom: ZOOM,
        scrollWheelZoom: false,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      L.circle(CENTER, {
        radius: RADIUS_METERS,
        color: '#a8617a',
        weight: 2,
        opacity: 0.6,
        fillColor: '#a8617a',
        fillOpacity: 0.15,
      }).addTo(map)
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
      aria-label="Carte de la zone de déplacement de Patricia, un rayon d'environ 12 km autour de Corminboeuf"
    />
  )
}
