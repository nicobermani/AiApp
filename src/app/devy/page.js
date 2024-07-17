'use client'

import Image from 'next/image'
import React, { useEffect, useState, useRef } from 'react'
import Groq from 'groq-sdk'
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
const MAX_ANS = 10

const client = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
})

const models = [
  { name: 'llama3-70b-8192' },
  { name: 'mixtral-8x7b-32768' },
  { name: 'gemma2-9b-it' },
  { name: 'gemma-7b-it' },
  { name: 'llama3-8b-8192' },
]

export default function Home() {
  const [theme, setTheme] = useState('dark')
  const [aiQuery, setAiQuery] = useState('')
  const [responses, setResponses] = useState([])
  const [numResponses, setNumResponses] = useState(3)
  const [maximizedResponse, setMaximizedResponse] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('llama3-70b-8192')
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const sliderRef = useRef(null)

  useEffect(() => {
    Prism.highlightAll()
  }, [responses])

  useEffect(() => {
    const slider = sliderRef.current
    let isResizing = false

    const startResizing = (e) => {
      isResizing = true
      document.addEventListener('mousemove', resize)
      document.addEventListener('mouseup', stopResizing)
    }

    const resize = (e) => {
      if (isResizing) {
        setSidebarWidth(e.clientX)
      }
    }

    const stopResizing = () => {
      isResizing = false
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', stopResizing)
    }

    slider.addEventListener('mousedown', startResizing)

    return () => {
      slider.removeEventListener('mousedown', startResizing)
    }
  }, [])

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files).filter(shouldBeDisplayed))
  }

  const shouldBeDisplayed = (file) => {
    const path = file.webkitRelativePath
    return !(
      path.includes('/obj/') ||
      path.includes('/Migrations/') ||
      path.includes('/migrations/') ||
      path.includes('GlobalUsings') ||
      path.includes('design') ||
      path.includes('/.git/') ||
      path.includes('/.vs/') ||
      path.includes('node_modules') ||
      path.includes('lock.json') ||
      path.includes('/debug/')
    )
  }

  const renderFileTree = (tree) => {
    return Object.keys(tree).map((key) => {
      const node = tree[key]

      if (node.isFile) {
        return (
          <li key={node.path} className="ml-4">
            <input
              type="checkbox"
              className="file-checkbox mr-2"
              value={node.path}
              id={node.path}
            />
            <label htmlFor={node.path}>{key}</label>
          </li>
        )
      }

      return (
        <details key={key} open className="ml-4">
          <summary className="cursor-pointer">{key}</summary>
          <ul>{renderFileTree(node.children)}</ul>
        </details>
      )
    })
  }

  const buildFileTree = (files) => {
    const fileTree = {}

    files.forEach((file) => {
      const pathParts = file.webkitRelativePath.split('/')
      let current = fileTree

      pathParts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            isFile: index === pathParts.length - 1,
            path: file.webkitRelativePath,
            children: {},
          }
        }
        current = current[part].children
      })
    })

    return fileTree
  }

  const fileTree = buildFileTree(files)

  const handleAskAi = async () => {
    setResponses([])
    setLoading(true)

    const aiquery = aiQuery.trim()
    var selectedFiles = Array.from(
      document.querySelectorAll('.file-checkbox:checked')
    )

    if (selectedFiles.length === 0 && aiquery) {
      await sendToAPI(aiquery)
      return
    }

    var fileContents = ''
    var filesRead = 0

    selectedFiles.forEach((checkbox) => {
      const filePath = checkbox.value
      files.forEach((file) => {
        if (file.webkitRelativePath === filePath) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const content = event.target.result
            fileContents += `${file.webkitRelativePath}\n${content}\n\n`

            filesRead++
            if (filesRead === selectedFiles.length) {
              const combinedQuery = `Code developed so far:\n\n${fileContents}\n\n${aiquery}`

              const queries = Array.from({ length: numResponses }, (_, i) => ({
                messages: [
                  { role: 'system', content: 'You are a helpful assistant.' },
                  { role: 'user', content: `${combinedQuery}` },
                ],
                model: selectedModel,
              }))

              Promise.all(
                queries.map(async (query, index) => {
                  for (let attempt = 0; attempt <= NUM_RETRIES; attempt++) {
                    try {
                      const response = await client.chat.completions.create(
                        query
                      )
                      setResponses((prevResponses) => {
                        const newResponses = [...prevResponses]
                        newResponses[index] =
                          response.choices[0].message.content
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
                          newResponses[index] =
                            'Error: Request failed after retries'
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

              setLoading(false)
            }
          }
          reader.readAsText(file)
        }
      })
    })
  }

  const sendToAPI = async (query) => {
    try {
      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: query },
        ],
        model: selectedModel,
      })

      setResponses([response.choices[0].message.content])
    } catch (error) {
      console.error('Error querying Groq API:', error)
      setResponses(['Error: Failed to get response from AI'])
    } finally {
      setLoading(false)
    }
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
    setMaximizedResponse(maximizedResponse === index ? null : index)
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const ModelDropdown = ({ models, selectedModel, onSelectModel }) => {
    return (
      <div className="relative">
        <label
          htmlFor="selectModel"
          className={`block mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}
        >
          AI Model
        </label>
        <select
          id="selectModel"
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
          className={`w-full rounded-md p-3 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-black'
          }`}
        >
          {models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div
      className={`flex h-screen ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'
      }`}
    >
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className={`h-screen overflow-y-auto p-4 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <h3 className="font-bold text-lg mb-4">File Tree</h3>
        <input
          className={`w-full p-2 mb-4 border rounded ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-gray-100 border-gray-300 text-black'
          }`}
          type="file"
          id="folderInput"
          webkitdirectory=""
          mozdirectory=""
          msdirectory=""
          odirectory=""
          directory=""
          multiple
          onChange={handleFileChange}
        />
        <div className="flex space-x-2 mb-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Check All
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Uncheck All
          </button>
        </div>
        <div className="mt-4">
          <ul>{renderFileTree(fileTree)}</ul>
        </div>
      </aside>

      <div
        ref={sliderRef}
        className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400"
      ></div>

      <main className="flex-1 p-8 overflow-y-auto">
        <div
          className={`mb-8 p-6 rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <textarea
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Type your query for AI..."
            className={`w-full px-4 py-3 rounded-md mb-4 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-gray-100 border-gray-300 text-black'
            }`}
            rows="5"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label
                htmlFor="numResponses"
                className={`block mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}
              >
                AI Responses (max {MAX_ANS})
              </label>
              <input
                type="number"
                id="numResponses"
                min="1"
                max={MAX_ANS}
                value={numResponses}
                onChange={handleNumResponsesChange}
                className={`w-full rounded-md p-3 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-100 border-gray-300 text-black'
                }`}
              />
            </div>
            <ModelDropdown
              models={models}
              selectedModel={selectedModel}
              onSelectModel={(model) => setSelectedModel(model)}
            />
            <button
              onClick={toggleTheme}
              className={`w-full p-3 rounded-md ${
                theme === 'dark'
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              {theme === 'light'
                ? 'Switch to Dark Mode'
                : 'Switch to Light Mode'}
            </button>
            <button
              onClick={handleAskAi}
              className={`w-full p-3 rounded-md ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Ask AI
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <Image
                src="/img/aiLoad1.gif"
                width={64}
                height={64}
                className="w-32 h-32 mx-auto rounded-full"
                alt="Loading"
              />
              <p className="mt-2 text-lg font-semibold">
                Loading AI response using Groq - Fast AI Inference
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {responses.map((response, index) => (
            <div
              key={index}
              className={`rounded-lg p-6 overflow-auto ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } ${
                maximizedResponse === index
                  ? 'fixed inset-0 z-10 p-8 transform scale-100'
                  : ''
              }`}
            >
              <div className="flex justify-end items-center mb-2">
                <button
                  onClick={() => toggleMaximize(index)}
                  className={`px-4 py-2 rounded ${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
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
      </main>
    </div>
  )
}