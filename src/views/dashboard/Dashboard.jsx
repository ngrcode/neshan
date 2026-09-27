'use client'

import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  const arrs = [
    {
      link: '/simple',
      title: 'اولین',
    },
    {
      link: '/oneDirectionMap',
      title: 'با مسیر',
    },
  ]

  return (
    <div className="border text-blue-800 flex flex-row gap-5 m-auto" dir="rtl">
      {arrs.map((item) => (
        <div key={item.title}>
          <button
            onClick={() => {
              router.push(item.link)
            }}
            className="cursor-pointer text-3xl"
          >
            {item.title}
          </button>
        </div>
      ))}
    </div>
  )
}
