'use client'
import React, { useState, useEffect } from 'react'

const aiLinks = [
  'https://code.benco.io/icon-collection/azure-icons/',
  
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
      <h2 className="text-2xl font-bold text-center mb-4">Links</h2>
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
