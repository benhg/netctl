# Net Control (netctl)

A desktop application for amateur radio net control operators. Manage check-ins, log communications, and generate ICS 309 forms.

## Features

- **Session Management** - Create net sessions with name, frequency, and net control operator info
- **Automatic Check-in** - Net control is automatically checked in as participant #1
- **Callsign Lookup** - Automatic name/QTH lookup via HamDB API with local caching
- **Tactical Callsigns** - Support for tactical calls alongside FCC callsigns
- **Communication Log** - Timestamped entries with From/To/Message per ICS 309 spec
- **Real-time Timer** - Track net duration from when the net opens
- **ICS 309 Preview** - Live preview of the ICS 309 form as you work
- **Export** - PDF and CSV export options
- **Persistent Storage** - SQLite database for sessions, participants, and logs

## Installation

### Prerequisites

**All platforms:**
- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install)

**Linux (Debian/Ubuntu):**
```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### Build from Source

```bash
npm install
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

### Development

```bash
npm run tauri dev
```

## Usage

1. **Create Session** - Enter net name, frequency, and net control operator info
2. **Open Net** - Click "Open Net" to start the timer and begin operations
3. **Check In Stations** - Enter callsigns (F2 to quick-focus). Name and location are auto-populated from HamDB
4. **Log Communications** - Click a participant to pre-fill the From field, or enter manually. Use "NC" for net control or "ALL" for all stations
5. **Preview/Export** - View the ICS 309 preview and export to PDF or CSV
6. **Close Net** - Click "Close Net" when finished

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Tauri (Rust) |
| State | Zustand |
| Database | SQLite (rusqlite) |
| PDF | pdf-lib |

## License

MIT
