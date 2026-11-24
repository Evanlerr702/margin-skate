# Margin Skate

A notebook-style interactive skateboard scene. Control the audience and watch a stick-figure skater respond.

## Run

Open `index.html` in a modern browser. No installation or build step is needed. Click **Enable sound** to start browser-generated audio.

## Controls

- Cheer, Quiet, or Heckle (keyboard shortcuts: 1, 2, 3).
- Crowd slider: 0–40 spectators, with sound intensity increasing alongside the crowd.
- Cheer tricks: below 60% easy riding; 60–79% ollie; 80–99% grab; 100% kickflip.
- Pause, reset, and sound mute controls.

## Files

- `index.html`: interface and learning notes.
- `style.css`: responsive notebook styling.
- `app.js`: canvas animation, crowd state, confidence logic, and Web Audio synthesis.

The game respects reduced-motion preferences. Sound requires a user interaction. Google Fonts are optional; system fonts are used when offline.

## Course reflection

The **Behind the doodle** panel explains the interaction logic and offers reflection prompts. Add your actual AI conversation share link and your own observations to your course submission.

## Validation

JavaScript syntax and scripted checks passed for confidence transitions, pause/reset, spectator counts, and exact trick thresholds. Browser audio playback has not been verified in the development environment.
