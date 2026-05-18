# Polaroid POC

5 polaroid travel cards with realistic flutter + tumble physics. Single-file scene for the travel-agent landing.

## Stack
- Vite + React + TypeScript
- GSAP (free since Apr 2024)
- Tailwind v3
- Hard-coded Unsplash photos (5 Egypt locations)

## Scripts
```
npm install
npm run dev      # local dev on :5173
npm run build    # production build
npm run start    # serves dist on $PORT (Railway entrypoint)
```

## Animation principles (from OSINT)
- 3D stage via `perspective: 1400px` on parent + `transform-style: preserve-3d`
- Stagger 120ms between cards
- `back.out(1.6)` overshoot easing on entrance
- Landing "клац" — scale 1.06 → 1.0 squash via GSAP keyframes
- Idle wobble per card (desynced RAF-cheap)
- Drop animation — lift-then-fall with random rotZ/rotX tumble (Cornell flutter-tumble)
- `will-change: transform` ON during animation, OFF at rest (compositor-storm protection)

## References emulated
- Codrops Polaroid Stack to Grid
- Awwwards SOTD polaroid.com
