# Chord Notebook

A single-file web app for learning songs on piano by ear. Paste lyrics, add chords above words, transpose, and organize into labeled sections (prelude, mukhda, antara, etc.).

Perfect for Bollywood songs and works great on iPad/phone at the piano.

## Features

- **Chord annotation**: Click any word to add a chord above it using a smart palette based on your song's key
- **Song structure**: Label sections as mukhda (chorus), antara (verse), interlude, etc.
- **Transposition**: Easily transpose up or down by semitones
- **Display modes**: View chords as names (F, Dm), Roman numerals (I, iim), or both
- **Start times**: Track where each section starts in your reference recording
- **Import/Export**: ChordPro format for compatibility with apps like OnSong and SongbookPro
- **Local storage**: Songs saved automatically in your browser

## How to Use

1. **Start a song**: Click "New song" or edit the example
2. **Add lyrics**: Click "Paste lyrics" and paste from any lyrics site. Blank lines split sections.
3. **Label sections**: Use the dropdown to mark each as mukhda, antara, prelude, etc.
4. **Add chords**: Click any word to open the chord palette. Choose from diatonic chords (solid) or common borrowed chords (dashed).
5. **Set the key**: Use the toolbar to set the original key of the song
6. **Transpose**: Use +/− buttons if you want to play in a different key
7. **Add instrumental sections**: Click "Add instrumental section" and enter chords like `F | Dm | Bb | C`

## Running Locally

Just open `index.html` in any modern web browser. That's it! No build step, no dependencies.

```bash
# Option 1: Direct file
open index.html

# Option 2: Local server (if you prefer)
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## GitHub Pages

This repo is designed to run on GitHub Pages. Just enable Pages in your repo settings pointing to the main branch root, and it'll be live at `https://yourusername.github.io/music-notebook/`.

## Data Storage

Songs are saved in your browser's localStorage. Each browser on each device has its own storage. To back up or transfer songs, use the Export button to save as ChordPro text files.

## Technical Notes

- Single HTML file, no build step, no framework
- Works offline once loaded
- Supports light and dark mode (automatic based on system preference)
- Responsive design optimized for phone, tablet, and desktop

## Contributing

This is a personal tool kept intentionally minimal. The architecture is documented in `CLAUDE.md`.
