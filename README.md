# Music Notebook

A learning tool for piano beginners to practice ear training, understand chord progressions, and master songs through hands-on annotation. Whether you're learning existing songs you love or working on your own compositions, this notebook helps you analyze structure, identify patterns, and build your musical understanding.

## What It's For

This is designed to support your practice workflow:

1. **Listen** to a song (Bollywood, pop, your own recordings)
2. **Figure out** the chords by ear or with help
3. **Annotate** the structure (mukhda/chorus, antara/verse, interludes)
4. **Understand** patterns using Roman numerals (see how I-V-vi-IV appears everywhere!)
5. **Practice** in different keys using transposition
6. **Reference** start times to quickly jump to sections in your recording

Perfect for iPad/phone at the piano, with automatic light/dark mode.

## Features

- **Chord annotation**: Click any word to add a chord above it using a smart palette based on your song's key
- **Roman numeral analysis**: See chords as I, IV, V to understand relationships and patterns across keys
- **Song structure**: Label sections as mukhda (chorus), antara (verse), prelude, interlude, outro
- **Transposition**: Practice the same song in different keys instantly
- **Start times**: Mark where each section starts in your reference recording
- **Backup/Restore**: Export all your songs as JSON, import on any device
- **ChordPro export**: Share with apps like OnSong and SongbookPro
- **Local storage**: Songs saved automatically in your browser
- **Search**: Filter through your growing song library

## How to Use

### Learning a New Song

1. **Start**: Click "New song" and give it a title
2. **Add lyrics**: Click "Paste lyrics" and paste from any lyrics site. Blank lines split sections.
3. **Structure**: Use dropdowns to label each section (mukhda, antara, etc.) and add start times from your recording
4. **Set key**: Choose the original key of the song
5. **Add chords**:
   - Click any word to open the chord palette
   - Solid border = in the key (diatonic chords)
   - Dashed border = borrowed chords (common variations)
   - Or type any chord name (supports slash chords like C/E)
6. **Learn patterns**: Toggle to "Numerals" view to see chord relationships (helps you recognize patterns)
7. **Practice different keys**: Use transpose +/− if you want to sing/play in a different key

### For Instrumentals

Click "Add instrumental section" and enter chords like: `F | Dm | Bb | C`

### Understanding Roman Numerals

- Upper case (I, IV, V) = major chords
- Lower case (ii, vi) = minor chords
- ° = diminished
- This helps you see that many songs use the same *patterns* (I-V-vi-IV) in different keys

## Running Locally

Just open `index.html` in any modern web browser. No build step, no dependencies.

```bash
# Option 1: Direct file
open index.html

# Option 2: Local server (if you prefer)
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## GitHub Pages

Enable Pages in your repo settings pointing to the main branch root, and it'll be live at `https://yourusername.github.io/music-notebook/`.

## Backing Up Your Work

Use the **Backup all** button to download all your songs as JSON. Save this file somewhere safe! You can restore it later on any device/browser using the **Restore** button.

Individual songs can also be exported as ChordPro text for sharing or use in other apps.

## Technical Notes

- Single HTML file + CSS + JS, no build step, no framework
- Works offline once loaded
- Supports light and dark mode (automatic based on system preference)
- Responsive design optimized for phone, tablet, and desktop
- Touch-friendly chord palette for use at the piano

## For Piano Beginners

This tool grows with you:
- **Starting out**: Copy chords from tabs/tutorials and organize them
- **Ear training**: Try figuring out chords yourself, using the palette as hints
- **Music theory**: Roman numerals help you understand *why* chord progressions work
- **Repertoire building**: Build a searchable library of songs you've learned

## Contributing

This is a personal learning tool kept intentionally minimal. The architecture is documented in `CLAUDE.md`.
