'use client'
import React, { useEffect, useState } from 'react'
import Groq from 'groq-sdk'
import { createClient } from '@vercel/kv'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import Prism from 'prismjs'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/themes/prism-okaidia.min.css'

const NUM_RETRIES = 30
const RETRY_DELAY_MS = 10000
const MAX_ANS = 20

const client = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
})

const kvClient = createClient({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
})

export default function Home() {
  const [theme, setTheme] = useState('light')
  const [aiQuery, setAiQuery] = useState('')
  const [responses, setResponses] = useState([])
  const [numResponses, setNumResponses] = useState(6)
  const [maximizedResponse, setMaximizedResponse] = useState(null)
  const [queries, setQueries] = useState([])

  useEffect(() => {
    Prism.highlightAll()
  }, [responses])

  useEffect(() => {
    const fetchQueries = async () => {
      const allQueryKeys = await kvClient.keys('query:*')
      const sortedQueryKeys = allQueryKeys.sort().slice(-5).reverse()
      const queryValues = await Promise.all(
        sortedQueryKeys.map(async (key) => {
          const value = await kvClient.get(key)
          return value
        })
      )
      setQueries(queryValues)
    }

    fetchQueries()
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

    const queryId = Date.now().toString()
    await kvClient.set(`query:${queryId}`, aiQuery)

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

            // await kvClient.set(
            //   `response:${queryId}:${index}`,
            //   response.choices[0].message.content
            // )
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
    } else if (value > MAX_ANS) {
      value = MAX_ANS
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
        <div className="flex items-center justify-center py-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Ouvert
            <span className="ai-heading-css">AI</span>
          </h1>
        </div>

        <div
          className={`mb-6 p-6 rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          } `}
        >
          <textarea
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Type your query for AI..."
            className={`w-full px-4 py-3 rounded-md ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-black'
            }`}
            rows="5"
          />
          <div className="div1-css mt-4">
            <div className="div1-css">
              <label
                htmlFor="numResponses"
                className={` ${theme === 'dark' ? 'text-white' : 'text-black'}`}
              >
                Number of Responses (max {MAX_ANS})
              </label>
              <input
                type="number"
                id="numResponses"
                min="1"
                max={MAX_ANS}
                value={numResponses}
                onChange={handleNumResponsesChange}
                className={`rounded-md p-3 ${
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-black'
                }`}
              />
            </div>
            <button
              onClick={toggleTheme}
              className={`button-css  ${
                theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              {theme === 'light'
                ? 'Switch to Dark Mode'
                : 'Switch to Light Mode'}
            </button>
            <button
              onClick={handleAskAi}
              className={`button-css  ${
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
            className={`rounded-lg p-6 overflow-auto  ${
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
                className={`button-css ${
                  theme === 'dark'
                    ? 'bg-white text-black'
                    : 'bg-black text-white'
                }`}
              >
                {maximizedResponse === index ? 'Minimize' : 'Maximize'}
              </button>
            </div>

            <div>
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
  )
}
