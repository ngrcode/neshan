'use client'
import dynamic from 'next/dynamic'

const OneDirectionMapCompo = dynamic(
  () => import('../../components/OneDirectionMap.jsx'),
  {
    ssr: false,
  },
)

const OneDirectionMap = () => {
  return (
    <OneDirectionMapCompo
      apiKey="web.c54ac28cdfd742889ebdd38c42843a1b"
      style="https://static.neshan.org/sdk/maplibre/styles/light.json"
    />
  )
}

export default OneDirectionMap
