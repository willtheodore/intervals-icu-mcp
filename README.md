# intervals-icu-mcp

Connect Claude to your [Intervals.icu](https://intervals.icu) training data. Ask questions about your fitness, plan workouts, and manage your calendar — all in plain English.

## What you can ask Claude

- "What did I do last week? How does my training compare to the week before?"
- "How has my fitness and fatigue changed over the last 3 months?"
- "What's my best 20-minute power from the past year?"
- "Create a 45-minute threshold workout and add it to my library."
- "Add a race to my calendar for next Saturday and mark it as an A race."

---

## Getting Started

### What you'll need

- **Node.js 18 or later** — [download at nodejs.org](https://nodejs.org/en/download)
- An **[Intervals.icu](https://intervals.icu)** account

### 1. Get the code

**With Git:**
```bash
git clone https://github.com/willtheodore/intervals-icu-mcp.git
cd intervals-icu-mcp
```

**Without Git:** click **Code → Download ZIP** at the top of this page, unzip it, then open a terminal and `cd` into the unzipped folder.

### Option A: Guided setup (recommended)

Run these three commands from your terminal. They install dependencies, build the server, and launch an interactive setup wizard:

```bash
npm install
npm run build
npm run setup
```

The wizard will ask for your API key, write your `.env` file, and offer to update your Claude Desktop config automatically. When it's done, restart Claude Desktop and you're ready to go.

### Option B: Manual setup

**2. Get your API key**

Log into Intervals.icu, go to **Settings → Developer Settings**, and copy your API key.

**3. Install dependencies and build**

```bash
npm install
npm run build
```

**4. Create a `.env` file**

Copy the example and fill in your details:

```bash
cp .env.example .env
```

Edit `.env`:

```
INTERVALS_API_KEY=your_api_key_here
INTERVALS_ATHLETE_ID=0   # Leave as 0 to use your own account
```

**5. Add to Claude Desktop**

Find your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Open it and add the `intervals` entry under `mcpServers` (replace the path with where you cloned this repo):

```json
{
  "mcpServers": {
    "intervals": {
      "command": "node",
      "args": ["/absolute/path/to/intervals-icu-mcp/dist/index.js"],
      "env": {
        "INTERVALS_API_KEY": "your_api_key_here",
        "INTERVALS_ATHLETE_ID": "0"
      }
    }
  }
}
```

> **What these fields mean:**
> - `command` — the program that runs the server (`node`)
> - `args` — the path to the built server file (update this to match your actual path)
> - `env` — environment variables passed to the server; put your API key here

**6. Restart Claude Desktop**

Close and reopen Claude Desktop. The Intervals tools will be available in any new conversation.

### Verifying it works

Start a new Claude conversation and ask:

> "What activities did I do last week?"

If Claude responds with your training data, setup is complete.

---

## Tools Reference

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
| `get_fitness_summary` | Daily CTL (fitness), ATL (fatigue), TSB (form), and ramp rate. Defaults to 3 months ago → 3 months ahead |

---

## Development

Run with the MCP Inspector (lets you test tools interactively):

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

---

## Requirements

- Node.js 18+
- An [Intervals.icu](https://intervals.icu) account
