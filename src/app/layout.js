import './globals.css'
import { ThemeProvider } from './ThemeContext'
import ThemeSwitcher from './ThemeSwitcher'

export const metadata = {
  title: 'OuvertAI - Your AI Assistant',
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <header className='flex justify-end p-4'>
            <ThemeSwitcher />
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
