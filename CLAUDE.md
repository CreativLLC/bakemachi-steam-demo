# Bakemachi Demo (化け町) — Steam Demo Build

This is the **packaged demo** fork of Bakemachi for Steam distribution.
Contains the train station chapter as a free playable demo.

## Build Commands
- `npm run build` — Build the Vite web app to `dist/`
- `npm run electron:preview` — Build + launch in Electron (test locally)
- `npm run electron:build` — Build + package as Windows installer (outputs to `release/`)
- `npm run electron:build:dir` — Build + package as unpacked directory (faster, for testing)

## Architecture
- Vite builds the game to `dist/`
- Electron loads `dist/index.html` via `electron/main.cjs`
- electron-builder packages everything into a distributable

## Steam Upload
1. Get your Steam App ID from Steamworks
2. Create `steam_appid.txt` with the App ID
3. Use SteamCMD to upload the `release/` output
