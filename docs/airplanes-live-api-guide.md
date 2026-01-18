# AIRPLANES.LIVE REST API GUIDE

## API Location
- **Base URL**: `https://api.airplanes.live/v2/`
- No SLA, No Uptime Guarantee
- **Non-Commercial Use Only**
- Access does not currently require a feeder (might change)

## Rate Limiting
**1 request per second** - This is strict!

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hex/[hex]` | GET | Returns all aircraft with exact match on Mode S hex ids (limit 1000) |
| `/callsign/[callsign]` | GET | Returns all aircraft with exact match on callsigns (limit 1000 or 8000 chars) |
| `/reg/[reg]` | GET | Returns all aircraft with exact match on registrations (limit 1000 or 8000 chars) |
| `/type/[type]` | GET | Returns all aircraft with specified ICAO type codes (A321, B738, etc.) |
| `/squawk/[squawk]` | GET | Returns all aircraft squawking the specified value |
| `/mil` | GET | **Returns ALL aircraft tagged as military** ⭐ |
| `/ladd` | GET | Returns all aircraft tagged as LADD |
| `/pia` | GET | Returns all aircraft tagged as PIA |
| `/point/[lat]/[lon]/[radius]` | GET | Returns all aircraft within radius of point (max 250 nm) |

## Key Endpoints for NATO Watch

### 1. Military Only (RECOMMENDED)
```bash
curl https://api.airplanes.live/v2/mil
```
Returns ALL military aircraft worldwide - perfect for our use case!

### 2. Point/Radius Search
```bash
curl https://api.airplanes.live/v2/point/52.52/13.405/250
```
Returns all aircraft within 250 nautical miles of Berlin.

### 3. Specific Aircraft Types
```bash
# Tankers
curl https://api.airplanes.live/v2/type/KC135
curl https://api.airplanes.live/v2/type/KC10

# Fighters
curl https://api.airplanes.live/v2/type/F16
curl https://api.airplanes.live/v2/type/F35

# Surveillance
curl https://api.airplanes.live/v2/type/E3
curl https://api.airplanes.live/v2/type/RC135
```

### 4. Emergency Squawks
```bash
# Hijack
curl https://api.airplanes.live/v2/squawk/7500

# Radio Failure
curl https://api.airplanes.live/v2/squawk/7600

# Emergency
curl https://api.airplanes.live/v2/squawk/7700
```

## Example JSON Output

See: https://airplanes.live/rest-api-adsb-data-field-descriptions/

## Data Fields (Common)

| Field | Description |
|-------|-------------|
| `hex` | Mode S hex identifier |
| `flight` | Callsign |
| `r` | Registration |
| `t` | ICAO aircraft type |
| `desc` | Aircraft description |
| `lat` | Latitude |
| `lon` | Longitude |
| `alt_baro` | Barometric altitude (ft) or "ground" |
| `gs` | Ground speed (knots) |
| `track` | Track/heading (degrees) |
| `squawk` | Squawk code |
| `category` | Aircraft category |
| `seen` | Seconds since last message |

## Best Practices

1. **Cache responses** - At least 1.5-2 seconds
2. **Use `/mil` endpoint** - More efficient than filtering `/point` results
3. **Poll max every 2 seconds** - Stay under rate limit
4. **Handle rate limit errors** - Response will be text, not JSON

## Terms of Use
https://airplanes.live/terms-of-use/

## Contributing
Consider contributing a feeder: https://airplanes.live/getting-started/
