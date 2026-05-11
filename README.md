# intervals-icu-mcp

An MCP server that connects Claude to the [Intervals.icu](https://intervals.icu) API, letting you query and manage your training data through natural language.

## Tools

### Athlete
| Tool | Description |
|---|---|
| `get_athlete` | Profile, sport settings, and power/HR zones |

### Activities
| Tool | Description |
|---|---|
| `list_activities` | Recent activities with date range and limit filters |
| `get_activity` | Full detail for a single activity (power, HR, pace, laps, intervals) |
| `create_activity` | Upload a `.fit`, `.tcx`, or `.gpx` file |
| `update_activity` | Update name, description, sport type, or start time |

### Calendar
| Tool | Description |
|---|---|
| `list_events` | Planned workouts and events in a date range |
| `create_event` | Add a planned workout or event to the calendar |
| `update_event` | Edit an existing calendar event |

### Workout Library
| Tool | Description |
|---|---|
| `create_workout` | Create a workout in the library |
| `update_workout` | Edit an existing library workout |

### Performance Curves
| Tool | Description |
|---|---|
| `get_power_curves` | Power-duration curve (MMP) for a date range and sport type |
| `get_hr_curves` | HR-duration curve for a date range and sport type |
| `get_pace_curves` | Pace-duration curve for a date range and sport type |

### Fitness & Wellness
| Tool | Description |
|---|---|
| `get_fitness_summary` | Daily CTL (fitness), ATL (fatigue), TSB (form), and ramp rate over a date range. Defaults to 3 months ago → 3 months ahead |

## Setup

### 1. Get your API key

Go to [intervals.icu/settings](https://intervals.icu/settings) → **Developer Settings** and copy your API key.

### 2. Install and build

```bash
npm install
npm run build
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your key:

```
INTERVALS_API_KEY=your_api_key_here
INTERVALS_ATHLETE_ID=0   # 0 resolves to your own athlete ID
```

### 4. Add to Claude

Add this to your Claude config (`claude_desktop_config.json` or equivalent):

```json
{
  "mcpServers": {
    "intervals": {
      "command": "node",
      "args": ["/path/to/intervals-icu-mcp/dist/index.js"],
      "env": {
        "INTERVALS_API_KEY": "your_api_key_here",
        "INTERVALS_ATHLETE_ID": "0"
      }
    }
  }
}
```

## Development

Run with the MCP Inspector:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Requirements

- Node.js 18+
- An [Intervals.icu](https://intervals.icu) account
