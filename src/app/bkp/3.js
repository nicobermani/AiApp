"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import Groq from "groq-sdk";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.min.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-bash";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import Image from "next/image";

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const client = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});
const NUM_RETRIES = 30;
const RETRY_DELAY_MS = 10000;

export default function Home() {
  const [aiQuery, setAiQuery] = useState("");
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [numResponses, setNumResponses] = useState(10); // Default to 10 responses
  const [maximizedResponse, setMaximizedResponse] = useState(null);

  useEffect(() => {
    Prism.highlightAll();
  }, [responses]);

  const handleAskAi = async () => {
    setLoading(true);
    setResponses([]); // Clear previous responses

    const queries = Array.from({ length: numResponses }, (_, i) => ({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `${aiQuery} (Variation ${i + 1})`,
        },
      ],
      model: "llama3-8b-8192",
    }));

    await Promise.all(
      queries.map(async (query, index) => {
        for (let attempt = 0; attempt <= NUM_RETRIES; attempt++) {
          try {
            const response = await client.chat.completions.create(query);
            setResponses((prevResponses) => {
              const newResponses = [...prevResponses];
              newResponses[index] = response.choices[0].message.content;
              return newResponses;
            });
            break;
          } catch (error) {
            console.error(
              `Error querying Groq API (attempt ${attempt + 1}):`,
              error
            );
            if (attempt === NUM_RETRIES) {
              setResponses((prevResponses) => {
                const newResponses = [...prevResponses];
                newResponses[index] = "Error: Request failed after retries";
                return newResponses;
              });
            } else {
              await new Promise((resolve) =>
                setTimeout(resolve, RETRY_DELAY_MS)
              );
            }
          }
        }
      })
    );

    setLoading(false);
  };

  const handleNumResponsesChange = (event) => {
    let value = parseInt(event.target.value, 10);
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > 100) {
      value = 100;
    }
    setNumResponses(value);
  };

  const toggleMaximize = (index) => {
    if (maximizedResponse === index) {
      setMaximizedResponse(null);
    } else {
      setMaximizedResponse(index);
    }
  };

  return (
    <div className="bg-gray-900 text-white font-mono min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-indigo-500 drop-shadow-lg">
          Nico AI
        </h1>

        <div className="mb-6 bg-gray-800 p-4 rounded-md shadow-lg">
          <textarea
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Type your query for AI..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring focus:ring-blue-500 resize-none shadow-inner"
            rows="4"
          />
          <div className="flex items-center mt-4">
            <label htmlFor="numResponses" className="mr-2 text-gray-400">
              Number of Responses (max 100):
            </label>
            <input
              type="number"
              id="numResponses"
              min="1"
              max="100"
              value={numResponses}
              onChange={handleNumResponsesChange}
              className="bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-white focus:outline-none focus:ring focus:ring-blue-500 w-20 shadow-inner"
            />
            <button
              onClick={handleAskAi}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2 px-6 rounded-md ml-auto transition-transform transform hover:scale-105 shadow-lg"
            >
              Ask AI
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full text-center py-4 text-gray-400 animate-pulse">
              Loading AI responses...
            </div>
          )}

          {responses.map((response, index) => (
            <div
              key={index}
              className={`bg-gray-800 rounded-md p-4 overflow-auto min-h-[150px] shadow-lg transition-all duration-300 ease-in-out transform ${
                maximizedResponse === index
                  ? "fixed inset-0 z-50 p-8 bg-gray-900 transform scale-105"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-indigo-400 drop-shadow">
                  Response {index + 1}
                </h2>
                <button
                  onClick={() => toggleMaximize(index)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-2 rounded-md transition-transform transform hover:scale-105 shadow"
                >
                  {maximizedResponse === index ? "Minimize" : "Maximize"}
                </button>
              </div>
              {response ? (
                <div className="response-content prose">
                  <Markdown
                    rehypePlugins={[rehypeHighlight]}
                    remarkPlugins={[remarkGfm]}
                  >
                    {response}
                  </Markdown>
                </div>
              ) : (
                <div className="text-gray-400">Waiting for response...</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
