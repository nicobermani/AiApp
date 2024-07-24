'use client'
import React from 'react'

const notes = ['^\\s*$\\n', 'python -m venv venv', 'venvScriptsactivate']

const AiPlaygroundLinks = () => {
  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <h2 className="text-2xl font-bold text-center mb-4">Notes</h2>
      <ul className="divide-y divide-gray-200">
        {notes.map((note, index) => (
          <li key={index} className="flex items-center p-4">
            <pre
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: note }}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AiPlaygroundLinks
