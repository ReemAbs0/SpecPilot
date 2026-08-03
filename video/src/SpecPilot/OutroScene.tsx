import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { fontFamily } from "./font";
import { RocketMark } from "./RocketMark";

/** Mirrors the scene order in Showcase.tsx. */
const RECAP = [
  "Landing Page",
  "Classic Theme",
  "Material Theme",
  "Light & Dark",
  "Sign In / Sign Up",
  "AI Generation",
  "Saved Library",
];

export const OutroScene: React.FC = () => {
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
        gap: 40,
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
            "radial-gradient(55% 60% at 50% 45%, rgba(79,70,229,0.5) 0%, rgba(5,6,15,0) 70%)",
          opacity: interpolate(frame, [0, 36], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, 165], [0.85, 1.18], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 0, 0.67, 1),
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
          width: 128,
          height: 128,
          borderRadius: 32,
          backgroundColor: "#12142B",
          border: "2px solid #312E81",
          boxShadow: "0 30px 80px rgba(79,70,229,0.45)",
          transformOrigin: "50% 50%",
          opacity: interpolate(frame, [0, 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, 36], [0.5, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 16 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <RocketMark size={72} color="#A5B4FC" />
      </Interactive.Div>
      <Interactive.Div
        name="Project name"
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 20,
          fontSize: 66,
          opacity: interpolate(frame, [14, 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [14, 46], ["0px 34px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <span style={{ fontWeight: 800, color: "#F8FAFC", letterSpacing: -2 }}>
          SpecPilot
        </span>
        <span style={{ fontWeight: 400, color: "#4B5473" }}>–</span>
        <span style={{ fontWeight: 500, color: "#A5B4FC" }}>
          AI Software Specification Generator
        </span>
      </Interactive.Div>
      <Interactive.Div
        name="Divider"
        style={{
          width: 220,
          height: 3,
          backgroundColor: "#4F46E5",
          opacity: interpolate(frame, [34, 56], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [34, 66], [0.2, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      />
      <Interactive.Div
        name="Feature recap"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 18,
          maxWidth: 1180,
          opacity: interpolate(frame, [50, 80], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [50, 86], ["0px 24px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {RECAP.map((item) => (
          <div
            key={item}
            style={{
              paddingLeft: 26,
              paddingRight: 26,
              paddingTop: 12,
              paddingBottom: 12,
              borderRadius: 999,
              border: "1px solid #262B45",
              backgroundColor: "rgba(18,20,43,0.7)",
              fontSize: 28,
              fontWeight: 500,
              color: "#C7D2FE",
            }}
          >
            {item}
          </div>
        ))}
      </Interactive.Div>
      <Interactive.Div
        name="Closing line"
        style={{
          marginTop: 10,
          fontSize: 34,
          fontWeight: 400,
          color: "#7A839C",
          opacity: interpolate(frame, [76, 104], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Describe your idea. Get a production-ready specification.
      </Interactive.Div>
    </AbsoluteFill>
  );
};
