# SpecPilot product showcase video

A 60-second (1800 frames @ 30fps, 1920x1080) product showcase built with
[Remotion](https://www.remotion.dev).

## Commands

```console
npm i                  # install dependencies
npm run dev            # open Remotion Studio to preview / edit
npx remotion render SpecPilotShowcase out/SpecPilot-Showcase.mp4 \
  --codec=h264 --crf=18 --jpeg-quality=95
```

## Compositions

| ID                  | What it is                                    |
| ------------------- | --------------------------------------------- |
| `SpecPilotShowcase` | The full 60s video — this is what you render. |
| `Scenes/*`          | Individual scenes, for editing in isolation.  |

## Structure

`src/SpecPilot/Showcase.tsx` is the timeline: a `<TransitionSeries>` of 13
sequences joined by 12 fifteen-frame transitions (fades between sections,
slides within a section). Scene durations are inline so they can be trimmed
visually in the Studio.

| #   | Scene                       | Frames | Screenshot                             |
| --- | --------------------------- | ------ | -------------------------------------- |
| —   | Intro                       | 110    | —                                      |
| 01  | Landing Page                | 165    | `landingPage-material-theme-dark.png`  |
| 02  | AI Specification Generation | 165    | `generator.png`                        |
| 02  | The AI Gets to Work         | 145    | `generating.png`                       |
| 02  | A Complete Specification    | 165    | `specification.png`                    |
| 03  | Sign In                     | 150    | `sign-in.png`                          |
| 03  | Sign Up                     | 150    | `create-account.png`                   |
| 04  | Saved Specifications Library | 165   | `library-of-specifications.png`         |
| 05  | Classic Theme               | 150    | `classic-theme-light.png`              |
| 06  | Material Theme              | 150    | `material-theme-light.png`             |
| 07  | Light Mode                  | 150    | `classic-theme-light` + `-dark` paired |
| 08  | Dark Mode                   | 150    | `classic-theme-dark` + `-light` paired |
| —   | Outro                       | 165    | —                                      |

`1980` sequence frames − `180` transition frames = `1800` = exactly 60s.

Feature scenes share `FeatureScene.tsx`: the screenshot fills the top 780px
and slowly zooms, and `SceneCaption.tsx` renders the lower-third band with the
title and subtitle so no app UI is ever covered. Light/Dark mode get their own
paired-card scenes so both appearances are visible at once.

## Music

`public/music.mp3` plays from frame 0 at 25% volume, trimmed to the 1800-frame
timeline (the source track is 2:16). The `volume` callback in `Showcase.tsx`
fades in over frames 0–30 and out over frames 1770–1800.

## Screenshots

`public/screenshots/` is a copy of `frontend/dist/assets/screenshots/`. The
`dist/` original is a gitignored build artifact, so the copy here is what keeps
the video reproducible. `generating.png` was cropped to remove the browser
chrome that the other captures don't have.

To refresh a screenshot, drop the new PNG into `public/screenshots/` with the
same filename and re-render.
