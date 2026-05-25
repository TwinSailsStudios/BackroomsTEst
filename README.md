# BACKROOMS — Level 0

A 3D first-person Backrooms game built with Three.js. No build step — just open `index.html` in a modern browser (Chrome, Firefox, Edge).

## Features

- **Infinite procedurally generated maze.** The world is divided into chunks that load around you as you walk; cells are generated from a deterministic hash so every coordinate looks the same every time you visit it.
- **Classic Backrooms aesthetic.** Damp yellow carpet, mono-yellow wallpaper, buzzing fluorescent ceiling tiles, heavy yellow fog, flickering light that follows you.
- **The Entity.** A tall dark figure with red eyes spawns somewhere out of sight after a while, navigates the maze toward you, and accelerates when you're close. Sanity drains the nearer it gets; if your sanity bottoms out you start taking damage. If it catches you, you die.
- **HUD.** Health, sanity, cell coordinates, time survived.

## Controls

| Key | Action |
|---|---|
| **WASD** | Move |
| **Mouse** | Look |
| **Shift** | Sprint |
| **Esc** | Pause |

## Run

```sh
# Any static file server works, e.g.:
python3 -m http.server 8000
# Then visit http://localhost:8000
```

Or open `index.html` directly — Three.js is loaded from a CDN via importmap.

## Files

- `index.html` — page, HUD, menu, styles
- `game.js` — Three.js scene, infinite chunk maze, collision, entity AI, game loop
