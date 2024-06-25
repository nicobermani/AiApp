'use client'
import React, { useEffect, useState } from 'react'
import Groq from 'groq-sdk'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import Prism from 'prismjs'
import 'prismjs/themes/prism-okaidia.min.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-bash'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers.js'

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY
const client = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
})
const NUM_RETRIES = 30
const RETRY_DELAY_MS = 10000

export default function Home() {
  const [theme, setTheme] = useState('light')
  const [aiQuery, setAiQuery] = useState('')
  const [responses, setResponses] = useState([])
  const [numResponses, setNumResponses] = useState(6)
  const [maximizedResponse, setMaximizedResponse] = useState(null)

  useEffect(() => {
    Prism.highlightAll()
  }, [responses])

  const handleAskAi = async () => {
    setResponses([])

    const queries = Array.from({ length: numResponses }, (_, i) => ({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        {
          role: 'user',
          content: `${aiQuery}`,
        },
      ],
      model: 'llama3-70b-8192',
    }))

    await Promise.all(
      queries.map(async (query, index) => {
        for (let attempt = 0; attempt <= NUM_RETRIES; attempt++) {
          try {
            const response = await client.chat.completions.create(query)
            setResponses((prevResponses) => {
              const newResponses = [...prevResponses]
              newResponses[index] = response.choices[0].message.content
              return newResponses
            })
            break
          } catch (error) {
            console.error(
              `Error querying Groq API (attempt ${attempt + 1}):`,
              error
            )
            if (attempt === NUM_RETRIES) {
              setResponses((prevResponses) => {
                const newResponses = [...prevResponses]
                newResponses[index] = 'Error: Request failed after retries'
                return newResponses
              })
            } else {
              await new Promise((resolve) =>
                setTimeout(resolve, RETRY_DELAY_MS)
              )
            }
          }
        }
      })
    )

  }

  const handleNumResponsesChange = (event) => {
    let value = parseInt(event.target.value, 10)
    if (isNaN(value) || value < 1) {
      value = 1
    } else if (value > 6) {
      value = 6
    }
    setNumResponses(value)
  }

  const toggleMaximize = (index) => {
    if (maximizedResponse === index) {
      setMaximizedResponse(null)
    } else {
      setMaximizedResponse(index)
    }
  }

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
        <div className="flex items-center justify-between py-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4">
            OuvertAI
          </h1>

          <button
            onClick={toggleTheme}
            className={`py-2 px-6 rounded-full font-semibold shadow-lg transition duration-300 ${
              theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          </button>
        </div>

        <div
          className={`mb-6 p-6 rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}
        >
          <textarea
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Type your query for AI..."
            className={`w-full px-4 py-3 rounded-md focus:outline-none focus:ring focus:ring-blue-500 resize-none shadow-inner ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-black'
            }`}
            rows="4"
          />
          <div className="flex items-center mt-4">
            <label
              htmlFor="numResponses"
              className={`mr-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              Number of Responses (max 6):
            </label>
            <input
              type="number"
              id="numResponses"
              min="1"
              max="6"
              value={numResponses}
              onChange={handleNumResponsesChange}
              className={`rounded-md px-3 py-1 focus:outline-none focus:ring focus:ring-blue-500 w-20 shadow-inner ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-black'
              }`}
            />
            <button
              onClick={handleAskAi}
              className={`ml-auto font-medium py-2 px-6 ${
                theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              Ask AI
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {responses.map((response, index) => (
          <div
            key={index}
            className={`rounded-lg p-6 overflow-auto min-h-[150px] shadow-lg transition-all duration-300 ease-in-out transform ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            } ${
              maximizedResponse === index
                ? 'fixed inset-0 z-10 p-8 transform scale-100'
                : ''
            }`}
          >
            <div className="flex justify-end items-center mb-2">
              <button
                onClick={() => toggleMaximize(index)}
                className={`font-medium py-1 px-2 rounded-md transition-transform transform hover:scale-105 shadow ${
                  theme === 'dark'
                    ? 'bg-white text-black'
                    : 'bg-black text-white'
                }`}
              >
                {maximizedResponse === index ? 'Minimize' : 'Maximize'}
              </button>
            </div>

            <div className="prose max-w-none">
              <Markdown
                rehypePlugins={[rehypeHighlight]}
                remarkPlugins={[remarkGfm]}
              >
                {response}
              </Markdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}