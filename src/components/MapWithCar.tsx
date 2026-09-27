'use client'

import { useEffect, useRef } from 'react'
import maplibregl from '@neshan-maps-platform/maplibre-sdk'
import '@neshan-maps-platform/maplibre-sdk/style.css'
import polyline from '@mapbox/polyline'

const destinations = [
  { lat: 35.70115, lng: 51.383743, title: 'Origin' },
  { lat: 35.715, lng: 51.395, title: 'Stop 1' },
  { lat: 35.73115, lng: 51.413743, title: 'Destination' },
]

// تابع محاسبه زاویه چرخش ماشین بر حسب درجه
function getBearing(start: [number, number], end: [number, number]): number {
  const [startLng, startLat] = start
  const [endLng, endLat] = end

  const y =
    Math.sin((endLng - startLng) * (Math.PI / 180)) *
    Math.cos(endLat * (Math.PI / 180))
  const x =
    Math.cos(startLat * (Math.PI / 180)) * Math.sin(endLat * (Math.PI / 180)) -
    Math.sin(startLat * (Math.PI / 180)) *
      Math.cos(endLat * (Math.PI / 180)) *
      Math.cos((endLng - startLng) * (Math.PI / 180))

  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360
}

interface MapViewProps {
  apiKey: string
  style?: string
}

export default function MapWithCar({ apiKey, style }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      style,
      apiKey,
      zoom: 15,
      center: [51.383743, 35.70115],
      container: containerRef.current,
    })

    // اضافه کردن مارکرهای مقصد
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

    const secretKey = 'service.b819f7aa8a4c430a9b6abd32d25e0e71'

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
          headers: { 'Api-Key': secretKey },
        })
        const data = await response.json()

        if (data.routes?.length) {
          const coords: [number, number][] = polyline
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

          // ساخت المان DOM برای ماشین
          const carEl = document.createElement('div')
          carEl.className = 'car-marker'
          carEl.innerHTML = `
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.85 7H17.14L18.22 10.11H5.78L6.85 7ZM19 17H5V12H19V17Z" fill="#D32F2F"/>
              <circle cx="7.5" cy="14.5" r="1.5" fill="#FFFFFF"/>
              <circle cx="16.5" cy="14.5" r="1.5" fill="#FFFFFF"/>
            </svg>
          `
          carEl.style.width = '34px'
          carEl.style.height = '34px'
          carEl.style.transformOrigin = 'center center'

          const carMarker = new maplibregl.Marker({
            element: carEl,
            rotationAlignment: 'map',
          })
            .setLngLat(coords[0])
            .addTo(mapRef.current)

          // متحرک‌سازی ماشین در طول مسیر
          let currentIndex = 0
          let progress = 0
          const speed = 0.04 // سرعت حرکت بین هر دو نقطه (قابل تغییر)

          const animate = () => {
            if (currentIndex >= coords.length - 1) return

            const startPoint = coords[currentIndex]
            const nextPoint = coords[currentIndex + 1]

            progress += speed

            if (progress >= 1) {
              progress = 0
              currentIndex++
            }

            if (currentIndex < coords.length - 1) {
              const currentLng =
                startPoint[0] + (nextPoint[0] - startPoint[0]) * progress
              const currentLat =
                startPoint[1] + (nextPoint[1] - startPoint[1]) * progress

              carMarker.setLngLat([currentLng, currentLat])

              // محاسبه زاویه و چرخش ماشین
              const bearing = getBearing(startPoint, nextPoint)
              carEl.style.transform = `rotate(${bearing}deg)`

              animationFrameRef.current = requestAnimationFrame(animate)
            } else {
              carMarker.setLngLat(coords[coords.length - 1])
            }
          }

          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          console.error('No route returned:', data)
        }
      } catch (err) {
        console.error('Failed to fetch route:', err)
      }
    }

    mapRef.current.on('load', fetchRoute)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [apiKey, style])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
}
