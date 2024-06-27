'use client'
import React, { useState, useEffect } from 'react'

const aiLinks = [
  'https://chatgpt.com',
  'https://copilot.microsoft.com',
  'https://gemini.google.com',
  'https://sdk.vercel.ai',
  'https://you.com',
  'https://www.perplexity.ai',
  'https://github.com/steven2358/awesome-generative-ai',
]

const AiPlaygroundLinks = () => {
  const [linksData, setLinksData] = useState([])

  useEffect(() => {
    const fetchLinksData = async () => {
      const dataPromises = aiLinks.map(async (link) => ({
        url: link,
        favicon: `https://www.google.com/s2/favicons?domain=${
          new URL(link).hostname
        }`,
      }))

      const data = await Promise.all(dataPromises)
      setLinksData(data)
    }

    fetchLinksData()
  }, [])

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <h2 className="text-2xl font-bold text-center mb-4">AI Apps</h2>
      <ul className="divide-y divide-gray-200">
        {linksData.map((link, index) => (
          <li key={index} className="flex items-center p-4">
            <img
              src={link.favicon}
              alt={`${link.url} favicon`}
              className="w-6 h-6 mr-4"
            />
            <a
              href={link.url}
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AiPlaygroundLinks
