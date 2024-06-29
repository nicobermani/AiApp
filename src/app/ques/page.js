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
        <div className="flex items-center justify-center py-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Ouvert
            <span className="ai-heading-css">AI</span>
          </h1>
        </div>

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
          <h2 className="text-2xl font-bold mb-4">Last 5 Queries</h2>
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
