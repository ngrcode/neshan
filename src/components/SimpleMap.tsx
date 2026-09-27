'use client'

import { useEffect, useRef } from 'react'
import maplibregl from '@neshan-maps-platform/maplibre-sdk'
import '@neshan-maps-platform/maplibre-sdk/style.css'

interface NeshanProps {
  center?: [number, number]
  zoom?: number
  minZoom?: number
  maxZoom?: number
  className?: string
  apiKey: string
}

const SimpleMap: React.FC<NeshanProps> = ({
  center = [51.383743, 35.70115],
  zoom = 12,
  apiKey,
  minZoom = 2,
  maxZoom = 21,
  className = 'w-full h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://static.neshan.org/sdk/maplibre/styles/light.json',
      center: center,
      zoom: zoom,
      minZoom: minZoom,
      maxZoom: maxZoom,
      trackResize: true,
      apiKey,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [center, zoom, minZoom, maxZoom])

  return <div ref={mapContainerRef} className={className} />
}

export default SimpleMap
