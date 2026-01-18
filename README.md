# NATO Live Tracker

A modern, real-time military aircraft tracking dashboard built with Next.js, featuring Apple iOS 26 design guidelines with glass morphism, aqua effects, and minimal aesthetics.

## Features

### 🎨 Apple iOS 26 Design
- **Glass Morphism**: Translucent panels with backdrop blur effects
- **Aqua System**: iOS-inspired color palette and visual hierarchy
- **SF Pro Typography**: Apple's system font with proper weights and spacing
- **Minimal Aesthetics**: Clean, focused interface following Apple HIG

### 🗺️ Multi-Region Monitoring
- **World Overview**: Global aircraft tracking
- **EE/RU Border**: Estonia-Russia border region
- **Around Russia**: Extended Russian periphery
- **Black Sea**: Black Sea region monitoring
- **Baltic Sea**: Baltic region coverage

### 🛩️ Advanced Aircraft Detection
- **Real-time Tracking**: 30-second refresh intervals
- **Loitering Detection**: Identifies slow-moving aircraft (<150 kt)
- **Military Classification**: NATO callsign pattern recognition
- **Multi-source Data**: ADS-B Exchange (primary) + OpenSky Network (fallback)

### 🎛️ Interactive Controls
- **Smart Filtering**: Military/civilian, altitude ranges, loitering status
- **Live Search**: ICAO codes and callsigns
- **Visual Options**: Trails, heatmaps, cluster markers
- **30-Minute Playback**: Historical data visualization

### 📊 Real-time Analytics
- Live aircraft counters
- Military vs civilian breakdown
- Loitering aircraft alerts
- High-altitude traffic monitoring

### 🗺️ Dual Mapping System
- **Mapbox GL JS**: Premium dark theme (with `NEXT_PUBLIC_MAPBOX_TOKEN`)
- **Leaflet + OSM**: Fallback for key-free preview
- Automatic detection and switching

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone and install
git clone <repository-url>
cd nato-live-tracker
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

### Environment Variables

Create `.env.local`:

```env
# Optional: Mapbox token for premium maps
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Optional: Enhanced data sources
ADSBX_KEY=your_adsbx_rapidapi_key
OSKY_USER=your_opensky_username
OSKY_PASS=your_opensky_password
```

## API Endpoints

### GET /api/aircraft

Fetch aircraft data for specific regions.

**Parameters:**
- `region`: WORLD | EE_RU_BORDER | AROUND_RU | BLACKSEA | BALTIC
- `source`: auto | adsbx | opensky
- `filter`: all | nato

**Response:**
```json
{
  "aircraft": [
    {
      "icao": "ABC123",
      "callsign": "NATO01",
      "latitude": 59.4370,
      "longitude": 24.7536,
      "altitude": 35000,
      "ground_speed": 450,
      "track": 180,
      "is_military": true,
      "loitering": false,
      "source": "ADS-B Exchange",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "region": "BALTIC",
    "total": 1,
    "loitering": 0,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS / Leaflet
- **Data Fetching**: SWR with 30s cache
- **Deployment**: Vercel-ready

### Project Structure
```
src/
├── app/
│   ├── api/aircraft/route.ts    # Edge API endpoint
│   ├── page.tsx                 # Main dashboard
│   └── layout.tsx               # App layout
├── components/
│   ├── MapPanel.tsx             # Individual map regions
│   ├── FilterPanel.tsx          # Controls & filters
│   ├── StatsPanel.tsx           # Live statistics
│   └── PlaybackControls.tsx     # Historical playback
├── lib/
│   ├── aircraft-utils.ts        # Aircraft classification
│   └── regions.ts               # Regional definitions
└── types/
    └── aircraft.ts              # TypeScript interfaces
```

### Data Sources

1. **ADS-B Exchange** (Primary)
   - Comprehensive military aircraft coverage
   - Real-time updates
   - Requires RapidAPI key for full access

2. **OpenSky Network** (Fallback)
   - Free tier available
   - Good civilian coverage
   - Optional authentication for enhanced limits

## Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
npm run build
vercel --prod
```

### Environment Setup
Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_MAPBOX_TOKEN` (optional)
- `ADSBX_KEY` (optional)
- `OSKY_USER` (optional)
- `OSKY_PASS` (optional)

### Performance Optimization
- Edge API routes for low latency
- SWR caching with 30s revalidation
- Automatic map library selection
- Responsive design for all devices

## Development

### Adding New Regions
1. Update `src/lib/regions.ts`
2. Add bounding box to `REGION_BOUNDS`
3. Region automatically appears in dashboard

### Customizing Aircraft Detection
Modify patterns in `src/lib/aircraft-utils.ts`:
```typescript
const NATO_PATTERNS = [
  /^CUSTOM\d+/i,  // Add custom patterns
  // ... existing patterns
];
```

### Map Customization
- Mapbox: Modify style in `MapPanel.tsx`
- Leaflet: Update tile layer URL for different themes

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **ADS-B Exchange**: Primary aircraft data source
- **OpenSky Network**: Fallback data provider
- **Mapbox**: Premium mapping services
- **OpenStreetMap**: Open-source map tiles
- **Vercel**: Deployment platform
- **Apple**: Design inspiration from iOS 26 Human Interface Guidelines

## Developer
---

**Coding Sharks**  
*developer · systems · code*  
Apple platforms: iOS · macOS  

><(((°> [codingSharks@proton.me](mailto:codingSharks@proton.me)
**⚠️ Disclaimer**: This tool is for educational and research purposes. Aircraft tracking data is publicly available through ADS-B transponders. Always comply with local laws and regulations.