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
 * A design system shown in both colour modes: the light screenshot slides in
 * from the left, the dark one follows from the right, both fully lit so the
 * two modes read as equal halves of the same theme.
 */
export const ThemeShowcaseScene: React.FC<{
  lightScreenshot: string;
  darkScreenshot: string;
  index: string;
  title: string;
  subtitle: string;
}> = ({ lightScreenshot, darkScreenshot, index, title, subtitle }) => {
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
            "radial-gradient(70% 75% at 50% 45%, rgba(129,140,248,0.28) 0%, rgba(5,6,15,0) 70%)",
          opacity: interpolate(frame, [0, 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      {(
        [
          { mode: "Light", src: lightScreenshot, left: 60, delay: 0 },
          { mode: "Dark", src: darkScreenshot, left: 1000, delay: 8 },
        ] as const
      ).map(({ mode, src, left, delay }) => (
        <Interactive.Div
          key={mode}
          name={`${mode} card`}
          style={{
            position: "absolute",
            top: 150,
            left,
            width: 860,
            height: 489,
            borderRadius: 20,
            overflow: "hidden",
            border: "3px solid #818CF8",
            boxShadow: "0 40px 90px rgba(0,0,0,0.65)",
            transformOrigin: "50% 50%",
            opacity: interpolate(frame, [delay, delay + 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            scale: interpolate(frame, [delay, delay + 34], [0.86, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
            }),
          }}
        >
          <Img name={`${mode} screenshot`} src={staticFile(src)} style={{ width: 860 }} />
        </Interactive.Div>
      ))}
      {(
        [
          { mode: "Light", left: 60 },
          { mode: "Dark", left: 1000 },
        ] as const
      ).map(({ mode, left }) => (
        <Interactive.Div
          key={mode}
          name={`${mode} label`}
          style={{
            position: "absolute",
            top: 672,
            left,
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
          {mode} Mode
        </Interactive.Div>
      ))}
      <SceneCaption index={index} title={title} subtitle={subtitle} />
    </AbsoluteFill>
  );
};
