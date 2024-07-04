'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@vercel/kv'

const kvClient = createClient({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
})

export default function Home() {
  const [theme, setTheme] = useState('dark')
  const [queries, setQueries] = useState([])

  useEffect(() => {
    const fetchQueries = async () => {
      const allQueryKeys = await kvClient.keys('query:*')
      const sortedQueryKeys = allQueryKeys.sort().slice(-50).reverse()
      const queryValues = await Promise.all(
        sortedQueryKeys.map(async (key) => {
          const value = await kvClient.get(key)
          return value
        })
      )
      setQueries(queryValues)
    }

    fetchQueries()
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div
      className={`min-h-screen px-8 ${
        theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <button
          onClick={toggleTheme}
          className={`button-css  ${
            theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
          }`}
        >
          {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        </button>

        <div
          className={`max-w-7xl mx-auto mt-6 p-6 rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}
        >
          <ul className="list-disc pl-5">
            {queries.map((query, index) => (
              <li key={index}>{query}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
