import { Audio } from "@remotion/media";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { DarkModeScene } from "./DarkModeScene";
import { FeatureScene } from "./FeatureScene";
import { IntroScene } from "./IntroScene";
import { LightModeScene } from "./LightModeScene";
import { OutroScene } from "./OutroScene";

/**
 * 60s showcase at 30fps: 1980 frames of scenes minus 12 x 15 frame
 * transitions = 1800 frames.
 */
export const Showcase: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#05060F" }}>
      {/* Music is longer than the video, so trim it to the 1800 frame timeline. */}
      <Audio
        name="Background music"
        src={staticFile("music.mp3")}
        trimAfter={1800}
        volume={(f) =>
          interpolate(f, [0, 30, 1770, 1800], [0, 0.25, 0.25, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.linear,
          })
        }
      />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={110} name="Intro">
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={165} name="Landing Page">
          <FeatureScene
            screenshot="screenshots/landingPage-material-theme-dark.png"
            index="01 / 08"
            title="Landing Page"
            subtitle="One clear promise, one call to action — straight into the generator."
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: 15,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={165} name="AI Generation">
          <FeatureScene
            screenshot="screenshots/generator.png"
            index="02 / 08"
            title="AI Specification Generation"
            subtitle="Describe your project in plain English — tips and examples alongside."
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: 15,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={145} name="Generating">
          <FeatureScene
            screenshot="screenshots/generating.png"
            index="02 / 08"
            title="The AI Gets to Work"
            subtitle="Watch the agent draft requirements and write user stories, live."
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: 15,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={165} name="Specification">
          <FeatureScene
            screenshot="screenshots/specification.png"
            index="02 / 08"
            title="A Complete Specification"
            subtitle="Summary, users, roles and milestones — download or copy in one click."
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={150} name="Sign In">
          <FeatureScene
            screenshot="screenshots/sign-in.png"
            index="03 / 08"
            title="Sign In"
            subtitle="Email and password sign-in, so your work follows you between devices."
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: 15,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={150} name="Sign Up">
          <FeatureScene
            screenshot="screenshots/create-account.png"
            index="03 / 08"
            title="Sign Up"
            subtitle="Create an account in seconds — generating stays open to everyone."
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={165} name="Library">
          <FeatureScene
            screenshot="screenshots/library-of-specifications.png"
            index="04 / 08"
            title="Saved Specifications Library"
            subtitle="Every specification you generate while signed in is saved for later."
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={150} name="Classic Theme">
          <FeatureScene
            screenshot="screenshots/classic-theme-light.png"
            index="05 / 08"
            title="Classic Theme"
            subtitle="The original look — soft surfaces, rounded pills, calm indigo accent."
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: 15,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={150} name="Material Theme">
          <FeatureScene
            screenshot="screenshots/material-theme-light.png"
            index="06 / 08"
            title="Material Theme"
            subtitle="Swap to Material Design at runtime — bold app bar, MUI components."
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={150} name="Light Mode">
          <LightModeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: 15,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={150} name="Dark Mode">
          <DarkModeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={165} name="Outro">
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Interactive.Div
        name="Progress bar"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 5,
          backgroundColor: "#818CF8",

          width: interpolate(frame, [0, 1800], [0, 1920], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.linear,
          }),

          rotate: "0.5deg",
        }}
      />
    </AbsoluteFill>
  );
};
