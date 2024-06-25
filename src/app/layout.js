import './globals.css'

export const metadata = {
  title: 'OuvertAI - Your AI Assistant',
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
