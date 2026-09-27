'use client'
import dynamic from 'next/dynamic'

const SimpleMap = dynamic(() => import('../../components/SimpleMap.tsx'), {
  ssr: false,
})

const Simple = () => {
  return <SimpleMap apiKey="web.c54ac28cdfd742889ebdd38c42843a1b" />
}

export default Simple
