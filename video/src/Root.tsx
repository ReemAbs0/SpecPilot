import { Composition, Folder } from "remotion";
import "./index.css";
import { DarkModeScene } from "./SpecPilot/DarkModeScene";
import { FeatureScene } from "./SpecPilot/FeatureScene";
import { IntroScene } from "./SpecPilot/IntroScene";
import { LightModeScene } from "./SpecPilot/LightModeScene";
import { OutroScene } from "./SpecPilot/OutroScene";
import { Showcase } from "./SpecPilot/Showcase";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SpecPilotShowcase"
        component={Showcase}
        durationInFrames={1800}
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
            screenshot: "screenshots/landingPage-material-theme-dark.png",
            index: "01 / 08",
            title: "Landing Page",
            subtitle:
              "One clear promise, one call to action — straight into the generator.",
          }}
        />
        <Composition
          id="LightMode"
          component={LightModeScene}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="DarkMode"
          component={DarkModeScene}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
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
