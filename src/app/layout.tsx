import './globals.css';

export const metadata = {
  title: 'NATO WATCH',
  description: 'Military Aircraft Tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Leaflet CSS - critical for map tiles to display correctly */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0a0f0a' }}>
        {children}
      </body>
    </html>
  )
}
