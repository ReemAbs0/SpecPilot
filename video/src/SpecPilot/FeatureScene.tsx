import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fontFamily } from "./font";
import { SceneCaption } from "./SceneCaption";

/**
 * A single feature: the screenshot fills the top 780px of the frame and
 * slowly pans, the caption band below holds the title and subtitle.
 */
export const FeatureScene: React.FC<{
  screenshot: string;
  index: string;
  title: string;
  subtitle: string;
}> = ({ screenshot, index, title, subtitle }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#05060F", fontFamily }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 780,
          overflow: "hidden",
          backgroundColor: "#05060F",
        }}
      >
        <Img
          name="Screenshot"
          src={staticFile(screenshot)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1920,
            transformOrigin: "50% 0%",
            opacity: interpolate(frame, [0, 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            scale: interpolate(frame, [0, 160], [1, 1.06], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.33, 0, 0.67, 1),
              output: "perceptual-scale",
            }),
          }}
        />
        <Interactive.Div
          name="Bottom blend"
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 1920,
            height: 180,
            background:
              "linear-gradient(180deg, rgba(5,6,15,0) 0%, rgba(10,11,24,0.95) 100%)",
          }}
        />
        <Interactive.Div
          name="Edge vignette"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1920,
            height: 780,
            background:
              "radial-gradient(120% 100% at 50% 30%, rgba(5,6,15,0) 55%, rgba(5,6,15,0.55) 100%)",
          }}
        />
      </div>
      <SceneCaption index={index} title={title} subtitle={subtitle} />
    </AbsoluteFill>
  );
};
