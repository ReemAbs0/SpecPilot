# SpecPilot product showcase video

A 51-second (1530 frames @ 30fps, 1920x1080) product showcase built with
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
| `SpecPilotShowcase` | The full 51s video — this is what you render. |
| `Scenes/*`          | Individual scenes, for editing in isolation.  |

## Structure

`src/SpecPilot/Showcase.tsx` is the timeline: a `<TransitionSeries>` of 11
sequences joined by 10 fifteen-frame transitions (fades between sections,
slides within a section). Scene durations are inline so they can be trimmed
visually in the Studio.

| #   | Scene                       | Frames | Screenshot                              |
| --- | --------------------------- | ------ | --------------------------------------- |
| —   | Intro                       | 110    | —                                       |
| 01  | Landing Page                | 165    | `landingPage.png`                       |
| 02  | Classic Theme               | 150    | `classic-theme-light` + `-dark` paired  |
| 02  | Material Theme              | 150    | `material-theme-light` + `-dark` paired |
| 03  | Sign In                     | 150    | `sign-in.png`                           |
| 03  | Sign Up                     | 150    | `create-account.png`                    |
| 04  | AI Specification Generation | 165    | `generator.png`                         |
| 05  | The AI Gets to Work         | 145    | `generating.png`                        |
| 06  | A Complete Specification    | 165    | `specification.png`                     |
| 07  | Saved Specifications Library | 165   | `library-of-specifications.png`          |
| —   | Outro                       | 165    | —                                       |

The order tells a story: land on the product, show the four looks it comes in,
sign in, then walk the generate → generating → result flow through to the saved
library. The Outro's `RECAP` chip list mirrors this order.

`1680` sequence frames − `150` transition frames = `1530` = exactly 51s.

Feature scenes share `FeatureScene.tsx`: the screenshot fills the top 780px
and slowly zooms, and `SceneCaption.tsx` renders the lower-third band with the
title and subtitle so no app UI is ever covered.

The theme showcase (scenes 05–06) instead uses `ThemeShowcaseScene.tsx`, which
puts each design system's light and dark capture side by side — both cards fully
lit and labelled — so one scene covers both colour modes. These two scenes are
where the light/dark axis is demonstrated; there are no separate colour-mode
scenes.

## Music

`public/music.mp3` plays from frame 0 at 25% volume, trimmed to the 1530-frame
timeline (the source track is 2:16). The `volume` callback in `Showcase.tsx`
fades in over frames 0–30 and out over frames 1500–1530.

## Screenshots

`public/screenshots/` is a copy of `frontend/dist/assets/screenshots/`. The
`dist/` original is a gitignored build artifact, so the copy here is what keeps
the video reproducible. `generating.png` was cropped to remove the browser
chrome that the other captures don't have.

To refresh a screenshot, drop the new PNG into `public/screenshots/` with the
same filename and re-render.
