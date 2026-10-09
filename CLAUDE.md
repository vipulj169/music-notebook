# Architecture Documentation

## Overview

Music-notebook is a single-file web app for learning songs on piano by ear. It helps organize lyrics with chord annotations, supports transposition, and displays chords as names or Roman numerals.

## Ground Rules

**Critical constraints for all changes:**
- Must remain a single static `index.html` with no build step and no framework
- Must run on GitHub Pages as-is
- Keep the UI simple; prioritize ease of use over features
- Must work well on phone/iPad at the piano
- Must support both light and dark mode
- Never use real copyrighted lyrics in examples or tests

## Data Model

### State Structure
```javascript
state = {
  songs: [],      // Array of song objects
  current: "",    // Currently selected song ID
  view: "name"    // Display mode: "name" | "both" | "roman"
}
```

Stored in `localStorage` under key `chordNotebook.v1`.

### Song Object
```javascript
{
  id: string,           // Unique identifier
  title: string,
  example: boolean,     // Flag for the built-in example
  key: {
    root: 0-11,        // Pitch class (C=0, C#/Db=1, etc.)
    minor: boolean
  },
  transpose: -11..11,  // Semitones to transpose display
  blocks: []           // Array of section blocks
}
```

### Block Types

**Lyric Block:**
```javascript
{
  id: string,
  kind: "lyr",
  section: "prelude|mukhda|antara|interlude|outro|other",
  label: string,        // Optional label like "1", "repeat"
  time: string,         // Start time in recording, e.g. "1:23"
  lines: [              // 2D array
    [{t: "word", c: "F"}, {t: "another", c: "Dm"}],
    [...]
  ]
}
```

**Instrumental Block:**
```javascript
{
  id: string,
  kind: "inst",
  section: "prelude|mukhda|antara|interlude|outro|other",
  label: string,
  time: string,
  bars: string         // e.g. "F | Dm | Bb | C"
}
```

## Music Helpers

### Core Functions

- **Pitch classes**: Notes stored as 0-11 (C through B)
- **parseChord(s)**: Parses "F#m7/C#" → `{root, q: quality, bass}`
- **transposeChord(s, n, flats)**: Transposes chord by n semitones
- **useFlats(root, minor)**: Decides sharp vs flat notation based on key
- **roman(chord, tonic)**: Converts chord to Roman numeral relative to tonic
- **palette(tonic, minor)**: Generates diatonic chords + common borrowed chords

### Borrowed Chords
Palette includes diatonic chords (solid border in UI) plus common borrowed chords (dashed border):
- Major keys: ♭VI, ♭VII, vm, IV (borrowed from parallel minor)
- Minor keys: V, ♭II, I, VII° (from harmonic/melodic minor and major)

## Rendering Architecture

### Pattern
1. **State mutation** → `save()` → `render()`
2. Pure vanilla JS, no virtual DOM
3. Event delegation on container elements
4. Inline editing using temporary state variables

### Key State Variables
```javascript
editing: null | blockId    // Block currently being edited
confirmDel: null | blockId // Block awaiting delete confirmation
sel: null | {b, l, w}     // Selected word for chord palette
confirmSong: boolean       // Song delete confirmation state
pop: null | HTMLElement   // Chord popover element
```

### Render Flow
- Song selector and title
- Toolbar: key, transpose, view mode, import/export
- Outline strip: quick navigation chips for all sections
- Blocks: each section renders header + content
  - Lyric blocks: words as buttons with chords floating above
  - Instrumental blocks: chord symbols separated by bars
  - Edit mode: textarea or input field

### Event Handling
- Event delegation on `#blocks` container
- Data attributes for actions: `data-act="up|down|dup|edit|del|..."`
- Popover for chord entry with palette buttons
- Modals for paste, import, export

## ChordPro Import/Export

### Export Format
```
{title: Song Name}
{key: Fm}

{comment: Mukhda @ 0:14}
[F]Word [Dm]word [Bb]word [C]word

{comment: Interlude @ 0:42}
[F] | [Dm] | [Bb] | [C]
```

### Import Logic
- `{title:}`, `{key:}` set metadata
- `{comment:}`, `{start_of_*}` start new sections
- Section names (mukhda, antara, etc.) are guessed from labels
- All-chord-only rows become instrumental blocks
- Mixed content becomes lyric blocks

## CSS Architecture

### CSS Variables
Theme uses CSS custom properties with automatic dark mode via `@media (prefers-color-scheme: dark)` and explicit `data-theme` attribute.

Key variables:
- Colors: `--bg`, `--paper`, `--ink`, `--muted`, `--line`
- Chords: `--chord`, `--chord-bg`
- Sections: `--sec-mukhda`, `--sec-antara`, `--sec-inst`, `--sec-other`
- Typography: `--f-display` (Rozha One), `--f-body` (Hind), `--f-chord` (JetBrains Mono)

### Layout Strategy
- Single centered column (max 860px)
- Flexbox for all layout
- Sticky toolbar for key controls
- Mobile-first responsive design
- Safe area insets for iOS notch/home indicator

## Helper Utilities

```javascript
uid()           // Generate random ID
mod(n)          // Modulo 12 for pitch classes
esc(s)          // HTML escape for security
$(id)           // getElementById shorthand
```

## Extension Points

When adding features, consider:
1. Will it add build complexity? (No builds allowed)
2. Does it work on mobile/touch? (Required)
3. Does it complicate the UI? (Keep it simple)
4. Does localStorage need schema migration? (Handle gracefully)

Common extension patterns:
- New block types: Add to render switch, update save/load
- New chord display modes: Add to `chordHTML()` and view buttons
- New import/export: Add modal + converter functions
- New section types: Add to `SECTIONS` array
