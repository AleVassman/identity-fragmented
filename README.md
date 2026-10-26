# Identity // Fragmented (La Mia Vita)

An autobiographical, interactive 3D WebGL experience exploring memory loss, chronic illness, and the void. Built with **Three.js**, custom **GLSL shaders**, and dynamic soundscapes via the **Web Audio API**.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://YOUR-LIVE-URL.vercel.app)
[![Three.js](https://img.shields.io/badge/Three.js-r160+-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

---

## ✦ Conceptual Narrative

*Identity // Fragmented* is structured across three distinct psychological chapters:

1. **Act I // The Fog of Memory (`0.00 – 0.40`)**  
   Observed from an external perspective. A delicate, misty double helix represents pristine early memory. Loose memory clusters detach like cosmic dust motes and float away into the dark.
2. **Act II // The Collapse (`0.40 – 0.92`)**  
   The camera glides into the physical core of the DNA. The viewer is engulfed in a 360-degree storm of visceral blood-crimson disintegration, chaotic 3D turbulence, and somatic tremors representing chronic illness and depression.
3. **Act III // The Void (`0.92 – 1.00`)**  
   The structure completely fractures and dissolves. All light and sound extinguish into deafening, absolute silence.

---

## ✦ Key Technical Features

- **Procedural Double Helix:** Custom BufferGeometry generating 115,000 particles across 480 3D spatial units with organic volume jitter and variable cluster bindings.
- **Custom GLSL Shaders:** Hardware-accelerated particle animation handling organic cellular breathing, multi-octave turbulence fields, and localized decay without CPU bottlenecks.
- **Cinematic Camera Choreography:** Smooth transitions transitioning from an external 3/4 vantage point to a centered interior dolly tracking shot down the collapsing core.
- **Interactive Audio Engine:** Native Web Audio API implementation managing equal-power dynamic crossfades between acoustic ambient pads and bowed cello, culminating in silence.
- **Bilingual i18n System:** Seamless on-the-fly language switching (`IT | EN`) with persistent `localStorage` preference and automatic browser language detection.
- **Post-Processing Stack:** ACES Filmic Tone Mapping to prevent additive particle burnout, coupled with UnrealBloom and cinematic chromatic aberration.

---

## ✦ Audio Credits

- **Act I:** *"Adrift Among Infinite Stars"* by [Scott Buckley](https://www.scottbuckley.com.au/) (Licensed under CC-BY 4.0).
- **Act II:** *"The Darkest Cello Music"* (Cinematic dark ambient cello).

---

## ✦ Tech Stack

- **Graphics / Rendering:** Three.js, WebGL, Custom GLSL Shaders
- **Audio:** Web Audio API (MediaElementAudioSourceNode + GainNode routing)
- **Bundler / Tooling:** Vite
- **Styling:** Vanilla CSS (Cinematic Typography & Responsive HUD)

---

## ✦ Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/identity-fragmented.git
   cd identity-fragmented