import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { fontFamily } from "./font";
import { RocketMark } from "./RocketMark";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05060F",
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 34,
      }}
    >
      <Interactive.Div
        name="Glow"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          background:
            "radial-gradient(50% 55% at 50% 48%, rgba(79,70,229,0.55) 0%, rgba(5,6,15,0) 70%)",
          opacity: interpolate(frame, [0, 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, 110], [0.7, 1.15], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      />
      <Interactive.Div
        name="Logo mark"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 148,
          height: 148,
          borderRadius: 36,
          backgroundColor: "#12142B",
          border: "2px solid #312E81",
          boxShadow: "0 30px 80px rgba(79,70,229,0.45)",
          transformOrigin: "50% 50%",
          opacity: interpolate(frame, [0, 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, 34], [0.4, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 14 }),
            output: "perceptual-scale",
          }),
          rotate: interpolate(frame, [0, 34], ["-25deg", "0deg"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 14 }),
          }),
        }}
      >
        <RocketMark size={82} color="#A5B4FC" />
      </Interactive.Div>
      <Interactive.Div
        name="Wordmark"
        style={{
          fontSize: 138,
          fontWeight: 800,
          letterSpacing: -4,
          color: "#F8FAFC",
          opacity: interpolate(frame, [14, 34], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [14, 40], ["0px 40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        SpecPilot
      </Interactive.Div>
      <Interactive.Div
        name="Tagline"
        style={{
          fontSize: 46,
          fontWeight: 500,
          color: "#A5B4FC",
          opacity: interpolate(frame, [26, 48], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [26, 52], ["0px 28px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        AI Software Specification Generator
      </Interactive.Div>
      <Interactive.Div
        name="Kicker"
        style={{
          marginTop: 18,
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 14,
          paddingBottom: 14,
          borderRadius: 999,
          border: "1px solid #312E81",
          backgroundColor: "rgba(49,46,129,0.25)",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: 6,
          color: "#C7D2FE",
          opacity: interpolate(frame, [40, 62], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        PRODUCT SHOWCASE
      </Interactive.Div>
    </AbsoluteFill>
  );
};
