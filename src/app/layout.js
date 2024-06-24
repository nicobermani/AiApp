import './globals.css'

export const metadata = {
  title: 'Explore AI',
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
