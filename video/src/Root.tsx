import { Composition, Folder } from "remotion";
import "./index.css";
import { FeatureScene } from "./SpecPilot/FeatureScene";
import { IntroScene } from "./SpecPilot/IntroScene";
import { OutroScene } from "./SpecPilot/OutroScene";
import { Showcase } from "./SpecPilot/Showcase";
import { ThemeShowcaseScene } from "./SpecPilot/ThemeShowcaseScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SpecPilotShowcase"
        component={Showcase}
        durationInFrames={1530}
        fps={30}
        width={1920}
        height={1080}
      />
      <Folder name="Scenes">
        <Composition
          id="Intro"
          component={IntroScene}
          durationInFrames={110}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Feature"
          component={FeatureScene}
          durationInFrames={165}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            screenshot: "screenshots/landingPage.png",
            index: "01 / 07",
            title: "Landing Page",
            subtitle:
              "One clear promise, one call to action — straight into the generator.",
          }}
        />
        <Composition
          id="ThemeShowcase"
          component={ThemeShowcaseScene}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            lightScreenshot: "screenshots/classic-theme-light.png",
            darkScreenshot: "screenshots/classic-theme-dark.png",
            index: "02 / 07",
            title: "Classic Theme",
            subtitle:
              "The original look — soft surfaces, rounded pills, calm indigo accent.",
          }}
        />
        <Composition
          id="Outro"
          component={OutroScene}
          durationInFrames={165}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
