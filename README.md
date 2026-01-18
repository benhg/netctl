# Net Control (netctl)

A desktop application for running ham radio nets with ICS 309 form generation, participant management, and real-time logging.

## Features

- **Net Session Management**: Create and manage net sessions with metadata (net name, frequency, net control operator)
- **Real-time Timer**: Track net duration from session start
- **Participant Check-in**: Quick entry for callsigns with automatic name/QTH lookup via HamDB API
- **Communication Log**: Timestamped log entries per ICS 309 specification
- **ICS 309 Preview**: Real-time preview of the ICS 309 form
- **Export Options**: Export to PDF or CSV formats
- **SQLite Database**: Persistent storage for sessions, participants, and log entries

## Technology Stack

- **Frontend**: React + TypeScript
- **Backend**: Tauri (Rust)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **PDF Generation**: pdf-lib
- **Database**: SQLite via rusqlite

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://tauri.app/v2/guides/getting-started/prerequisites)

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Usage

1. **Start a New Session**: Enter net name, frequency, and net control operator info
2. **Check In Stations**: Enter callsigns - the app will auto-lookup name and location from HamDB
3. **Log Communications**: Click on a participant to create a log entry, or manually enter From/To callsigns
4. **Preview ICS 309**: Click "Show ICS 309 Preview" to see the form in real-time
5. **Export**: Export to PDF or CSV when the net is complete
6. **Close Net**: Click "Close Net" to finalize the session

## Keyboard Shortcuts

- **F2**: Focus the callsign input field for quick check-ins

## ICS 309 Form Fields

Per FEMA ICS 309 specification:
1. Incident Name (Net Name)
2. Operational Period (Start time and status)
3. Radio Operator (Net Control callsign and name)
4. Log entries table (Time, Entry #, From, To, Message)
5. Page number
6. Prepared by (signature line)

## License

MIT
