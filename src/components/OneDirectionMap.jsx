'use client'

import { useEffect, useRef } from 'react'
import maplibregl from '@neshan-maps-platform/maplibre-sdk'
import '@neshan-maps-platform/maplibre-sdk/style.css'
import polyline from '@mapbox/polyline'

const destinations = [
  { lat: 35.70115, lng: 51.383743, title: 'مبدا' },
  { lat: 35.715, lng: 51.395, title: 'مقصد اول (میانی)' },
  { lat: 35.73115, lng: 51.413743, title: 'مقصد دوم (نهایی)' },
]

export default function MapView({ apiKey, style }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      style,
      apiKey,
      zoom: 15,
      center: [51.383743, 35.70115],
      container: containerRef.current,
    })

    destinations.forEach((dest, index) => {
      const markerColor =
        index === 0
          ? '#2E7D32'
          : index === destinations.length - 1
            ? '#C62828'
            : '#0288D1'

      new maplibregl.Marker({ color: markerColor })
        .setLngLat([dest.lng, dest.lat])
        .setPopup(new maplibregl.Popup().setHTML(`<h3>${dest.title}</h3>`))
        .addTo(mapRef.current)
    })

    const routingApiKey = 'service.b819f7aa8a4c430a9b6abd32d25e0e71'

    const fetchRoute = async () => {
      const origin = destinations[0]
      const destination = destinations[destinations.length - 1]

      const waypoints = destinations.slice(1, -1)
      const waypointsParam = waypoints.length
        ? `&waypoints=${waypoints.map((p) => `${p.lat},${p.lng}`).join('|')}`
        : ''

      const url = `https://api.neshan.org/v4/direction?type=car&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${waypointsParam}`

      try {
        const response = await fetch(url, {
          headers: { 'Api-Key': routingApiKey },
        })
        const data = await response.json()

        if (data.routes?.length) {
          const coords = polyline
            .decode(data.routes[0].overview_polyline.points)
            .map(([lat, lng]) => [lng, lat])

          const geojsonData = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
          }

          if (mapRef.current.getSource('route')) {
            mapRef.current.getSource('route').setData(geojsonData)
          } else {
            mapRef.current.addSource('route', {
              type: 'geojson',
              data: geojsonData,
            })

            mapRef.current.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#1565C0',
                'line-width': 5,
                'line-opacity': 0.85,
              },
            })
          }

          const bounds = coords.reduce(
            (acc, c) => acc.extend(c),
            new maplibregl.LngLatBounds(coords[0], coords[0]),
          )
          mapRef.current.fitBounds(bounds, { padding: 80, duration: 800 })
        } else {
          console.error('پاسخ بدون مسیر:', data)
        }
      } catch (err) {
        console.error('خطا در دریافت مسیر:', err)
      }
    }
    mapRef.current.on('load', fetchRoute)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [apiKey, style])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
}
