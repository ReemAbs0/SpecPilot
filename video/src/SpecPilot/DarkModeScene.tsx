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

/** Dark mode: the dark screenshot steps forward, light recedes. */
export const DarkModeScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#05060F", fontFamily }}>
      <Interactive.Div
        name="Glow"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 780,
          background:
            "radial-gradient(60% 70% at 72% 45%, rgba(79,70,229,0.35) 0%, rgba(5,6,15,0) 70%)",
          opacity: interpolate(frame, [0, 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <Interactive.Div
        name="Light card"
        style={{
          position: "absolute",
          top: 150,
          left: 60,
          width: 860,
          height: 489,
          borderRadius: 20,
          overflow: "hidden",
          border: "3px solid #1E2338",
          boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
          filter: "saturate(0.4)",
          transformOrigin: "50% 50%",
          opacity: interpolate(frame, [6, 26], [0, 0.4], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [6, 40], [0.82, 0.9], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <Img
          name="Light screenshot"
          src={staticFile("screenshots/classic-theme-light.png")}
          style={{ width: 860 }}
        />
      </Interactive.Div>
      <Interactive.Div
        name="Dark card"
        style={{
          position: "absolute",
          top: 150,
          left: 1000,
          width: 860,
          height: 489,
          borderRadius: 20,
          overflow: "hidden",
          border: "3px solid #818CF8",
          boxShadow: "0 40px 90px rgba(0,0,0,0.65)",
          transformOrigin: "50% 50%",
          opacity: interpolate(frame, [0, 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, 34], [0.82, 1.05], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <Img
          name="Dark screenshot"
          src={staticFile("screenshots/classic-theme-dark.png")}
          style={{ width: 860 }}
        />
      </Interactive.Div>
      <Interactive.Div
        name="Inactive label"
        style={{
          position: "absolute",
          top: 672,
          left: 60,
          width: 860,
          textAlign: "center",
          fontSize: 34,
          fontWeight: 500,
          color: "#4B5473",
          letterSpacing: 2,
          opacity: interpolate(frame, [22, 42], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Light
      </Interactive.Div>
      <Interactive.Div
        name="Active label"
        style={{
          position: "absolute",
          top: 672,
          left: 1000,
          width: 860,
          textAlign: "center",
          fontSize: 34,
          fontWeight: 700,
          color: "#C7D2FE",
          letterSpacing: 2,
          opacity: interpolate(frame, [22, 42], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Dark
      </Interactive.Div>
      <SceneCaption
        index="08 / 08"
        title="Dark Mode"
        subtitle="A deep, low-glare palette for long sessions."
      />
    </AbsoluteFill>
  );
};
