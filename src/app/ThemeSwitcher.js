'use client'

import React, { useContext } from 'react'
import ThemeContext from './ThemeContext'

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <button
      onClick={toggleTheme}
      className={`transition duration-300 ease-in-out p-2 rounded-full shadow-lg ${
        theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
      }`}
      aria-label='Toggle Theme'
    >
      {theme === 'dark' ? '🌞' : '🌜'}
    </button>
  )
}
